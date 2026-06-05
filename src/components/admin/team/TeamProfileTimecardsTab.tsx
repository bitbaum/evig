'use client'

/**
 * TeamProfileTimecardsTab — shown when HR opens the Zeiterfassung tab on
 * a team-profile detail page. Lists this user's recent timecards with
 * status, period, hours and a deep-link into the global approvals
 * queue when there's something pending.
 *
 * Keeps the rendering close to TimecardHistorySidebar (the user-facing
 * variant) so HR + the staff member see the same shape — the only
 * difference is HR sees an "Open in approvals" affordance for
 * submitted rows.
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Clock, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_STATUS_LABELS,
  TIMECARD_STATUS_COLORS,
  TIMECARD_STATUSES,
  formatTimecardDuration,
  type TimecardStatus,
} from '@/config/timecards'
import { formatDateShort } from '@/lib/date-formats'
import { TIMECARD_STATUS_ICONS, formatTimecardPeriod } from '@/lib/team/timecard-display'

interface TimecardRow {
  id: string
  period_type: string
  period_start: string
  period_end: string
  status: string
  submitted_at: string | null
  reviewed_at: string | null
  review_notes: string | null
  total_minutes: number
}

interface ListResponse {
  items: TimecardRow[]
}

interface Props {
  userId: string
}

export function TeamProfileTimecardsTab({ userId }: Props) {
  const [rows, setRows] = useState<TimecardRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ user_id: userId, limit: '25' })
    const result = await apiFetch<ListResponse>(`/api/admin/timecards?${params}`)
    if (result.success && result.data) {
      setRows(result.data.items)
    } else {
      setError(result.error || 'Zeitkarten konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [userId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalMinutes = rows.reduce((sum, r) => sum + (Number(r.total_minutes) || 0), 0)
  const submittedCount = rows.filter(r => r.status === TIMECARD_STATUSES.SUBMITTED).length

  return (
    <div className="space-y-3">
      {/* Header bar — totals + reload */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-text-secondary">
          {rows.length === 0 && !isLoading
            ? 'Noch keine Zeiterfassungen.'
            : `${rows.length} Karten · ${formatTimecardDuration(totalMinutes)} insgesamt`}
        </div>
        <div className="flex items-center gap-2">
          {submittedCount > 0 && (
            <Link
              href="/admin/team/approvals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 text-warning-700 dark:text-warning-300 text-sm font-medium hover:bg-warning-100 dark:hover:bg-warning-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {submittedCount} zu prüfen
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-xl border border bg-surface-base overflow-hidden">
          <ul className="divide-y divide-subtle">
            {rows.map(row => {
              const status = row.status as TimecardStatus
              const Icon = TIMECARD_STATUS_ICONS[status] ?? Clock
              const statusColor = TIMECARD_STATUS_COLORS[status] ?? ''
              const statusLabel = TIMECARD_STATUS_LABELS[status] ?? row.status
              const dateRef = row.reviewed_at || row.submitted_at
              return (
                <li key={row.id} className="px-4 sm:px-5 py-3 hover:bg-surface-raised dark:hover:bg-surface-base/2 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 text-text-tertiary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary">
                          {formatTimecardPeriod(row.period_type, row.period_start, row.period_end)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary tabular-nums">
                            {formatTimecardDuration(Number(row.total_minutes) || 0)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      {dateRef && (
                        <p className="mt-0.5 text-xs text-text-tertiary">
                          {row.reviewed_at ? 'Geprüft' : 'Eingereicht'} {formatDateShort(dateRef)}
                        </p>
                      )}
                      {row.status === TIMECARD_STATUSES.REJECTED && row.review_notes && (
                        <p className="mt-2 text-xs text-error-700 dark:text-error-300 bg-error-50 dark:bg-error-500/10 rounded-md px-2 py-1.5">
                          {row.review_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
