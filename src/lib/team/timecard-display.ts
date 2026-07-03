/**
 * Display helpers shared by every timecard-list surface.
 *
 * Extracted after the timecard rebuild left three copies of the same
 * formatPeriod() and two copies of the same status→icon mapping in
 * TimecardHistorySidebar (member view), TeamProfileTimecardsTab
 * (admin profile view), and TimecardApprovalsClient (admin queue).
 * Rule of Three: third copy is the cutoff.
 */

import { CheckCircle2, Clock, AlertCircle, Edit3, type LucideIcon } from 'lucide-react'
import { formatTimecardPeriodLabel } from './timecard-period-label'

/**
 * Map timecard status → lucide icon.
 *
 * Kept as a plain object rather than a per-status component lookup
 * function so callers can `const Icon = TIMECARD_STATUS_ICONS[status] ?? Clock`
 * and render the JSX themselves.
 */
export const TIMECARD_STATUS_ICONS: Record<string, LucideIcon> = {
  draft: Edit3,
  submitted: Clock,
  approved: CheckCircle2,
  rejected: AlertCircle,
}

/**
 * Format a timecard period as a human-readable label.
 *
 * Week periods render as "Woche dd.mm.yyyy–dd.mm.yyyy" with the INCLUSIVE
 * date range visible (period_end is stored exclusive); month periods
 * collapse to "Mai 2026" because the full range adds no information for a
 * calendar month. Implementation lives in timecard-period-label.ts so
 * server code (notifications, activity log) shares the same label.
 */
export function formatTimecardPeriod(periodType: string, periodStart: string, periodEnd: string): string {
  return formatTimecardPeriodLabel(periodType, periodStart, periodEnd)
}
