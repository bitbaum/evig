import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { repairerProfiles, userProfiles } from '@/db/schema'
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

    // Check helper exists — also grab userId: verification is per-PERSON and
    // lives on user_profiles (Profiles SSOT), keyed by user_id.
    const [existing] = await db
      .select({ id: repairerProfiles.id, userId: repairerProfiles.userId })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.id, id))

    if (!existing) {
      return apiNotFound(ERROR_MESSAGES.HELPER_NOT_FOUND)
    }

    // `verify` marks the PERSON verified in the identity SSOT (user_profiles),
    // not the role table. Upsert because a professional applicant may predate
    // slice 1's backfill and lack a user_profiles row. The role table only
    // records that the helper is now active.
    if (action === 'verify') {
      await db
        .insert(userProfiles)
        .values({ userId: existing.userId, isVerified: true, verificationDate: sql`NOW()` })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: { isVerified: true, verificationDate: sql`NOW()`, updatedAt: sql`NOW()` },
        })

      const [updated] = await db
        .update(repairerProfiles)
        .set({ status: 'active', updatedAt: sql`NOW()` })
        .where(eq(repairerProfiles.id, id))
        .returning()

      logger.info('Admin performed helper action', {
        helperId: id,
        action,
        adminEmail: session.user.email,
      })

      return apiSuccess({ ...updated, isVerified: true })
    }

    // suspend / reactivate are role status changes — stay on repairer_profiles.
    let update: Record<string, unknown>

    switch (action) {
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
