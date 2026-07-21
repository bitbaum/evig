/**
 * Saldo engine — the accounting core. Pure computation, zero dependencies.
 *
 * Principles:
 *  - Saldo is DERIVED, never typed: opening balance + Σ(Ist − Soll).
 *  - Soll comes from effective-dated employment periods (weekly minutes),
 *    distributed over the person's scheduled weekdays. A mid-period change
 *    (e.g. 60% → 80%) keeps every past month correct.
 *  - Public holidays on scheduled days reduce Soll — nobody enters a holiday
 *    row by hand. A holiday-category entry ON a real holiday is dropped from
 *    Ist so it can't double-count.
 *  - Paid absences (holiday/sick/…) count as Ist; unpaid ones don't.
 *  - The running saldo goes through `today`; a scheduled day without entries
 *    shows up as a minus immediately.
 *  - The month decomposition (Soll/Ist for the `today` month) is computed
 *    ALWAYS, even for a month before the opening date — so a historical report
 *    shows real numbers, never a fake 0.
 */

import { WEEKDAY_IDS, weekdayIdFromDate, type WeeklySchedule } from './schedule'
import { DEFAULT_CATEGORY_CONFIG, type CategoryConfig } from './categories'

export interface EmploymentPeriod {
  /** ISO date the weekly target takes effect from. */
  validFrom: string
  /** Contractual weekly minutes (the Pensum). */
  weeklyMinutes: number
}

export interface TimeEntry {
  /** ISO date (YYYY-MM-DD). */
  work_date: string
  duration_minutes: number
  category: string
}

export interface SaldoInput {
  /** Opening balance (carried-in Saldo) and the date it applies from. */
  openingMinutes: number
  openingDate: string | null
  /** Effective-dated weekly-target rows, any order. Empty ⇒ not computable. */
  periods: EmploymentPeriod[]
  /** Personal weekly schedule (which weekdays are workdays). */
  schedule: WeeklySchedule
  /** All time entries in range (rejected/void entries excluded by the caller). */
  entries: TimeEntry[]
  /** ISO dates of public holidays covering the computed range. */
  holidays: Set<string>
  /** "Today" as ISO date (inject for testability / as-of reports). */
  today: string
}

export interface SaldoResult {
  /** Running balance through `today`, in minutes. */
  saldoMinutes: number
  /** Decomposition for the `today` month. */
  monthSollMinutes: number
  monthIstMinutes: number
  monthSaldoMinutes: number
  /** Date the running balance starts from (opening date or first period). */
  computedFrom: string
}

export interface SaldoOptions {
  /** Category semantics (paid/unpaid absence, holiday marker). Default = Swiss. */
  categories?: CategoryConfig
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Weekly target applicable on a date: latest period with validFrom <= date. */
function weeklyMinutesOn(date: string, sorted: EmploymentPeriod[]): number {
  let current = 0
  for (const p of sorted) {
    if (p.validFrom <= date) current = p.weeklyMinutes
    else break
  }
  return current
}

/**
 * Compute the running time balance. Returns null when the person has no
 * employment period (no target ⇒ a balance would be noise).
 */
export function computeTimeSaldo(input: SaldoInput, options: SaldoOptions = {}): SaldoResult | null {
  const cat = options.categories ?? DEFAULT_CATEGORY_CONFIG
  const sorted = [...input.periods].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
  if (sorted.length === 0) return null

  const start = input.openingDate ?? sorted[0].validFrom

  const enabledDays = WEEKDAY_IDS.filter(day => input.schedule.days[day].enabled)
  // No schedule template yet → assume the standard Mon–Fri distribution.
  const scheduledDays = enabledDays.length > 0
    ? new Set<string>(enabledDays)
    : new Set<string>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
  const dayCount = scheduledDays.size

  // The asOf month may predate the opening date (a historical report). Its
  // Soll/Ist must still be real, so the Ist map reaches back to the month start.
  const monthStart = `${input.today.slice(0, 7)}-01`
  const istFrom = start < monthStart ? start : monthStart

  const istByDay = new Map<string, number>()
  for (const e of input.entries) {
    if (e.work_date < istFrom || e.work_date > input.today) continue
    const absence = cat.classifyAbsence(e.category)
    if (absence && !absence.paid) continue
    if (e.category === cat.holidayCategory && input.holidays.has(e.work_date)) continue
    istByDay.set(e.work_date, (istByDay.get(e.work_date) ?? 0) + (e.duration_minutes || 0))
  }

  const sollOn = (date: string): number => {
    if (!scheduledDays.has(weekdayIdFromDate(date)) || input.holidays.has(date)) return 0
    return weeklyMinutesOn(date, sorted) / dayCount
  }

  // Cumulative running balance from the opening date to asOf (opening-gated).
  let saldo = input.openingMinutes
  for (let date = start; date <= input.today; date = addDaysIso(date, 1)) {
    saldo += (istByDay.get(date) ?? 0) - sollOn(date)
  }

  // Month decomposition — always the real target/actual for the asOf month.
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
  /** Entitlement for the year, if HR set one (else the pro-rata default is used). */
  entitlementDays: number | null
  carryoverDays: number
  /** Current weekly minutes (for the pro-rata default). */
  weeklyMinutes: number
  /** Distinct days taken (1 leave entry = 1 day). */
  takenDays: number
  /** Full-time reference for the default (weekly minutes + yearly days). */
  fullTime?: { weeklyMinutes: number; vacationDays: number }
}

export interface VacationResult {
  entitlementDays: number
  carryoverDays: number
  takenDays: number
  balanceDays: number
  /** True when no entitlement was given and the pro-rata default was used. */
  isEstimated: boolean
}

/** Swiss statutory minimum is 4 weeks; default full-time reference = 40h / 20 days. */
const DEFAULT_FULL_TIME = { weeklyMinutes: 40 * 60, vacationDays: 20 }

/**
 * Vacation balance = entitlement + carryover − taken. Without an explicit
 * entitlement, defaults to the full-time yearly days pro-rated by the current
 * weekly minutes, rounded to half days.
 */
export function computeVacationBalance(input: VacationInput): VacationResult {
  const ft = input.fullTime ?? DEFAULT_FULL_TIME
  const isEstimated = input.entitlementDays == null
  const entitlementDays = input.entitlementDays ??
    Math.round((ft.vacationDays * input.weeklyMinutes / ft.weeklyMinutes) * 2) / 2
  const balanceDays = Math.round((entitlementDays + input.carryoverDays - input.takenDays) * 2) / 2
  return { entitlementDays, carryoverDays: input.carryoverDays, takenDays: input.takenDays, balanceDays, isEstimated }
}
