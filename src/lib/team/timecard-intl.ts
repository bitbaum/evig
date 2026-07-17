/**
 * Locale-aware timecard display helpers — the i18n twin of the German-only
 * helpers in `@/config/timecards` / `timecard-period-label.ts` (those stay for
 * server-side notification text, which is org-German by design).
 *
 * All functions take the next-intl translator scoped to `admin.timecards`, so
 * one implementation serves RSCs (useTranslations/getTranslations) and client
 * components (via the `useTimecardIntl` hook). Pure module — safe everywhere.
 */

import { TIMECARD_STATUS_OPTIONS, TIMECARD_ENTRY_CATEGORY_OPTIONS } from '@/config/timecards'
import { TIME_OFF_KIND_OPTIONS, TIME_OFF_STATUS_OPTIONS } from '@/config/time-off'
import { getTimecardWeekRangeLabel, getTimecardMonthLabel } from './timecard-period-label'

/**
 * Minimal translator shape — keeps callers decoupled from next-intl generics.
 * `key: any` (not string) because next-intl's typed translator narrows its key
 * param to the message-key union, which a `string` param can't accept.
 */
export type TimecardTranslator = (key: any, values?: any) => string

export function timecardStatusLabel(t: TimecardTranslator, status: string | null | undefined): string {
  if (!status) return t('statusUnknown')
  if (!(TIMECARD_STATUS_OPTIONS as readonly string[]).includes(status)) return status
  return t(`status.${status}`)
}

export function timecardCategoryLabel(t: TimecardTranslator, category: string | null | undefined): string {
  if (!category) return t('category.other')
  if (!(TIMECARD_ENTRY_CATEGORY_OPTIONS as readonly string[]).includes(category)) return category
  return t(`category.${category}`)
}

export function formatTimecardDurationIntl(t: TimecardTranslator, totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return t('durationMinutesOnly', { minutes })
  if (minutes === 0) return t('durationHoursOnly', { hours })
  return t('durationHoursMinutes', { hours, minutes })
}

/** `t` scoped to `admin.timeOff`. */
export function timeOffKindLabel(t: TimecardTranslator, kind: string): string {
  if (!(TIME_OFF_KIND_OPTIONS as readonly string[]).includes(kind)) return kind
  return t(`kind.${kind}`)
}

/** `t` scoped to `admin.timeOff`. */
export function timeOffStatusLabel(t: TimecardTranslator, status: string): string {
  if (!(TIME_OFF_STATUS_OPTIONS as readonly string[]).includes(status)) return status
  return t(`status.${status}`)
}

export function formatTimecardPeriodIntl(
  t: TimecardTranslator,
  locale: string,
  periodType: string,
  periodStart: string,
  periodEnd: string,
): string {
  if (periodType === 'week') {
    return t('periodWeek', { range: getTimecardWeekRangeLabel(periodStart, periodEnd) })
  }
  return getTimecardMonthLabel(periodStart, locale)
}
