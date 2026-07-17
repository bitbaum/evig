/**
 * Zeit & Pensum administration for one team member (timecards permission).
 *
 * GET  — employment periods, vacation entitlements, opening balance.
 * POST — one of three actions (zod-discriminated):
 *   { action: 'period',      valid_from, weekly_hours }        add/replace a Pensum step
 *   { action: 'entitlement', year, days, carryover_days }      upsert a Ferienanspruch
 *   { action: 'opening',     minutes, date }                   set the Übertrag T
 *
 * These numbers feed the DERIVED saldo (lib/team/saldo) — nothing here
 * writes a balance directly.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { employmentPeriods, teamProfiles, vacationEntitlements } from '@/db/schema'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('period'),
    valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekly_hours: z.number().min(0).max(100),
  }),
  z.object({
    action: z.literal('entitlement'),
    year: z.number().int().min(2000).max(2100),
    days: z.number().min(0).max(60),
    carryover_days: z.number().min(-30).max(30),
  }),
  z.object({
    action: z.literal('opening'),
    minutes: z.number().int().min(-60000).max(60000),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
])

async function profileForUser(userId: string) {
  const [profile] = await db
    .select({ id: teamProfiles.id })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)
  return profile ?? null
}

export const GET = withAdmin('timecards', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const userId = context?.params?.userId
    if (!userId) return apiBadRequest('userId fehlt')
    const profile = await profileForUser(userId)
    if (!profile) return apiSuccess({ periods: [], entitlements: [], opening: null })

    const [periods, entitlements, [opening]] = await Promise.all([
      db.select({
        id: employmentPeriods.id,
        valid_from: employmentPeriods.validFrom,
        weekly_minutes: employmentPeriods.weeklyMinutes,
        notes: employmentPeriods.notes,
      }).from(employmentPeriods)
        .where(eq(employmentPeriods.teamProfileId, profile.id))
        .orderBy(desc(employmentPeriods.validFrom)),
      db.select({
        year: vacationEntitlements.year,
        days: vacationEntitlements.days,
        carryover_days: vacationEntitlements.carryoverDays,
      }).from(vacationEntitlements)
        .where(eq(vacationEntitlements.teamProfileId, profile.id))
        .orderBy(desc(vacationEntitlements.year)),
      db.select({
        minutes: teamProfiles.timeOpeningMinutes,
        date: teamProfiles.timeOpeningDate,
      }).from(teamProfiles).where(eq(teamProfiles.id, profile.id)).limit(1),
    ])

    return apiSuccess({ periods, entitlements, opening: opening ?? null })
  } catch (error) {
    logger.error('Error loading Zeit & Pensum', { error, actorId: session.user.id })
    return apiError(error, 'Daten konnten nicht geladen werden')
  }
})

export const POST = withAdmin('timecards', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const userId = context?.params?.userId
    if (!userId) return apiBadRequest('userId fehlt')
    const parsed = actionSchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)

    const profile = await profileForUser(userId)
    if (!profile) return apiNotFound('Team-Profil')

    const input = parsed.data
    if (input.action === 'period') {
      await db.insert(employmentPeriods).values({
        teamProfileId: profile.id,
        validFrom: input.valid_from,
        weeklyMinutes: Math.round(input.weekly_hours * 60),
        createdBy: session.user.id,
      }).onConflictDoUpdate({
        target: [employmentPeriods.teamProfileId, employmentPeriods.validFrom],
        set: { weeklyMinutes: Math.round(input.weekly_hours * 60), updatedAt: new Date().toISOString() },
      })
    } else if (input.action === 'entitlement') {
      await db.insert(vacationEntitlements).values({
        teamProfileId: profile.id,
        year: input.year,
        days: String(input.days),
        carryoverDays: String(input.carryover_days),
        createdBy: session.user.id,
      }).onConflictDoUpdate({
        target: [vacationEntitlements.teamProfileId, vacationEntitlements.year],
        set: {
          days: String(input.days),
          carryoverDays: String(input.carryover_days),
          updatedAt: new Date().toISOString(),
        },
      })
    } else {
      await db.update(teamProfiles)
        .set({
          timeOpeningMinutes: input.minutes,
          timeOpeningDate: input.date,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(teamProfiles.id, profile.id))
    }

    logActivity({
      actorId: session.user.id,
      action: 'updated_zeit_pensum',
      subjectType: 'team_profile',
      subjectId: profile.id,
      subjectLabel: input.action,
    })

    return apiSuccess({ ok: true })
  } catch (error) {
    logger.error('Error saving Zeit & Pensum', { error, actorId: session.user.id })
    return apiError(error, 'Änderung konnte nicht gespeichert werden')
  }
})
