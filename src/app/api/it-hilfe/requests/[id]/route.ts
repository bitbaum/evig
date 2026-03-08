import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { validateBody, UpdateITHilfeRequestSchema } from '@/lib/schemas'
import { type RequestRow, mapRequestDetailRow } from '@/lib/it-hilfe/request-mapper'

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
    const requestData = mapRequestDetailRow(row, isOwner)

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
    const validation = validateBody(UpdateITHilfeRequestSchema, body)
    if (!validation.success) return validation.error
    const {
      categoryId,
      deviceBrand,
      deviceModel,
      title,
      description,
      urgency,
      budgetAmountCents,
      maxBudgetCents,
      postalCode,
      city,
      canton,
      serviceType,
      skillsNeeded,
      imageUrls,
      status,
    } = validation.data

    // Status-only updates (completion, cancellation) are allowed on matched requests
    const isStatusOnlyUpdate = status && Object.keys(body).length === 1

    // Only allow editing open or in_discussion requests (unless it's a status transition)
    if (existing.status !== REQUEST_STATUS.OPEN && existing.status !== REQUEST_STATUS.IN_DISCUSSION && !isStatusOnlyUpdate) {
      return apiBadRequest('Diese Anfrage kann nicht mehr bearbeitet werden')
    }

    // Support both old and new field names
    const effectiveBudgetCents = maxBudgetCents ?? budgetAmountCents

    // Build update fields
    const updates: string[] = []
    const updateParams: (string | number | string[] | null)[] = []
    let paramIndex = 1

    // Validate and add each field if provided
    if (categoryId !== undefined) {
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
      updates.push(`urgency = $${paramIndex}`)
      updateParams.push(urgency)
      paramIndex++
    }

    // Simplified budget: just maxBudget amount (null/0 = free, >0 = paid)
    if (effectiveBudgetCents !== undefined) {
      const amount = effectiveBudgetCents && effectiveBudgetCents > 0 ? effectiveBudgetCents : null
      const derivedBudgetType = amount ? 'fixed' : 'free'

      updates.push(`budget_amount_cents = $${paramIndex}`)
      updateParams.push(amount)
      paramIndex++

      updates.push(`budget_type = $${paramIndex}`)
      updateParams.push(derivedBudgetType)
      paramIndex++
    }

    if (postalCode !== undefined) {
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
      updates.push(`service_type = $${paramIndex}`)
      updateParams.push(serviceType)
      paramIndex++
    }

    if (skillsNeeded !== undefined) {
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
        [REQUEST_STATUS.OPEN]: [REQUEST_STATUS.CANCELLED],
        [REQUEST_STATUS.IN_DISCUSSION]: [REQUEST_STATUS.CANCELLED],
        [REQUEST_STATUS.MATCHED]: [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.CANCELLED],
      }
      const allowed = validTransitions[existing.status] || []

      if (!allowed.includes(status)) {
        return apiBadRequest(`Status kann nicht von "${existing.status}" auf "${status}" geändert werden`)
      }

      updates.push(`status = $${paramIndex}`)
      updateParams.push(status)
      paramIndex++

      // Increment helper's total_helps_completed when completing
      if (status === REQUEST_STATUS.COMPLETED) {
        try {
          await query(`
            UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
            SET total_helps_completed = total_helps_completed + 1
            FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
            JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON r.matched_offer_id = o.id
            WHERE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}.user_id = o.helper_id
              AND r.id = $1
          `, [id])
        } catch (err) {
          logger.error('Error incrementing total_helps_completed', { error: err, requestId: id })
        }
      }
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
