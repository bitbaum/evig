/**
 * API: My Team Profile (self-service)
 *
 * PUT /api/admin/team/profiles/me — a staff member edits (or first-creates)
 * their OWN team profile.
 *
 * Why a dedicated `me` route instead of `/[id]`: it is own-only BY CONSTRUCTION.
 * The target row is ALWAYS `WHERE user_id = session.user.id`, so there is no id
 * to authorize — a staff member can never reach another person's profile.
 * `withAuth` gates on `isStaff`; sensitive fields (compensation / AHV / hr_notes)
 * are stripped for non-super-admins by the SHARED `mapTeamProfileUpdate` guard,
 * so self-service can never write payroll data. New staff have no profile row yet
 * (the onboarding case), so the first save UPSERTS one.
 *
 * Note: Next.js resolves the static `me` segment before the dynamic `[id]`, so
 * `/profiles/me` lands here and `/profiles/<uuid>` still lands on the admin route.
 */

import { withAuth, ValidSession } from '@/lib/api/middleware'
import { NextRequest } from 'next/server'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateUpdateTeamProfile } from '@/lib/schemas/team'
import { mapTeamProfileUpdate } from '@/lib/services/team-profiles'

export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()

    const validation = validateUpdateTeamProfile(body)
    if (!validation.success) {
      return apiBadRequest(
        ERROR_MESSAGES.VALIDATION_ERROR,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      )
    }

    const isSuperAdminUser = isSuperAdmin(session.user.email, session.user.isSuperAdmin)
    // Sensitive fields are dropped here for non-supers — a self-editor cannot
    // write salary/AHV even if the request body contains them.
    const update = mapTeamProfileUpdate(validation.data, isSuperAdminUser)

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    // Atomic upsert on the unique user_id — creates the row for new staff, updates
    // it thereafter. ALWAYS scoped to the caller's own id.
    await db
      .insert(teamProfiles)
      .values({ userId: session.user.id, ...update } as typeof teamProfiles.$inferInsert)
      .onConflictDoUpdate({
        target: teamProfiles.userId,
        set: { ...update, updatedAt: sql`NOW()` },
      })

    logger.info('Own team profile saved (self-service)', {
      userId: session.user.id,
      fields: Object.keys(validation.data),
    })

    return apiSuccess({ message: 'Team-Profil aktualisiert' })
  } catch (error) {
    return apiError(error, 'Team-Profil konnte nicht aktualisiert werden')
  }
})
