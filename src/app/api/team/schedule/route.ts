/**
 * PUT /api/team/schedule — a team member saves THEIR OWN weekly work schedule.
 *
 * Previously working_hours was only editable through the admin team-profile
 * editor (/api/admin/team/profiles/*), so adjusting your own schedule meant
 * clicking through admin. This is the self-service path used by the inline
 * schedule editor on /dashboard/timecards. is_revampit-style SSOT: the
 * schedule lives in team_profiles.working_hours as a normalized WeeklySchedule.
 */
import { NextRequest } from 'next/server'
import { withAuth, type ValidSession } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { db } from '@/db'
import { teamProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { parseWeeklySchedule, serializeWeeklySchedule } from '@/lib/team/schedule'
import { logger } from '@/lib/logger'

export const PUT = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json().catch(() => ({}))
    // Normalize defensively — parseWeeklySchedule clamps/validates every field
    // and falls back to an empty schedule on garbage, so we never persist junk.
    const normalized = serializeWeeklySchedule(
      parseWeeklySchedule(JSON.stringify((body as { schedule?: unknown }).schedule ?? null)),
    )

    await db
      .insert(teamProfiles)
      .values({ userId: session.user.id, workingHours: normalized })
      .onConflictDoUpdate({
        target: teamProfiles.userId,
        set: { workingHours: normalized, updatedAt: new Date().toISOString() },
      })

    return apiSuccess({ workingHours: normalized })
  } catch (error) {
    logger.error('Error saving own work schedule', { error, userId: session.user.id })
    return apiError(error, 'Arbeitsplan konnte nicht gespeichert werden')
  }
})

export const GET = withAuth(async (_request: NextRequest, session: ValidSession) => {
  try {
    const [row] = await db
      .select({ workingHours: teamProfiles.workingHours })
      .from(teamProfiles)
      .where(eq(teamProfiles.userId, session.user.id))
      .limit(1)
    return apiSuccess({ workingHours: row?.workingHours ?? null })
  } catch (error) {
    return apiError(error, 'Arbeitsplan konnte nicht geladen werden')
  }
})
