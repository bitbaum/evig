import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getSkillIds,
  BUDGET_TYPES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  REQUEST_STATUSES,
} from '@/config/peer-repairs'

interface RequestRow {
  id: string
  requester_id: string
  requester_name: string
  requester_email: string
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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/peer-repairs/requests/[id]
 * Get request details (public)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    const result = await query(`
      SELECT
        r.*,
        u.name as requester_name,
        u.email as requester_email
      FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      WHERE r.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const row = result.rows[0] as RequestRow

    // Get current user to check ownership
    const session = await auth()
    const isOwner = session?.user?.id === row.requester_id

    const requestData = {
      id: row.id,
      requesterId: row.requester_id,
      requesterName: row.requester_name,
      // Only expose email to owner
      requesterEmail: isOwner ? row.requester_email : undefined,
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
      isOwner,
    }

    logger.info('Fetched peer repair request details', { requestId: id })

    return apiSuccess({ request: requestData })
  } catch (error) {
    logger.error('Error fetching peer repair request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * PUT /api/peer-repairs/requests/[id]
 * Update request (owner only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id } = await params

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiBadRequest('Ungültige Anfrage-ID')
    }

    // Check ownership and current status
    const existingResult = await query(`
      SELECT requester_id, status FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
      WHERE id = $1
    `, [id])

    if (existingResult.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const existing = existingResult.rows[0] as { requester_id: string; status: string }

    if (existing.requester_id !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Anfragen bearbeiten')
    }

    // Only allow editing open or in_discussion requests
    if (!['open', 'in_discussion'].includes(existing.status)) {
      return apiBadRequest('Diese Anfrage kann nicht mehr bearbeitet werden')
    }

    const body = await request.json()
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency,
      budgetType,
      budgetAmountCents,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded,
      imageUrls,
      status,
    } = body

    // Build update fields
    const updates: string[] = []
    const updateParams: (string | number | string[] | null)[] = []
    let paramIndex = 1

    // Validate and add each field if provided
    if (categoryId !== undefined) {
      if (!getCategoryIds().includes(categoryId)) {
        return apiBadRequest('Ungültige Gerätekategorie')
      }
      updates.push(`category_id = $${paramIndex}`)
      updateParams.push(categoryId)
      paramIndex++
    }

    if (deviceBrand !== undefined) {
      updates.push(`device_brand = $${paramIndex}`)
      updateParams.push(deviceBrand || null)
      paramIndex++
    }

    if (deviceModel !== undefined) {
      updates.push(`device_model = $${paramIndex}`)
      updateParams.push(deviceModel || null)
      paramIndex++
    }

    if (title !== undefined) {
      if (title.length < 10 || title.length > 200) {
        return apiBadRequest('Titel muss zwischen 10 und 200 Zeichen lang sein')
      }
      updates.push(`title = $${paramIndex}`)
      updateParams.push(title)
      paramIndex++
    }

    if (description !== undefined) {
      if (description.length < 20 || description.length > 5000) {
        return apiBadRequest('Beschreibung muss zwischen 20 und 5000 Zeichen lang sein')
      }
      updates.push(`description = $${paramIndex}`)
      updateParams.push(description)
      paramIndex++
    }

    if (urgency !== undefined) {
      if (!URGENCY_LEVELS.some(u => u.id === urgency)) {
        return apiBadRequest('Ungültige Dringlichkeitsstufe')
      }
      updates.push(`urgency = $${paramIndex}`)
      updateParams.push(urgency)
      paramIndex++
    }

    if (budgetType !== undefined) {
      const budgetTypeConfig = BUDGET_TYPES.find(b => b.id === budgetType)
      if (!budgetTypeConfig) {
        return apiBadRequest('Ungültiger Budget-Typ')
      }
      updates.push(`budget_type = $${paramIndex}`)
      updateParams.push(budgetType)
      paramIndex++

      // Update amount if type changed
      if (budgetTypeConfig.requiresAmount) {
        if (!budgetAmountCents || budgetAmountCents <= 0) {
          return apiBadRequest('Für diesen Budget-Typ ist ein Betrag erforderlich')
        }
        updates.push(`budget_amount_cents = $${paramIndex}`)
        updateParams.push(budgetAmountCents)
        paramIndex++
      } else {
        updates.push(`budget_amount_cents = NULL`)
      }
    } else if (budgetAmountCents !== undefined) {
      updates.push(`budget_amount_cents = $${paramIndex}`)
      updateParams.push(budgetAmountCents)
      paramIndex++
    }

    if (postalCode !== undefined) {
      if (!/^\d{4}$/.test(postalCode)) {
        return apiBadRequest('Ungültige Postleitzahl (4 Ziffern erforderlich)')
      }
      updates.push(`postal_code = $${paramIndex}`)
      updateParams.push(postalCode)
      paramIndex++
    }

    if (city !== undefined) {
      updates.push(`city = $${paramIndex}`)
      updateParams.push(city)
      paramIndex++
    }

    if (canton !== undefined) {
      updates.push(`canton = $${paramIndex}`)
      updateParams.push(canton)
      paramIndex++
    }

    if (serviceType !== undefined) {
      if (!SERVICE_TYPES.some(s => s.id === serviceType)) {
        return apiBadRequest('Ungültiger Service-Typ')
      }
      updates.push(`service_type = $${paramIndex}`)
      updateParams.push(serviceType)
      paramIndex++
    }

    if (skillsNeeded !== undefined) {
      const validSkillIds = getSkillIds()
      const invalidSkills = skillsNeeded.filter((s: string) => !validSkillIds.includes(s))
      if (invalidSkills.length > 0) {
        return apiBadRequest(`Ungültige Skills: ${invalidSkills.join(', ')}`)
      }
      updates.push(`skills_needed = $${paramIndex}`)
      updateParams.push(skillsNeeded.length > 0 ? skillsNeeded : null)
      paramIndex++
    }

    if (imageUrls !== undefined) {
      updates.push(`image_urls = $${paramIndex}`)
      updateParams.push(imageUrls.length > 0 ? imageUrls : null)
      paramIndex++
    }

    // Allow cancelling the request
    if (status !== undefined) {
      if (status === 'cancelled') {
        updates.push(`status = $${paramIndex}`)
        updateParams.push('cancelled')
        paramIndex++
      } else if (!REQUEST_STATUSES.some(s => s.id === status)) {
        return apiBadRequest('Ungültiger Status')
      }
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    // Add request ID as last parameter
    updateParams.push(id)

    await query(`
      UPDATE ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, updateParams)

    logger.info('Updated peer repair request', {
      requestId: id,
      userId: session.user.id,
      updates: updates.length,
    })

    return apiSuccess({
      message: 'Reparaturanfrage erfolgreich aktualisiert',
    })
  } catch (error) {
    logger.error('Error updating peer repair request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
