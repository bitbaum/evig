/**
 * Materialize an APPROVED time-off request into the ledgers — the "one flow"
 * that unifies vacation data (previously the request, the HR leave_periods
 * record and the timecard entries were three disconnected inputs):
 *
 *   approved request ──▶ leave_periods (HR record)
 *                    └─▶ timecard entries on the person's SCHEDULED days
 *                        (holidays skipped, existing entries never clobbered)
 *
 * Feriensaldo counts ferien timecard entries, so an approved request lowers
 * the balance without the person typing anything twice.
 *
 * Cards that are already approved or payroll-locked are left untouched — the
 * owner gets a notification to reconcile instead (never silently rewrite a
 * reviewed card).
 */

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { leavePeriods, teamProfiles } from '@/db/schema'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { timeOffKindToEntryCategory, type TimeOffKind } from '@/config/time-off'
import { getAbsenceType } from '@/config/timecards'
import { getHolidayDateSet } from '@/config/holidays'
import {
  parseWeeklySchedule,
  weekdayIdFromDate,
  getScheduleDayMinutes,
} from '@/lib/team/schedule'
import {
  getOrCreateTimecardForUser,
  saveTimecardDraft,
} from '@/lib/services/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'

// leave_periods.kind CHECK: vacation | sick | parental | unpaid | military | other
const LEAVE_KIND: Record<string, string> = {
  ferien: 'vacation',
  unbezahlt: 'unpaid',
  militaer: 'military',
  unfall: 'sick',
  other: 'other',
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** leave_periods.kind → timecard absence category (null = no timecard echo). */
const LEAVE_KIND_TO_CATEGORY: Record<string, string | null> = {
  vacation: 'ferien',
  sick: 'krank',
  military: 'militaer',
  unpaid: 'unbezahlt',
  parental: null, // no matching timecard category — HR record only
  other: null,
}

/**
 * Write absence entries into the person's month cards for every SCHEDULED
 * day in the range (holidays skipped, existing entries never clobbered).
 * Shared by the time-off approval flow AND the HR "Urlaub erfassen" card —
 * both paths land in the same ledger, so the Feriensaldo is always true.
 */
export async function materializeLeaveEntries(params: {
  userId: string
  category: string
  startsOn: string
  endsOn: string
  description: string
}): Promise<void> {
  const { userId, category, startsOn, endsOn } = params

  const [profile] = await db
    .select({ id: teamProfiles.id, workingHours: teamProfiles.workingHours })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)

  const paid = getAbsenceType(category)?.paid ?? false
  const schedule = parseWeeklySchedule(profile?.workingHours ?? null)
  const hasSchedule = Object.values(schedule.days).some(d => d.enabled)
  const holidays = getHolidayDateSet(Number(startsOn.slice(0, 4)), Number(endsOn.slice(0, 4)))

  // Group the affected dates by month period.
  const datesByMonth = new Map<string, string[]>()
  for (let date = startsOn; date <= endsOn; date = addDaysIso(date, 1)) {
    const weekday = weekdayIdFromDate(date)
    const scheduledDay = hasSchedule
      ? schedule.days[weekday].enabled
      : !['saturday', 'sunday'].includes(weekday)
    if (!scheduledDay || holidays.has(date)) continue
    const month = date.slice(0, 7)
    datesByMonth.set(month, [...(datesByMonth.get(month) ?? []), date])
  }

  for (const [month, dates] of datesByMonth) {
    try {
      const card = await getOrCreateTimecardForUser(userId, { period_type: 'month', period_date: `${month}-01` })
      const existingDates = new Set(card.entries.map(e => e.work_date))
      const additions: TimecardEntryInput[] = dates
        .filter(d => !existingDates.has(d))
        .map(date => {
          const day = schedule.days[weekdayIdFromDate(date)]
          const minutes = paid
            ? (hasSchedule && day.enabled ? getScheduleDayMinutes(day) : 8 * 60)
            : 0
          return {
            work_date: date,
            start_time: null,
            end_time: null,
            break_minutes: 0,
            duration_minutes: minutes,
            category,
            description: params.description,
            source: 'manual' as const,
          }
        })
      if (additions.length === 0) continue

      await saveTimecardDraft(userId, {
        period_type: 'month',
        period_start: card.period_start,
        period_end: card.period_end,
        notes: card.notes ?? null,
        entries: [
          ...card.entries.map(e => ({
            work_date: e.work_date,
            start_time: e.start_time ?? null,
            end_time: e.end_time ?? null,
            break_minutes: e.break_minutes ?? 0,
            duration_minutes: e.duration_minutes,
            category: e.category,
            description: e.description ?? undefined,
            source: (e.source ?? 'manual') as TimecardEntryInput['source'],
          })),
          ...additions,
        ],
      }, { keepSubmitted: true })
    } catch (error) {
      // Approved / payroll-locked month: don't touch it — tell the owner.
      logger.warn('Time-off materialization skipped for month', { error, userId, month })
      await createNotification(userId, {
        type: NOTIFICATION_TYPES.TIME_OFF_REVIEWED,
        title: 'Abwesenheit manuell nachtragen',
        content: `Deine genehmigte Abwesenheit (${startsOn} – ${endsOn}) konnte im Monat ${month} nicht automatisch eingetragen werden (Zeitkarte bereits genehmigt/gesperrt). Bitte kläre das mit der Freigabe-Person.`,
      }).catch(() => undefined)
    }
  }
}

export async function materializeApprovedTimeOff(params: {
  userId: string
  kind: string
  startsOn: string
  endsOn: string
  note?: string | null
  reviewerId: string
}): Promise<void> {
  const { userId, kind, startsOn, endsOn } = params

  const [profile] = await db
    .select({ id: teamProfiles.id })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)

  // HR record (leave_periods) — profile-scoped, so only when a profile exists.
  if (profile) {
    await db.insert(leavePeriods).values({
      teamProfileId: profile.id,
      startsOn,
      endsOn,
      kind: LEAVE_KIND[kind] ?? 'other',
      notes: params.note ?? null,
      createdBy: params.reviewerId,
    }).catch(err => logger.warn('leave_periods insert failed', { error: err, userId }))
  }

  const category = timeOffKindToEntryCategory(kind as TimeOffKind)
  await materializeLeaveEntries({
    userId,
    category,
    startsOn,
    endsOn,
    description: 'Aus genehmigtem Abwesenheitsantrag',
  })
}

/** For the HR leave card: leave kind → timecard category (or null). */
export function leaveKindToTimecardCategory(kind: string): string | null {
  return LEAVE_KIND_TO_CATEGORY[kind] ?? null
}
