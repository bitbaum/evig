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
  URGENCY_LEVELS,
  SERVICE_TYPES,
  REQUEST_STATUSES,
} from '@/config/it-hilfe'

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
  ai_diagnosis: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/it-hilfe/requests/[id]
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
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      WHERE r.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return apiNotFound('IT-Hilfe-Anfrage')
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
      aiDiagnosis: row.ai_diagnosis,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isOwner,
    }

    logger.info('Fetched IT-Hilfe request details', { requestId: id })

    return apiSuccess({ request: requestData })
  } catch (error) {
    logger.error('Error fetching IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * PUT /api/it-hilfe/requests/[id]
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
      SELECT requester_id, status FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}
      WHERE id = $1
    `, [id])

    if (existingResult.rows.length === 0) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    const existing = existingResult.rows[0] as { requester_id: string; status: string }

    if (existing.requester_id !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Anfragen bearbeiten')
    }

    const body = await request.json()

    // Status-only updates (completion, cancellation) are allowed on matched requests
    const isStatusOnlyUpdate = body.status && Object.keys(body).length === 1

    // Only allow editing open or in_discussion requests (unless it's a status transition)
    if (!['open', 'in_discussion'].includes(existing.status) && !isStatusOnlyUpdate) {
      return apiBadRequest('Diese Anfrage kann nicht mehr bearbeitet werden')
    }
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency,
      budgetAmountCents,
      maxBudgetCents, // Alias for budgetAmountCents (simplified model)
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded,
      imageUrls,
      status,
    } = body

    // Support both old and new field names
    const effectiveBudgetCents = maxBudgetCents ?? budgetAmountCents

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
      updates.push(`title = $${paramIndex}`)
      updateParams.push(title)
      paramIndex++
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      updateParams.push(description || '')
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

    // Simplified budget: just maxBudget amount (null/0 = free, >0 = paid)
    if (effectiveBudgetCents !== undefined) {
      const amount = effectiveBudgetCents > 0 ? effectiveBudgetCents : null
      const derivedBudgetType = amount ? 'fixed' : 'free'

      updates.push(`budget_amount_cents = $${paramIndex}`)
      updateParams.push(amount)
      paramIndex++

      updates.push(`budget_type = $${paramIndex}`)
      updateParams.push(derivedBudgetType)
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

    // Status transitions
    if (status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        open: ['cancelled'],
        in_discussion: ['cancelled'],
        matched: ['completed', 'cancelled'],
      }
      const allowed = validTransitions[existing.status] || []

      if (!allowed.includes(status)) {
        return apiBadRequest(`Status kann nicht von "${existing.status}" auf "${status}" geändert werden`)
      }

      updates.push(`status = $${paramIndex}`)
      updateParams.push(status)
      paramIndex++
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    // Add request ID as last parameter
    updateParams.push(id)

    await query(`
      UPDATE ${TABLE_NAMES.IT_HILFE_REQUESTS}
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `, updateParams)

    logger.info('Updated IT-Hilfe request', {
      requestId: id,
      userId: session.user.id,
      updates: updates.length,
    })

    return apiSuccess({
      message: 'IT-Hilfe-Anfrage erfolgreich aktualisiert',
    })
  } catch (error) {
    logger.error('Error updating IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
