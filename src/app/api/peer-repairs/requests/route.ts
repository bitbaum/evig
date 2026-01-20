import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getSkillIds,
  BUDGET_TYPES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
} from '@/config/peer-repairs'

interface RequestRow {
  id: string
  requester_id: string
  requester_name: string
  category_id: string
  device_brand: string | null
  device_model: string | null
  title: string
  description: string
  urgency: string
  budget_type: string
  budget_amount_cents: number | null
  postal_code: string
  city: string
  canton: string
  service_type: string
  skills_needed: string[] | null
  image_urls: string[] | null
  status: string
  matched_offer_id: string | null
  offer_count: number
  expires_at: string
  created_at: string
  updated_at: string
}

interface CountRow {
  total: string
}

/**
 * GET /api/peer-repairs/requests
 * Browse peer repair requests with filters (public)
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
    const status = searchParams.get('status') || 'open'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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

    if (budgetType && BUDGET_TYPES.some(b => b.id === budgetType)) {
      conditions.push(`r.budget_type = $${paramIndex}`)
      params.push(budgetType)
      paramIndex++
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validate sort field
    const validSortFields = ['created_at', 'urgency', 'offer_count']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // Query requests with requester name
    const requestsResult = await query(`
      SELECT
        r.*,
        u.name as requester_name
      FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS} r
      ${whereClause}
    `, params)

    const requests = (requestsResult.rows as RequestRow[]).map(row => ({
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      categoryId: row.category_id,
      deviceBrand: row.device_brand,
      deviceModel: row.device_model,
      title: row.title,
      description: row.description,
      urgency: row.urgency,
      budgetType: row.budget_type,
      budgetAmountCents: row.budget_amount_cents,
      postalCode: row.postal_code,
      city: row.city,
      canton: row.canton,
      serviceType: row.service_type,
      skillsNeeded: row.skills_needed || [],
      imageUrls: row.image_urls || [],
      status: row.status,
      matchedOfferId: row.matched_offer_id,
      offerCount: row.offer_count,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    const countData = countResult.rows[0] as CountRow
    const total = parseInt(countData.total)

    logger.info('Fetched peer repair requests', {
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
    logger.error('Error fetching peer repair requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/peer-repairs/requests
 * Create a new peer repair request (requires auth)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency = 'normal',
      budgetType,
      budgetAmountCents,
      postalCode,
      city,
      canton,
      serviceType = 'flexible',
      skillsNeeded = [],
      imageUrls = [],
    } = body

    // Validate required fields
    if (!categoryId || !title || !description || !budgetType || !postalCode || !city || !canton) {
      return apiBadRequest('categoryId, title, description, budgetType, postalCode, city und canton sind erforderlich')
    }

    // Validate category
    if (!getCategoryIds().includes(categoryId)) {
      return apiBadRequest('Ungültige Gerätekategorie')
    }

    // Validate budget type
    const budgetTypeConfig = BUDGET_TYPES.find(b => b.id === budgetType)
    if (!budgetTypeConfig) {
      return apiBadRequest('Ungültiger Budget-Typ')
    }

    // Validate budget amount if required
    if (budgetTypeConfig.requiresAmount && (!budgetAmountCents || budgetAmountCents <= 0)) {
      return apiBadRequest('Für diesen Budget-Typ ist ein Betrag erforderlich')
    }

    // Validate urgency
    if (!URGENCY_LEVELS.some(u => u.id === urgency)) {
      return apiBadRequest('Ungültige Dringlichkeitsstufe')
    }

    // Validate service type
    if (!SERVICE_TYPES.some(s => s.id === serviceType)) {
      return apiBadRequest('Ungültiger Service-Typ')
    }

    // Validate skills if provided
    const validSkillIds = getSkillIds()
    const invalidSkills = skillsNeeded.filter((s: string) => !validSkillIds.includes(s))
    if (invalidSkills.length > 0) {
      return apiBadRequest(`Ungültige Skills: ${invalidSkills.join(', ')}`)
    }

    // Validate postal code format (Swiss: 4 digits)
    if (!/^\d{4}$/.test(postalCode)) {
      return apiBadRequest('Ungültige Postleitzahl (4 Ziffern erforderlich)')
    }

    // Validate title length
    if (title.length < 10 || title.length > 200) {
      return apiBadRequest('Titel muss zwischen 10 und 200 Zeichen lang sein')
    }

    // Validate description length
    if (description.length < 20 || description.length > 5000) {
      return apiBadRequest('Beschreibung muss zwischen 20 und 5000 Zeichen lang sein')
    }

    // Insert the request
    const result = await query(`
      INSERT INTO ${TABLE_NAMES.PEER_REPAIR_REQUESTS} (
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
        image_urls
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id
    `, [
      session.user.id,
      categoryId,
      deviceBrand || null,
      deviceModel || null,
      title,
      description,
      urgency,
      budgetType,
      budgetTypeConfig.requiresAmount ? budgetAmountCents : null,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded.length > 0 ? skillsNeeded : null,
      imageUrls.length > 0 ? imageUrls : null,
    ])

    const requestId = (result.rows[0] as { id: string }).id

    logger.info('Created peer repair request', {
      requestId,
      requesterId: session.user.id,
      categoryId,
      budgetType,
      canton,
    })

    return apiSuccess({
      message: 'Reparaturanfrage erfolgreich erstellt',
      requestId,
    }, 201)
  } catch (error) {
    logger.error('Error creating peer repair request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
