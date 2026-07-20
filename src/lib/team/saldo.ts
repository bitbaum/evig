/**
 * Zeitsaldo / Feriensaldo engine — pure computation (no DB, no HTTP).
 *
 * Replaces the accounting half of the legacy SMALL-Time punch clock.
 * Principles (mirroring how every serious Zeiterfassung does it):
 *
 *  - Saldo is DERIVED, never typed: opening balance + Σ(Ist − Soll).
 *  - Soll comes from effective-dated employment periods (weekly minutes),
 *    distributed over the person's scheduled weekdays. A 60%→80% change
 *    mid-year keeps every past month correct.
 *  - Public holidays (config SSOT) on scheduled days reduce Soll — nobody
 *    enters a «Feiertag» row by hand. Feiertag-category entries falling ON
 *    a calendar holiday are excluded from Ist so legacy habits can't
 *    double-count.
 *  - Paid absences (Ferien/Krank/…, TIMECARD_ABSENCE_TYPES.paid) count as
 *    Ist; unpaid ones don't. That matches Swiss practice: paid leave
 *    fulfils Soll.
 *  - The live saldo runs through *today* like SMALL-Time's did — a
 *    scheduled day without entries shows up as minus immediately, which is
 *    exactly the nudge people expect from the old tool.
 */

import { getAbsenceType, TIMECARD_ENTRY_CATEGORIES } from '@/config/timecards'
import { WEEKDAY_IDS, weekdayIdFromDate, type WeeklySchedule } from '@/lib/team/schedule'

export interface SaldoEmploymentPeriod {
  validFrom: string // ISO date
  weeklyMinutes: number
}

export interface SaldoEntry {
  work_date: string
  duration_minutes: number
  category: string
}

export interface SaldoInput {
  /** Opening balance (legacy «Übertrag T») and the date it applies from. */
  openingMinutes: number
  openingDate: string | null
  /** Effective-dated Pensum rows, any order. Empty ⇒ saldo not computable. */
  periods: SaldoEmploymentPeriod[]
  /** Personal weekly schedule (which weekdays are workdays). */
  schedule: WeeklySchedule
  /** All timecard entries of non-rejected cards in [start, today]. */
  entries: SaldoEntry[]
  /** ISO dates of public holidays covering the computed range. */
  holidays: Set<string>
  /** "Today" as ISO date (inject for testability). */
  today: string
}

export interface SaldoResult {
  /** Running balance through today, in minutes. */
  saldoMinutes: number
  /** Current month decomposition (Soll-to-date, like the legacy tool). */
  monthSollMinutes: number
  monthIstMinutes: number
  monthSaldoMinutes: number
  /** Date the computation starts from (opening date or first period). */
  computedFrom: string
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Pensum applicable on a date: latest period with validFrom <= date. */
function weeklyMinutesOn(date: string, sorted: SaldoEmploymentPeriod[]): number {
  let current = 0
  for (const p of sorted) {
    if (p.validFrom <= date) current = p.weeklyMinutes
    else break
  }
  return current
}

/**
 * Compute the running Zeitsaldo. Returns null when the person has no
 * employment period (volunteers without Pensum — a saldo would be noise).
 */
export function computeTimeSaldo(input: SaldoInput): SaldoResult | null {
  const sorted = [...input.periods].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
  if (sorted.length === 0) return null

  const start = input.openingDate ?? sorted[0].validFrom

  const enabledDays = WEEKDAY_IDS.filter(day => input.schedule.days[day].enabled)
  // No schedule template yet → assume the standard Mon–Fri distribution so
  // the saldo is still meaningful (same fallback the fill button uses).
  const scheduledDays = enabledDays.length > 0
    ? new Set<string>(enabledDays)
    : new Set<string>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const dayCount = scheduledDays.size

  // The asOf month may predate the tracking-opening date (a historical /
  // pre-cutover report). Its Soll/Ist must still be REAL, so the Ist map and
  // the month loop reach back to the month start even when it's before `start`.
  const monthStart = `${input.today.slice(0, 7)}-01`
  const istFrom = start < monthStart ? start : monthStart

  // Ist per day. Feiertag-category minutes on an actual calendar holiday are
  // dropped (the holiday already reduced Soll — counting both would inflate).
  const istByDay = new Map<string, number>()
  for (const e of input.entries) {
    if (e.work_date < istFrom || e.work_date > input.today) continue
    const absence = getAbsenceType(e.category)
    if (absence && !absence.paid) continue
    if (e.category === TIMECARD_ENTRY_CATEGORIES.FEIERTAG && input.holidays.has(e.work_date)) continue
    istByDay.set(e.work_date, (istByDay.get(e.work_date) ?? 0) + (e.duration_minutes || 0))
  }

  const sollOn = (date: string): number => {
    if (!scheduledDays.has(weekdayIdFromDate(date)) || input.holidays.has(date)) return 0
    return weeklyMinutesOn(date, sorted) / dayCount
  }

  // Cumulative running balance: opening + Σ(ist − soll) from the opening date to
  // asOf. Opening-gated — days before `start` are already settled in the
  // opening balance, so this loop simply doesn't run for a pre-opening month.
  let saldo = input.openingMinutes
  for (let date = start; date <= input.today; date = addDaysIso(date, 1)) {
    saldo += (istByDay.get(date) ?? 0) - sollOn(date)
  }

  // Month decomposition: the real target/actual for the asOf month, always —
  // independent of the opening gate, so a pre-opening month is never shown as 0.
  let monthSoll = 0
  let monthIst = 0
  for (let date = monthStart; date <= input.today; date = addDaysIso(date, 1)) {
    monthSoll += sollOn(date)
    monthIst += istByDay.get(date) ?? 0
  }

  return {
    saldoMinutes: Math.round(saldo),
    monthSollMinutes: Math.round(monthSoll),
    monthIstMinutes: Math.round(monthIst),
    monthSaldoMinutes: Math.round(monthIst - monthSoll),
    computedFrom: start,
  }
}

export interface VacationInput {
  /** Entitlement row for the year, if HR created one. */
  entitlementDays: number | null
  carryoverDays: number
  /** Current Pensum in weekly minutes (for the default entitlement). */
  weeklyMinutes: number
  /** Distinct days with a «Ferien» entry in the year (1 entry = 1 day). */
  takenDays: number
}

export interface VacationResult {
  entitlementDays: number
  carryoverDays: number
  takenDays: number
  balanceDays: number
  /** True when no HR row exists and the pro-rata default was used. */
  isEstimated: boolean
}

/** Statutory Swiss minimum is 4 weeks; RevampIT full time = 40h/week. */
const FULL_TIME_WEEKLY_MINUTES = 40 * 60
const FULL_TIME_VACATION_DAYS = 20

/**
 * Feriensaldo = entitlement + carryover − taken. Without an HR entitlement
 * row, defaults to 20 days pro-rated by Pensum, rounded to half days —
 * exactly how the legacy tool derived «12 Tage/Jahr» for a 60% Pensum.
 */
export function computeVacationBalance(input: VacationInput): VacationResult {
  const isEstimated = input.entitlementDays == null
  const entitlementDays = input.entitlementDays ??
    Math.round((FULL_TIME_VACATION_DAYS * input.weeklyMinutes / FULL_TIME_WEEKLY_MINUTES) * 2) / 2
  const balanceDays = Math.round((entitlementDays + input.carryoverDays - input.takenDays) * 2) / 2
  return {
    entitlementDays,
    carryoverDays: input.carryoverDays,
    takenDays: input.takenDays,
    balanceDays,
    isEstimated,
  }
}
