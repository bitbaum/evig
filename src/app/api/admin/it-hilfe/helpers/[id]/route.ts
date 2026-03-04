import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { validateBody } from '@/lib/schemas'
import { AdminHelperActionSchema } from '@/lib/schemas/it-hilfe'
import { logger } from '@/lib/logger'

// PATCH /api/admin/it-hilfe/helpers/[id] - Verify/suspend/reactivate helper
export const PATCH = withAdmin<{ id: string }>('it-hilfe-admin', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const validation = validateBody(AdminHelperActionSchema, body)
    if (!validation.success) return validation.error

    const { action, admin_notes } = validation.data

    // Check helper exists
    const existing = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.HELPER_NOT_FOUND)
    }

    let updateQuery: string
    let updateParams: (string | null | boolean)[]

    switch (action) {
      case 'verify':
        updateQuery = `
          UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
          SET is_verified = true, verified_at = NOW(), verified_by = $1, admin_notes = $2, updated_at = NOW()
          WHERE id = $3
          RETURNING *`
        updateParams = [session.user.id, admin_notes || null, id]
        break

      case 'suspend':
        updateQuery = `
          UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
          SET suspended_at = NOW(), is_active = false, admin_notes = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *`
        updateParams = [admin_notes || null, id]
        break

      case 'reactivate':
        updateQuery = `
          UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES}
          SET suspended_at = NULL, is_active = true, admin_notes = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *`
        updateParams = [admin_notes || null, id]
        break

      default:
        return apiBadRequest('Ungültige Aktion')
    }

    const result = await query(updateQuery, updateParams)

    logger.info('Admin performed helper action', {
      helperId: id,
      action,
      adminEmail: session.user.email,
    })

    return apiSuccess(result.rows[0])
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
