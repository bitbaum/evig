/**
 * Human-readable timecard period label — pure and server-safe (no icon
 * imports, usable from services/notifications as well as components).
 *
 * `period_end` is stored EXCLUSIVE (the next period's first day: a July card
 * ends 2026-08-01). Every user-facing surface must render the INCLUSIVE range
 * — leaking the raw exclusive end reads as "includes August 1st".
 */

import { formatDateShort } from '@/lib/date-formats'

export function formatTimecardPeriodLabel(
  periodType: string,
  periodStart: string,
  periodEnd: string,
): string {
  if (periodType === 'week') {
    const endInclusive = new Date(`${periodEnd}T00:00:00.000Z`)
    endInclusive.setUTCDate(endInclusive.getUTCDate() - 1)
    return `Woche ${formatDateShort(periodStart)}–${formatDateShort(endInclusive.toISOString().slice(0, 10))}`
  }
  // Month periods collapse to "Juli 2026" — the full range adds no information.
  return new Date(`${periodStart}T00:00:00.000Z`).toLocaleString('de-CH', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
