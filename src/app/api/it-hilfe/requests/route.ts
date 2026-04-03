import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName, SQL } from 'drizzle-orm'
import { itHilfeRequests } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getSkillIds,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  REQUEST_STATUS,
  deriveBudgetType,
} from '@/config/it-hilfe'
import { rateLimiters } from '@/lib/security/rate-limit'
import { sanitizeInput } from '@/lib/security/sanitize'
import { itHilfeRequestSchema, validateAndRespond } from '@/lib/schemas/it-hilfe'
import { type RequestRow, mapRequestListRow } from '@/lib/it-hilfe/request-mapper'
import { sendRequestCreatedNotifications } from '@/lib/it-hilfe/notifications'

// Table name refs
const rTable = getTableName(itHilfeRequests)
const uTable = getTableName(users)

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
    const status = searchParams.get('status') || REQUEST_STATUS.OPEN
    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 50 })

    // Map frontend sort values to DB columns
    const sortMap: Record<string, string> = {
      newest: 'r.created_at DESC',
      urgent: 'r.urgency DESC',
      budget_high: 'r.budget_amount_cents DESC',
      offers: 'r.offer_count DESC',
    }
    const sortParam = searchParams.get('sort') || searchParams.get('sortBy') || 'newest'
    const sortClause = sortMap[sortParam] || sortMap.newest

    // Build WHERE conditions
    const conditions: SQL[] = [
      sql`r.status = ${status}`,
      sql`r.expires_at > NOW()`,
    ]

    if (category && getCategoryIds().includes(category)) {
      conditions.push(sql`r.category_id = ${category}`)
    }

    if (canton) {
      conditions.push(sql`r.canton = ${canton}`)
    }

    if (urgency && URGENCY_LEVELS.some(u => u.id === urgency)) {
      conditions.push(sql`r.urgency = ${urgency}`)
    }

    // Budget filter: 'free' for null/0, 'paid' for amount > 0
    if (budgetType === 'free') {
      conditions.push(sql`(r.budget_amount_cents IS NULL OR r.budget_amount_cents = 0)`)
    } else if (budgetType === 'paid') {
      conditions.push(sql`r.budget_amount_cents > 0`)
    }

    if (serviceType && SERVICE_TYPES.some(s => s.id === serviceType)) {
      conditions.push(sql`r.service_type = ${serviceType}`)
    }

    if (skill && getSkillIds().includes(skill)) {
      conditions.push(sql`${skill} = ANY(r.skills_needed)`)
    }

    // Text search across title, description, device brand/model
    if (search && search.trim().length >= 2) {
      const searchPattern = `%${search.trim()}%`
      conditions.push(sql`(r.title ILIKE ${searchPattern} OR r.description ILIKE ${searchPattern} OR r.device_brand ILIKE ${searchPattern} OR r.device_model ILIKE ${searchPattern})`)
    }

    const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`

    // Query requests with requester name (single query with COUNT(*) OVER())
    const result = await db.execute(sql`
      SELECT
        COUNT(*) OVER() AS _total_count,
        r.*,
        u.name as requester_name
      FROM ${sql.raw(rTable)} r
      JOIN ${sql.raw(uTable)} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY ${sql.raw(sortClause)}
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Extract total from first row (0 if no rows returned)
    type RowWithCount = RequestRow & { _total_count: string }
    const rawRequests = result.rows as unknown as RowWithCount[]
    const total = rawRequests.length > 0
      ? parseInt(rawRequests[0]._total_count || '0', 10)
      : 0

    // Strip _total_count and map
    const requests = rawRequests.map(({ _total_count, ...rest }) =>
      mapRequestListRow(rest as unknown as RequestRow)
    )

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
export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
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
    const budgetType = deriveBudgetType(maxBudgetCents)
    const budgetAmountCents = (maxBudgetCents && maxBudgetCents > 0) ? maxBudgetCents : null

    // Insert the request with sanitized data
    const [insertedRow] = await db.insert(itHilfeRequests).values({
      requesterId: session.user.id,
      categoryId,
      deviceBrand: deviceBrand || null,
      deviceModel: deviceModel || null,
      title: sanitizedTitle,
      description: sanitizedDescription,
      urgency,
      budgetType,
      budgetAmountCents,
      budgetTier: budgetTier || null,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded: skillsNeeded && skillsNeeded.length > 0 ? skillsNeeded : null,
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
      aiDiagnosis: aiDiagnosis || null,
    }).returning({ id: itHilfeRequests.id })

    const requestId = insertedRow.id

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
})
