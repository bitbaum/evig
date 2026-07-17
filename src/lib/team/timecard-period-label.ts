/**
 * Human-readable timecard period label — pure and server-safe (no icon
 * imports, usable from services/notifications as well as components).
 *
 * `period_end` is stored EXCLUSIVE (the next period's first day: a July card
 * ends 2026-08-01). Every user-facing surface must render the INCLUSIVE range
 * — leaking the raw exclusive end reads as "includes August 1st".
 *
 * The no-arg-locale `formatTimecardPeriodLabel` stays German ("Woche …") for
 * server-side notification text. UI surfaces render via `timecard-intl.ts`,
 * which reuses the two locale-aware building blocks below.
 */

import { formatDateShort } from '@/lib/date-formats'

/** Inclusive "dd.mm.yyyy–dd.mm.yyyy" range for a week period. */
export function getTimecardWeekRangeLabel(periodStart: string, periodEnd: string): string {
  const endInclusive = new Date(`${periodEnd}T00:00:00.000Z`)
  endInclusive.setUTCDate(endInclusive.getUTCDate() - 1)
  return `${formatDateShort(periodStart)}–${formatDateShort(endInclusive.toISOString().slice(0, 10))}`
}

/** Month periods collapse to e.g. "Juli 2026" — the full range adds no information. */
export function getTimecardMonthLabel(periodStart: string, locale = 'de-CH'): string {
  return new Date(`${periodStart}T00:00:00.000Z`).toLocaleString(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatTimecardPeriodLabel(
  periodType: string,
  periodStart: string,
  periodEnd: string,
): string {
  if (periodType === 'week') {
    return `Woche ${getTimecardWeekRangeLabel(periodStart, periodEnd)}`
  }
  return getTimecardMonthLabel(periodStart)
}
