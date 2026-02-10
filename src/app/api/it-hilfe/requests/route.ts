import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getCategoryById,
  getSkillIds,
  getSkillById,
  getUrgencyById,
  getServiceTypeById,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  REVAMPIT_NOTIFICATION_EMAIL,
} from '@/config/it-hilfe'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeRequestConfirmation, adminNewITHilfeRequest, helperNewMatchingRequest } from '@/lib/email/templates/it-hilfe'

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
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
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

    const body = await request.json()
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency = 'normal',
      maxBudgetCents, // Simplified: null/0 = free, > 0 = paid
      postalCode,
      city,
      canton,
      serviceType = 'flexible',
      skillsNeeded = [],
      imageUrls = [],
      aiDiagnosis,
    } = body

    // Validate required fields (minimal validation - don't block users)
    if (!categoryId || !title || !postalCode) {
      return apiBadRequest('Kategorie, Titel und PLZ sind erforderlich')
    }

    // Validate category
    if (!getCategoryIds().includes(categoryId)) {
      return apiBadRequest('Ungültige Gerätekategorie')
    }

    // Validate urgency if provided
    if (urgency && !URGENCY_LEVELS.some(u => u.id === urgency)) {
      return apiBadRequest('Ungültige Dringlichkeitsstufe')
    }

    // Validate service type if provided
    if (serviceType && !SERVICE_TYPES.some(s => s.id === serviceType)) {
      return apiBadRequest('Ungültiger Service-Typ')
    }

    // Validate skills if provided
    if (skillsNeeded.length > 0) {
      const validSkillIds = getSkillIds()
      const invalidSkills = skillsNeeded.filter((s: string) => !validSkillIds.includes(s))
      if (invalidSkills.length > 0) {
        return apiBadRequest(`Ungültige Skills: ${invalidSkills.join(', ')}`)
      }
    }

    // Derive budget_type from maxBudgetCents for backwards compatibility
    const budgetType = (maxBudgetCents && maxBudgetCents > 0) ? 'fixed' : 'free'
    const budgetAmountCents = (maxBudgetCents && maxBudgetCents > 0) ? maxBudgetCents : null

    // Insert the request
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
      title,
      description || '',
      urgency,
      budgetType,
      budgetAmountCents,
      postalCode,
      city || '',
      canton || '',
      serviceType,
      skillsNeeded.length > 0 ? skillsNeeded : null,
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

    // Fire-and-forget: Send confirmation and admin notification emails
    const requestUrl = `${process.env.NEXTAUTH_URL || 'https://revamp-it.ch'}/it-hilfe/${requestId}`
    const categoryName = getCategoryById(categoryId)?.name || categoryId
    const urgencyName = getUrgencyById(urgency)?.name || urgency

    // Confirmation email to requester
    if (session.user.email) {
      const confirmationContent = itHilfeRequestConfirmation(
        session.user.name || 'Nutzer',
        title,
        requestId,
        categoryName,
        aiDiagnosis || null,
        requestUrl
      )
      sendCustomEmail(session.user.email, confirmationContent).catch(err => {
        logger.warn('Failed to send IT-Hilfe confirmation email', { error: err, requestId })
      })
    }

    // Admin notification to RevampIT staff email
    const adminContent = adminNewITHilfeRequest(
      session.user.name || 'Nutzer',
      session.user.email || '',
      title,
      categoryName,
      urgencyName,
      requestUrl
    )
    sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, adminContent).catch(err => {
      logger.warn('Failed to send IT-Hilfe admin notification', { error: err })
    })

    // Notify matching helpers (fire-and-forget)
    const serviceTypeName = getServiceTypeById(serviceType)?.name || serviceType
    if (skillsNeeded.length > 0) {
      query(`
        SELECT DISTINCT hp.user_id, u.name, u.email,
          ARRAY_AGG(us.skill_id) FILTER (WHERE us.skill_id = ANY($1::text[])) as matching_skills
        FROM ${TABLE_NAMES.HELPER_PROFILES} hp
        JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
        JOIN ${TABLE_NAMES.USER_SKILLS} us ON hp.user_id = us.user_id
        WHERE hp.is_active = true
          AND hp.user_id != $2
          AND us.skill_id = ANY($1::text[])
        GROUP BY hp.user_id, u.name, u.email
      `, [skillsNeeded, session.user.id]).then(helpersResult => {
        for (const helper of helpersResult.rows as Array<{ user_id: string; name: string; email: string; matching_skills: string[] }>) {
          const matchingSkillNames = (helper.matching_skills || [])
            .map(sid => getSkillById(sid)?.name || sid)
          const helperContent = helperNewMatchingRequest(
            helper.name || 'Techniker',
            title,
            categoryName,
            urgencyName,
            canton || '',
            serviceTypeName,
            matchingSkillNames,
            requestUrl
          )
          sendCustomEmail(helper.email, helperContent).catch(err => {
            logger.warn('Failed to send IT-Hilfe helper notification', { error: err, helperEmail: helper.email })
          })
        }
        logger.info('Sent IT-Hilfe helper notifications', { requestId, helperCount: helpersResult.rows.length })
      }).catch(err => {
        logger.warn('Failed to fetch matching helpers for IT-Hilfe notifications', { error: err })
      })
    }

    return apiSuccess({
      message: 'IT-Hilfe-Anfrage erfolgreich erstellt',
      requestId,
    }, 201)
  } catch (error) {
    logger.error('Error creating IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
