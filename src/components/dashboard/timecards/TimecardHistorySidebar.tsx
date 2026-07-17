/**
 * Past-timecards history strip shown next to /dashboard/timecards.
 *
 * Optimised for "can I see at a glance whether my April card was approved?"
 * — each row is a status badge + period + submitted/reviewed timestamp +
 * any review notes inlined (not behind an expand). Rejection notes are the
 * single most-important thing to surface, since the user has to act on them.
 */

import { useLocale, useTranslations } from 'next-intl'
import { TIMECARD_STATUS_COLORS, TIMECARD_STATUSES } from '@/config/timecards'
import type { TimecardStatus } from '@/config/timecards'
import { formatDateShort } from '@/lib/date-formats'
import { Clock } from 'lucide-react'
import { TIMECARD_STATUS_ICONS } from '@/lib/team/timecard-display'
import { timecardStatusLabel, formatTimecardPeriodIntl } from '@/lib/team/timecard-intl'

interface HistoryRow {
  id: string
  periodType: string
  periodStart: string
  periodEnd: string
  status: string
  submittedAt: string | null
  reviewedAt: string | null
  reviewNotes: string | null
}

interface Props {
  history: HistoryRow[]
}

export function TimecardHistorySidebar({ history }: Props) {
  const t = useTranslations('admin.timecards')
  const locale = useLocale()

  if (history.length === 0) {
    return (
      <div className="rounded-xl border bg-surface-base p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-2">{t('historyTitle')}</h2>
        <p className="text-sm text-text-tertiary">
          {t('historyEmpty')}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-surface-base overflow-hidden">
      <div className="px-5 py-4 border-b border">
        <h2 className="text-sm font-semibold text-text-primary">{t('historyTitle')}</h2>
        <p className="text-xs text-text-tertiary">
          {t('historyLastCount', { count: history.length })}
        </p>
      </div>
      <ul className="divide-y divide-subtle">
        {history.map(row => {
          const status = row.status as TimecardStatus
          const Icon = TIMECARD_STATUS_ICONS[status] ?? Clock
          const statusColor = TIMECARD_STATUS_COLORS[status] ?? ''
          const dateRef = row.reviewedAt || row.submittedAt
          return (
            <li key={row.id} className="px-5 py-3 hover:bg-surface-raised dark:hover:bg-surface-base/2 transition-colors">
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 mt-0.5 text-text-tertiary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {formatTimecardPeriodIntl(t, locale, row.periodType, row.periodStart, row.periodEnd)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}
                    >
                      {timecardStatusLabel(t, row.status)}
                    </span>
                  </div>
                  {dateRef && (
                    <p className="mt-0.5 text-xs text-text-tertiary">
                      {row.reviewedAt
                        ? t('historyReviewedOn', { date: formatDateShort(dateRef) })
                        : t('historySubmittedOn', { date: formatDateShort(dateRef) })}
                    </p>
                  )}
                  {row.status === TIMECARD_STATUSES.REJECTED && row.reviewNotes && (
                    <p className="mt-2 text-xs text-error-700 dark:text-error-300 bg-error-50 dark:bg-error-500/10 rounded-md px-2 py-1.5">
                      {row.reviewNotes}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
