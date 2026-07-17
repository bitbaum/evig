/**
 * GET  /api/admin/team/profiles/[id]/leave — list leave periods
 * POST /api/admin/team/profiles/[id]/leave — create a leave period
 *
 * Scoped to one team profile so the UI can render leave history right
 * next to the profile itself. Both endpoints require the `team`
 * permission. DELETE lives at /api/admin/team/leave/[leaveId] so each
 * leave row can be revoked by id without re-deriving the profile.
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { db } from '@/db'
import { leavePeriods, teamProfiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { leavePeriodKindOptions } from '@/lib/schemas/team'
import { materializeLeaveEntries, leaveKindToTimecardCategory } from '@/lib/services/time-off-materialize'

const createLeaveSchema = z.object({
  starts_on: z.string().min(1, 'Startdatum erforderlich'),
  ends_on: z.string().min(1, 'Enddatum erforderlich'),
  kind: z.enum(leavePeriodKindOptions),
  notes: z.string().max(1000).optional().nullable(),
}).refine(d => d.ends_on >= d.starts_on, {
  message: 'Enddatum darf nicht vor dem Startdatum liegen',
  path: ['ends_on'],
})

export const GET = withAdmin<{ id: string }>('team', async (
  _request: NextRequest,
  _session: ValidSession,
  context,
) => {
  try {
    const profileId = context?.params?.id
    if (!profileId) return apiBadRequest('Profil-ID fehlt')

    const rows = await db
      .select({
        id: leavePeriods.id,
        starts_on: leavePeriods.startsOn,
        ends_on: leavePeriods.endsOn,
        kind: leavePeriods.kind,
        notes: leavePeriods.notes,
        created_by: leavePeriods.createdBy,
        created_at: leavePeriods.createdAt,
      })
      .from(leavePeriods)
      .where(eq(leavePeriods.teamProfileId, profileId))
      .orderBy(desc(leavePeriods.startsOn))

    return apiSuccess({ items: rows })
  } catch (error) {
    logger.error('Failed to list leave periods', { error })
    return apiError(error, 'Urlaubsdaten konnten nicht geladen werden')
  }
})

export const POST = withAdmin<{ id: string }>('team', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const profileId = context?.params?.id
    if (!profileId) return apiBadRequest('Profil-ID fehlt')

    // Make sure the profile exists before we accept a leave period for it.
    // Cheap existence-check vs surfacing the FK violation as a 500.
    const [profile] = await db
      .select({ id: teamProfiles.id, userId: teamProfiles.userId })
      .from(teamProfiles)
      .where(eq(teamProfiles.id, profileId))
      .limit(1)
    if (!profile) return apiNotFound('Team-Profil')

    const body = await request.json()
    const parsed = createLeaveSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabedaten', parsed.error.flatten().fieldErrors)
    }

    const [created] = await db
      .insert(leavePeriods)
      .values({
        teamProfileId: profileId,
        startsOn: parsed.data.starts_on,
        endsOn: parsed.data.ends_on,
        kind: parsed.data.kind,
        notes: parsed.data.notes ?? null,
        createdBy: session.user.id,
      })
      .returning({
        id: leavePeriods.id,
        starts_on: leavePeriods.startsOn,
        ends_on: leavePeriods.endsOn,
        kind: leavePeriods.kind,
        notes: leavePeriods.notes,
      })

    // Same ledger as the request flow: echo the leave into the person's
    // timecards so the Zeit-/Feriensaldo stays true no matter which door
    // HR uses. Best-effort — the HR record above is already committed.
    const category = leaveKindToTimecardCategory(parsed.data.kind)
    if (category) {
      await materializeLeaveEntries({
        userId: profile.userId,
        category,
        startsOn: parsed.data.starts_on,
        endsOn: parsed.data.ends_on,
        description: 'Von HR erfasste Abwesenheit',
      }).catch(err => logger.warn('Leave materialization failed', { error: err, profileId }))
    }

    logger.info('Leave period created', {
      profileId,
      leaveId: created.id,
      kind: parsed.data.kind,
      adminId: session.user.id,
    })
    return apiSuccess(created, 201)
  } catch (error) {
    logger.error('Failed to create leave period', { error })
    return apiError(error, 'Urlaub konnte nicht erfasst werden')
  }
})
