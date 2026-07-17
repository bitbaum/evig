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
import { useTranslations } from 'next-intl'
import { adminInteractive } from '@/lib/admin-ui'
import Link from 'next/link'
import { Clock, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_STATUS_COLORS,
  TIMECARD_STATUSES,
  type TimecardStatus,
} from '@/config/timecards'
import { formatDateShort } from '@/lib/date-formats'
import { TIMECARD_STATUS_ICONS } from '@/lib/team/timecard-display'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { SaldoStrip, type SaldoStripData } from '@/components/timecards/SaldoStrip'
import { ZeitPensumPanel } from '@/components/admin/team/ZeitPensumPanel'
import { TimecardReviewDrawer } from '@/components/admin/timecards/TimecardReviewDrawer'
import { Input } from '@/components/ui/input'
import { FileText, CalendarPlus } from 'lucide-react'

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
  const t = useTranslations('admin.timecards')
  const { statusLabel, duration, period } = useTimecardIntl()
  const [rows, setRows] = useState<TimecardRow[]>([])
  const [saldo, setSaldo] = useState<SaldoStripData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  // Proxy entry ("erfassen im Namen von") — defaults to the previous month,
  // the classic back-filling case.
  const [proxyMonth, setProxyMonth] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [proxyBusy, setProxyBusy] = useState(false)

  const openMonthForUser = async () => {
    setProxyBusy(true)
    setError(null)
    const res = await apiFetch<{ id: string }>('/api/admin/timecards/for-user', {
      method: 'POST',
      body: { user_id: userId, month: proxyMonth },
    })
    setProxyBusy(false)
    if (res.success && res.data) setOpenCardId(res.data.id)
    else setError(res.error ?? t('actionFailed'))
  }

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ user_id: userId, limit: '25' })
    const [result, saldoRes] = await Promise.all([
      apiFetch<ListResponse>(`/api/admin/timecards?${params}`),
      apiFetch<{ saldo: SaldoStripData | null }>(`/api/timecards/saldo?user_id=${userId}`),
    ])
    if (result.success && result.data) {
      setRows(result.data.items)
    } else {
      setError(result.error || t('queueLoadError'))
    }
    if (saldoRes.success) setSaldo(saldoRes.data?.saldo ?? null)
    setIsLoading(false)
  }, [userId, t])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalMinutes = rows.reduce((sum, r) => sum + (Number(r.total_minutes) || 0), 0)
  const submittedCount = rows.filter(r => r.status === TIMECARD_STATUSES.SUBMITTED).length

  return (
    <div className="space-y-3">
      {saldo && <SaldoStrip data={saldo} compact reportHref={`/admin/team/report/${userId}/${new Date().toISOString().slice(0, 7)}`} />}
      <ZeitPensumPanel userId={userId} onChanged={load} />

      {/* Proxy entry: open (or create) a month card for this person and edit
          it in the review drawer — the Vero/Reza back-filling case. */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="month"
          value={proxyMonth}
          onChange={e => setProxyMonth(e.target.value)}
          className="h-9 w-auto"
          aria-label={t('proxyMonthAria')}
        />
        <Button type="button" variant="outline" size="sm" disabled={proxyBusy || !proxyMonth} onClick={openMonthForUser} className="gap-1.5">
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          {t('proxyOpenMonth')}
        </Button>
      </div>
      {/* Header bar — totals + reload */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-text-secondary">
          {rows.length === 0 && !isLoading
            ? t('profileEmpty')
            : t('profileTotals', { count: rows.length, duration: duration(totalMinutes) })}
        </div>
        <div className="flex items-center gap-2">
          {submittedCount > 0 && (
            <Link
              href="/admin/team/approvals"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 text-warning-700 dark:text-warning-300 text-sm font-medium hover:bg-warning-100 dark:hover:bg-warning-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t('profileToReview', { count: submittedCount })}
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
            {t('queueRefresh')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-subtle bg-surface-base overflow-hidden">
          <ul className="divide-y divide-subtle">
            {rows.map(row => {
              const status = row.status as TimecardStatus
              const Icon = TIMECARD_STATUS_ICONS[status] ?? Clock
              const statusColor = TIMECARD_STATUS_COLORS[status] ?? ''
              const dateRef = row.reviewed_at || row.submitted_at
              return (
                <li key={row.id} className={`px-4 sm:px-5 py-3 ${adminInteractive.rowHoverFaint} transition-colors`}>
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 text-text-tertiary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-medium text-text-primary">
                          {period(row.period_type, row.period_start, row.period_end)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary tabular-nums">
                            {duration(Number(row.total_minutes) || 0)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}>
                            {statusLabel(row.status)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        {row.period_type === 'month' && (
                          <a
                            href={`/admin/team/report/${userId}/${row.period_start.slice(0, 7)}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-action hover:underline"
                            target="_blank"
                          >
                            <FileText className="h-3 w-3" aria-hidden="true" /> {t('reportLink')}
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenCardId(row.id)}
                          className="h-auto px-0 py-0 text-xs font-medium text-action hover:underline"
                        >
                          {t('queueReview')}
                        </Button>
                      </div>
                      {dateRef && (
                        <p className="mt-0.5 text-xs text-text-tertiary">
                          {row.reviewed_at
                            ? t('historyReviewedOn', { date: formatDateShort(dateRef) })
                            : t('historySubmittedOn', { date: formatDateShort(dateRef) })}
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
      {openCardId && (
        <TimecardReviewDrawer
          cardId={openCardId}
          onClose={() => setOpenCardId(null)}
          onChanged={load}
        />
      )}
    </div>
  )
}
