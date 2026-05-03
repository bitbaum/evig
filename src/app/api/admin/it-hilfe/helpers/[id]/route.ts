import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerProfiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody } from '@/lib/schemas'
import { AdminHelperActionSchema } from '@/lib/schemas/it-hilfe'
import { logger } from '@/lib/logger'

// PATCH /api/admin/it-hilfe/helpers/[id] - Verify/suspend/reactivate helper
export const PATCH = withAdmin<{ id: string }>('it-hilfe-admin', async (request, session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest(ERROR_MESSAGES.ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(AdminHelperActionSchema, body)
    if (!validation.success) return validation.error

    const { action, admin_notes } = validation.data

    // Check helper exists
    const [existing] = await db
      .select({ id: repairerProfiles.id })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, id))

    if (!existing) {
      return apiNotFound(ERROR_MESSAGES.HELPER_NOT_FOUND)
    }

    let update: Record<string, unknown>

    switch (action) {
      case 'verify':
        update = {
          isVerified: true,
          verificationDate: sql`NOW()`,
          status: 'active',
          updatedAt: sql`NOW()`,
        }
        break

      case 'suspend':
        update = {
          status: 'suspended',
          isActive: false,
          updatedAt: sql`NOW()`,
        }
        break

      case 'reactivate':
        update = {
          status: 'active',
          isActive: true,
          updatedAt: sql`NOW()`,
        }
        break

      default:
        return apiBadRequest(ERROR_MESSAGES.INVALID_ACTION)
    }

    const [updated] = await db
      .update(repairerProfiles)
      .set(update)
      .where(eq(repairerProfiles.id, id))
      .returning()

    logger.info('Admin performed helper action', {
      helperId: id,
      action,
      adminEmail: session.user.email,
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
