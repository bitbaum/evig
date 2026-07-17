'use client'

/**
 * Client-side bundle of the locale-aware timecard formatters — ONE hook so
 * every timecard surface (self-service tool, approval queue, review drawer,
 * history) renders statuses, categories, durations, periods, and weekly
 * schedules in the viewer's language instead of hardcoded German.
 */

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  timecardStatusLabel,
  timecardCategoryLabel,
  formatTimecardDurationIntl,
  formatTimecardPeriodIntl,
} from '@/lib/team/timecard-intl'
import {
  WEEKDAY_IDS,
  getScheduleWeeklyMinutes,
  type WeeklySchedule,
  type WeekdayId,
} from '@/lib/team/schedule'

export function useTimecardIntl() {
  const t = useTranslations('admin.timecards')
  const locale = useLocale()

  return useMemo(() => {
    const weekdayLabel = (day: WeekdayId) => t(`weekday.${day}`)

    const scheduleSummary = (schedule: WeeklySchedule): string => {
      const enabledDays = WEEKDAY_IDS.filter(day => schedule.days[day].enabled)
      if (enabledDays.length === 0) return t('scheduleNone')
      const totalMinutes = getScheduleWeeklyMinutes(schedule)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const days = enabledDays.map(weekdayLabel).join(', ')
      return minutes === 0
        ? t('scheduleWeeklySummary', { days, hours })
        : t('scheduleWeeklySummaryWithMinutes', { days, hours, minutes })
    }

    return {
      locale,
      statusLabel: (status: string | null | undefined) => timecardStatusLabel(t, status),
      categoryLabel: (category: string | null | undefined) => timecardCategoryLabel(t, category),
      duration: (totalMinutes: number) => formatTimecardDurationIntl(t, totalMinutes),
      /** Compact form for tight cells (e.g. "7h" / "7.5h") — locale decimal. */
      durationCompact: (totalMinutes: number) =>
        t('durationCellHours', {
          hours: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(totalMinutes / 60),
        }),
      period: (periodType: string, periodStart: string, periodEnd: string) =>
        formatTimecardPeriodIntl(t, locale, periodType, periodStart, periodEnd),
      monthLabel: (date: Date) =>
        new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date),
      weekdayLabel,
      scheduleSummary,
    }
  }, [t, locale])
}
