import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query, paginatedQuery } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getSkillIds,
  URGENCY_LEVELS,
  SERVICE_TYPES,
} from '@/config/it-hilfe'
import { rateLimiters } from '@/lib/security/rate-limit'
import { sanitizeInput } from '@/lib/security/sanitize'
import { itHilfeRequestSchema, validateAndRespond } from '@/lib/validation/schemas'
import { type RequestRow, mapRequestListRow } from '@/lib/it-hilfe/request-mapper'
import { sendRequestCreatedNotifications } from '@/lib/it-hilfe/notifications'

/**
 * GET /api/it-hilfe/requests
 * Browse IT-Hilfe requests with filters (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const category = searchParams.get('category')
    const canton = searchParams.get('canton')
    const urgency = searchParams.get('urgency')
    const budgetType = searchParams.get('budgetType')
    const serviceType = searchParams.get('serviceType')
    const skill = searchParams.get('skill')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'open'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Map frontend sort values to DB columns
    const sortMap: Record<string, { field: string; order: string }> = {
      newest: { field: 'created_at', order: 'DESC' },
      urgent: { field: 'urgency', order: 'DESC' },
      budget_high: { field: 'budget_amount_cents', order: 'DESC' },
      offers: { field: 'offer_count', order: 'DESC' },
    }
    const sortParam = searchParams.get('sort') || searchParams.get('sortBy') || 'newest'
    const sortConfig = sortMap[sortParam] || sortMap.newest

    // Build WHERE conditions
    const conditions: string[] = ['r.status = $1', 'r.expires_at > NOW()']
    const params: (string | number)[] = [status]
    let paramIndex = 2

    if (category && getCategoryIds().includes(category)) {
      conditions.push(`r.category_id = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (canton) {
      conditions.push(`r.canton = $${paramIndex}`)
      params.push(canton)
      paramIndex++
    }

    if (urgency && URGENCY_LEVELS.some(u => u.id === urgency)) {
      conditions.push(`r.urgency = $${paramIndex}`)
      params.push(urgency)
      paramIndex++
    }

    // Budget filter: 'free' for null/0, 'paid' for amount > 0
    if (budgetType === 'free') {
      conditions.push(`(r.budget_amount_cents IS NULL OR r.budget_amount_cents = 0)`)
    } else if (budgetType === 'paid') {
      conditions.push(`r.budget_amount_cents > 0`)
    }

    if (serviceType && SERVICE_TYPES.some(s => s.id === serviceType)) {
      conditions.push(`r.service_type = $${paramIndex}`)
      params.push(serviceType)
      paramIndex++
    }

    if (skill && getSkillIds().includes(skill)) {
      conditions.push(`$${paramIndex} = ANY(r.skills_needed)`)
      params.push(skill)
      paramIndex++
    }

    // Text search across title, description, device brand/model
    if (search && search.trim().length >= 2) {
      const searchPattern = `%${search.trim()}%`
      conditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.device_brand ILIKE $${paramIndex} OR r.device_model ILIKE $${paramIndex})`)
      params.push(searchPattern)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Query requests with requester name (single query with COUNT(*) OVER())
    const { rows: rawRequests, total } = await paginatedQuery<RequestRow>(`
      SELECT
        r.*,
        u.name as requester_name
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY r.${sortConfig.field} ${sortConfig.order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    const requests = rawRequests.map(mapRequestListRow)

    logger.info('Fetched IT-Hilfe requests', {
      status,
      category,
      canton,
      count: requests.length,
      total,
    })

    return apiSuccess({
      requests,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching IT-Hilfe requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/it-hilfe/requests
 * Create a new IT-Hilfe request (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // SECURITY: Rate limiting - 5 requests per hour per user
    if (!rateLimiters.itHilfeCreate(`${session.user.id}:it-hilfe-create`)) {
      return apiBadRequest('Zu viele Anfragen. Bitte warte 1 Stunde.')
    }

    const body = await request.json()

    // SECURITY: Validate with Zod schema
    const validation = validateAndRespond(itHilfeRequestSchema, body)
    if (!validation.success) {
      logger.warn('IT-Hilfe validation failed', {
        userId: session.user.id,
        errors: validation.errors,
      })
      return apiBadRequest(validation.errors.join('; '))
    }

    const validatedData = validation.data

    // SECURITY: Sanitize user inputs
    const sanitizedTitle = sanitizeInput(validatedData.title, { maxLength: 200 })
    const sanitizedDescription = sanitizeInput(validatedData.description, {
      allowHtml: true,
      maxLength: 5000,
    })

    const {
      categoryId,
      urgency,
      maxBudgetCents,
      postalCode,
      city,
      canton,
      serviceType = 'flexible',
      skillsNeeded = [],
      budgetTier,
    } = validatedData

    // Additional body fields not in schema
    const { deviceBrand, deviceModel, imageUrls = [], aiDiagnosis } = body

    // Derive budget_type from maxBudgetCents for backwards compatibility
    const budgetType = (maxBudgetCents && maxBudgetCents > 0) ? 'fixed' : 'free'
    const budgetAmountCents = (maxBudgetCents && maxBudgetCents > 0) ? maxBudgetCents : null

    // Insert the request with sanitized data
    const result = await query(`
      INSERT INTO ${TABLE_NAMES.IT_HILFE_REQUESTS} (
        requester_id,
        category_id,
        device_brand,
        device_model,
        title,
        description,
        urgency,
        budget_type,
        budget_amount_cents,
        postal_code,
        city,
        canton,
        service_type,
        skills_needed,
        image_urls,
        ai_diagnosis
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING id
    `, [
      session.user.id,
      categoryId,
      deviceBrand || null,
      deviceModel || null,
      sanitizedTitle,
      sanitizedDescription,
      urgency,
      budgetType,
      budgetAmountCents,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded && skillsNeeded.length > 0 ? skillsNeeded : null,
      imageUrls.length > 0 ? imageUrls : null,
      aiDiagnosis || null,
    ])

    const requestId = (result.rows[0] as { id: string }).id

    logger.info('Created IT-Hilfe request', {
      requestId,
      requesterId: session.user.id,
      categoryId,
      budgetType,
      canton,
    })

    // Fire-and-forget: Send all notifications (confirmation, admin, matching helpers)
    sendRequestCreatedNotifications({
      requestId,
      requesterId: session.user.id,
      requesterName: session.user.name || 'Nutzer',
      requesterEmail: session.user.email || '',
      title: sanitizedTitle,
      categoryId,
      urgency,
      canton,
      serviceType,
      skillsNeeded: skillsNeeded || [],
      aiDiagnosis: aiDiagnosis || null,
    })

    return apiSuccess({
      message: 'IT-Hilfe-Anfrage erfolgreich erstellt',
      requestId,
    }, 201)
  } catch (error) {
    logger.error('Error creating IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
