'use client'

import { useTranslations } from 'next-intl'
import {
  formatTimecardDuration,
  getTimecardStatusColor,
  getTimecardStatusLabel,
} from '@/config/timecards'
import { cn } from '@/lib/utils'

/**
 * Compact month header for the timecard editor: month + status badge on the
 * left, days/total on the right. ONE line of chrome — the schedule summary
 * lives in the plan card above, and Save/Einreichen live ONLY in the sticky
 * bottom bar (they used to be duplicated here, which read as two competing
 * action clusters and cost half a phone screen).
 */
export function TimecardHeader({
  monthLabel,
  totalMinutes,
  entryCount,
  status,
}: {
  monthLabel: string
  totalMinutes: number
  entryCount: number
  /** SERVER status of the card — not the keystroke-level local draft status. */
  status: string
}) {
  const t = useTranslations('admin.timecards')

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-subtle pb-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">{monthLabel}</h2>
        <span
          className={cn(
            'inline-flex -translate-y-px items-center rounded-full px-2 py-0.5 text-xs font-medium',
            getTimecardStatusColor(status),
          )}
        >
          {getTimecardStatusLabel(status)}
        </span>
      </div>
      <p className="text-sm tabular-nums text-text-tertiary">
        {entryCount} {t('headerDaysSuffix')} · {formatTimecardDuration(totalMinutes)}
      </p>
    </header>
  )
}
