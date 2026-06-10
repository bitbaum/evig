/**
 * API: Self-service team-profile bootstrap.
 *
 * POST /api/admin/team/profiles/me/bootstrap
 *
 * Why this exists separate from POST /api/admin/team/profiles:
 *   - The general team-profile create endpoint requires the 'team'
 *     permission (HR-grade). Most staff don't have it. But every staff
 *     member needs their OWN profile to use timecards — they shouldn't
 *     have to wait for HR to provision them.
 *   - The general endpoint expects a full validated body. This one
 *     takes nothing: it creates a minimal profile for the calling user
 *     with the standard Mo–Fr 09:00–17:00 schedule.
 *
 * Idempotent-ish:
 *   - If no profile exists → create with default schedule, return 201.
 *   - If profile exists but workingHours is null/empty → set the
 *     default schedule on it, return 200 with applied=true.
 *   - If profile exists with a non-empty schedule already → no-op,
 *     return 200 with applied=false. Caller should not see this as
 *     an error.
 *
 * The endpoint replaces a 5-step manual flow (open team page → click
 * own name → fill schedule → save → navigate to timecards) with a
 * single POST + page reload. The /admin/timecards page surfaces this
 * as the primary action of the NoScheduleNotice block.
 */

import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { applyStandardSchedule } from '@/lib/team/schedule'
import { logger } from '@/lib/logger'

export const POST = withAdmin(async (_request, session) => {
  try {
    const userId = session.user.id
    const standardSchedule = applyStandardSchedule()

    // Single round-trip: insert if missing, otherwise update only when
    // workingHours is currently null/empty. The setWhere clause lets us
    // tell the three states apart via the RETURNING shape.
    const [row] = await db
      .insert(teamProfiles)
      .values({
        userId,
        workingHours: standardSchedule,
        employmentType: 'volunteer',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: teamProfiles.userId,
        set: {
          workingHours: standardSchedule,
          updatedAt: sql`NOW()`,
        },
        setWhere: sql`${teamProfiles.workingHours} IS NULL OR ${teamProfiles.workingHours} = ''`,
      })
      .returning({
        id: teamProfiles.id,
        workingHours: teamProfiles.workingHours,
      })

    if (!row) {
      // setWhere blocked the update → the user already has a non-empty
      // schedule. Idempotent success, no change.
      const [existing] = await db
        .select({ id: teamProfiles.id, workingHours: teamProfiles.workingHours })
        .from(teamProfiles)
        .where(eq(teamProfiles.userId, userId))
        .limit(1)
      return apiSuccess({
        applied: false,
        profileId: existing?.id ?? null,
        workingHours: existing?.workingHours ?? null,
        message: 'Schedule existed; no changes',
      })
    }

    logger.info('Team profile bootstrap applied', { userId, profileId: row.id })
    return apiSuccess({
      applied: true,
      profileId: row.id,
      workingHours: row.workingHours,
      message: 'Standard-Schedule angewendet',
    })
  } catch (error) {
    logger.error('Failed to bootstrap team profile', { error, userId: session.user.id })
    return apiError(error, 'Konnte den Standard-Schedule nicht anwenden.')
  }
})
