import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { AdminEditRequestSchema } from '@/lib/schemas/it-hilfe'
import { logger } from '@/lib/logger'

// GET /api/admin/it-hilfe/[id] - Request detail with offers
export const GET = withAdmin<{ id: string }>('it-hilfe-admin', async (_request, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const requestResult = await query(
      `SELECT
        r.*,
        u.name as requester_name, u.email as requester_email,
        (SELECT json_agg(json_build_object(
           'id', o.id, 'message', o.message, 'status', o.status,
           'estimated_time', o.estimated_time, 'proposed_compensation', o.proposed_compensation,
           'created_at', o.created_at,
           'helper_name', hu.name, 'helper_email', hu.email
         )) FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
         JOIN ${TABLE_NAMES.USERS} hu ON o.helper_id = hu.id
         WHERE o.request_id = r.id) as offers
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      WHERE r.id = $1`,
      [id]
    )

    if (requestResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    return apiSuccess(requestResult.rows[0])
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// PATCH /api/admin/it-hilfe/[id] - Edit/moderate request
export const PATCH = withAdmin<{ id: string }>('it-hilfe-admin', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(AdminEditRequestSchema, body)
    if (!validation.success) return validation.error

    const data = validation.data
    const setClauses: string[] = []
    const params: (string | null)[] = []

    if (data.title !== undefined) {
      setClauses.push(`title = $${params.length + 1}`)
      params.push(data.title)
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${params.length + 1}`)
      params.push(data.description)
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${params.length + 1}`)
      params.push(data.status)
    }
    if (data.urgency !== undefined) {
      setClauses.push(`urgency = $${params.length + 1}`)
      params.push(data.urgency)
    }
    if (data.admin_notes !== undefined) {
      setClauses.push(`admin_notes = $${params.length + 1}`)
      params.push(data.admin_notes)
    }

    if (setClauses.length === 0) {
      return apiBadRequest('Keine Änderungen angegeben')
    }

    setClauses.push(`updated_at = NOW()`)
    params.push(id)

    const result = await query(
      `UPDATE ${TABLE_NAMES.IT_HILFE_REQUESTS}
       SET ${setClauses.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    )

    if (result.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    logger.info('Admin edited IT-Hilfe request', {
      requestId: id,
      adminEmail: session.user.email,
      changes: Object.keys(data),
    })

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// DELETE /api/admin/it-hilfe/[id] - Cancel request
export const DELETE = withAdmin<{ id: string }>('it-hilfe-admin', async (_request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const result = await query(
      `UPDATE ${TABLE_NAMES.IT_HILFE_REQUESTS}
       SET status = 'cancelled', updated_at = NOW(), admin_notes = COALESCE(admin_notes, '') || ' [Admin-storniert]'
       WHERE id = $1 AND status NOT IN ('completed', 'cancelled')
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.IT_HILFE_REQUEST_NOT_FOUND)
    }

    logger.info('Admin cancelled IT-Hilfe request', {
      requestId: id,
      adminEmail: session.user.email,
    })

    return apiSuccess({ cancelled: true })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
