/**
 * Saldo service — loads everything the pure engine (lib/team/saldo) needs
 * for one person and returns the combined Zeit- + Feriensaldo. Used by the
 * Zeiterfassung page (own saldo), the admin team profile (any member), and
 * the monthly reminder cron.
 */

import { and, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  employmentPeriods,
  teamProfiles,
  timecardEntries,
  timecards,
  vacationEntitlements,
} from '@/db/schema'
import { TIMECARD_ENTRY_CATEGORIES, TIMECARD_STATUSES } from '@/config/timecards'
import { getHolidayDateSet } from '@/config/holidays'
import { parseWeeklySchedule, getScheduleWeeklyMinutes } from '@/lib/team/schedule'
import {
  computeTimeSaldo,
  computeVacationBalance,
  type SaldoResult,
  type VacationResult,
} from '@/lib/team/saldo'

export interface PersonSaldo {
  time: SaldoResult
  vacation: VacationResult
  /** Current Pensum in weekly minutes (0 = none on file). */
  weeklyMinutes: number
  /** Weekly minutes the personal schedule template sums to. */
  scheduleWeeklyMinutes: number
  /** Schedule template and Pensum disagree — worth a hint in the UI. */
  scheduleMismatch: boolean
}

function todayIsoZurich(): string {
  // en-CA gives YYYY-MM-DD directly.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date())
}

/**
 * Returns null when the user has no team profile or no employment period —
 * a saldo for volunteers without Pensum would be noise, so callers hide it.
 */
export async function getPersonSaldo(userId: string, today = todayIsoZurich()): Promise<PersonSaldo | null> {
  const [profile] = await db
    .select({
      id: teamProfiles.id,
      workingHours: teamProfiles.workingHours,
      timeOpeningMinutes: teamProfiles.timeOpeningMinutes,
      timeOpeningDate: teamProfiles.timeOpeningDate,
    })
    .from(teamProfiles)
    .where(eq(teamProfiles.userId, userId))
    .limit(1)
  if (!profile) return null

  const periods = await db
    .select({ validFrom: employmentPeriods.validFrom, weeklyMinutes: employmentPeriods.weeklyMinutes })
    .from(employmentPeriods)
    .where(eq(employmentPeriods.teamProfileId, profile.id))
  if (periods.length === 0) return null

  const start = profile.timeOpeningDate ?? [...periods].sort((a, b) => a.validFrom.localeCompare(b.validFrom))[0].validFrom
  const year = Number(today.slice(0, 4))

  const [entries, [entitlement], [ferienTaken]] = await Promise.all([
    db
      .select({
        work_date: timecardEntries.workDate,
        duration_minutes: timecardEntries.durationMinutes,
        category: timecardEntries.category,
      })
      .from(timecardEntries)
      .innerJoin(timecards, eq(timecardEntries.timecardId, timecards.id))
      .where(and(
        eq(timecards.userId, userId),
        ne(timecards.status, TIMECARD_STATUSES.REJECTED),
        gte(timecardEntries.workDate, start),
        lte(timecardEntries.workDate, today),
      )),
    db
      .select({
        days: vacationEntitlements.days,
        carryoverDays: vacationEntitlements.carryoverDays,
      })
      .from(vacationEntitlements)
      .where(and(
        eq(vacationEntitlements.teamProfileId, profile.id),
        eq(vacationEntitlements.year, year),
      ))
      .limit(1),
    db
      .select({ days: sql<number>`COUNT(DISTINCT ${timecardEntries.workDate})` })
      .from(timecardEntries)
      .innerJoin(timecards, eq(timecardEntries.timecardId, timecards.id))
      .where(and(
        eq(timecards.userId, userId),
        ne(timecards.status, TIMECARD_STATUSES.REJECTED),
        eq(timecardEntries.category, TIMECARD_ENTRY_CATEGORIES.FERIEN),
        gte(timecardEntries.workDate, `${year}-01-01`),
        lte(timecardEntries.workDate, `${year}-12-31`),
      )),
  ])

  const schedule = parseWeeklySchedule(profile.workingHours)
  const holidays = getHolidayDateSet(Number(start.slice(0, 4)), year)

  const time = computeTimeSaldo({
    openingMinutes: profile.timeOpeningMinutes ?? 0,
    openingDate: profile.timeOpeningDate,
    periods,
    schedule,
    entries,
    holidays,
    today,
  })
  if (!time) return null

  // Current Pensum = latest period that has started.
  const sortedPeriods = [...periods].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
  let currentWeekly = 0
  for (const p of sortedPeriods) if (p.validFrom <= today) currentWeekly = p.weeklyMinutes

  const vacation = computeVacationBalance({
    entitlementDays: entitlement ? Number(entitlement.days) : null,
    carryoverDays: entitlement ? Number(entitlement.carryoverDays) : 0,
    weeklyMinutes: currentWeekly,
    takenDays: Number(ferienTaken?.days ?? 0),
  })

  const scheduleWeeklyMinutes = getScheduleWeeklyMinutes(schedule)
  return {
    time,
    vacation,
    weeklyMinutes: currentWeekly,
    scheduleWeeklyMinutes,
    scheduleMismatch: scheduleWeeklyMinutes > 0 && Math.abs(scheduleWeeklyMinutes - currentWeekly) > 30,
  }
}

/**
 * Profiles whose monthly reminder fires today: reminder day matches (clamped
 * to short months) and the current month's card is not submitted/approved.
 * Returns the user ids to notify.
 */
export async function getReminderUserIdsForToday(today = todayIsoZurich()): Promise<string[]> {
  const dayOfMonth = Number(today.slice(8, 10))
  const monthStart = `${today.slice(0, 7)}-01`

  const candidates = await db
    .select({ userId: teamProfiles.userId, reminderDay: teamProfiles.zeiterfassungReminderDay })
    .from(teamProfiles)
    .where(and(
      sql`${teamProfiles.zeiterfassungReminderDay} IS NOT NULL`,
      eq(teamProfiles.isActive, true),
    ))

  const due = candidates.filter(c => c.reminderDay === dayOfMonth)
  if (due.length === 0) return []

  const dueIds = due.map(c => c.userId)
  const submitted = await db
    .select({ userId: timecards.userId })
    .from(timecards)
    .where(and(
      inArray(timecards.userId, dueIds),
      eq(timecards.periodStart, monthStart),
      inArray(timecards.status, [TIMECARD_STATUSES.SUBMITTED, TIMECARD_STATUSES.APPROVED]),
    ))
  const done = new Set(submitted.map(r => r.userId))
  return dueIds.filter(id => !done.has(id))
}
