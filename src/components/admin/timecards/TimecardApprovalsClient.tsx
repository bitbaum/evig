'use client'

/**
 * TimecardApprovalsClient
 *
 * Multi-select approval queue. The hot path: HR opens this on Monday
 * morning, scans 18 submitted weekly timecards, ticks them all, hits
 * approve. One round-trip. Edge cases (a row that needs a custom
 * note, or a row that should be rejected) keep their per-row affordances.
 *
 * Density choices:
 *   - One row per timecard, table-style. Avatar + name + dept + period +
 *     hours + status badge. Click a name → opens person profile in a
 *     new tab (so the queue position isn't lost).
 *   - Sticky action bar at the top once anything is selected.
 *   - Filter strip: status tab (open / approved — approving a card must
 *     NOT make it vanish; it moves to the approved tab where it stays
 *     inspectable and editable), period_type (week / month / both).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  ExternalLink,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { TimecardReviewDrawer } from './TimecardReviewDrawer'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  TIMECARD_STATUSES,
  TIMECARD_STATUS_COLORS,
  type TimecardStatus,
} from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { adminInteractive } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

interface ApprovalRow {
  id: string
  user_id: string
  team_profile_id: string | null
  user_name: string | null
  user_email: string
  department: string | null
  position: string | null
  employment_type: string | null
  period_type: string
  period_start: string
  period_end: string
  status: string
  total_minutes: number
  submitted_at: string | null
}

interface ListResponse {
  items: ApprovalRow[]
  limit: number
  offset: number
}

interface BulkResultResponse {
  total: number
  approved: number
  rejected: number
  failed: number
  results: Array<{ id: string; ok: boolean; error?: string }>
}

type PeriodFilter = 'all' | 'week' | 'month'
type StatusFilter = typeof TIMECARD_STATUSES.SUBMITTED | typeof TIMECARD_STATUSES.APPROVED

// Server error codes → translation key for the partial-failure banner.
const BULK_FAILURE_KEYS: Record<string, string> = {
  timecard_self_review: 'failureSelfReview',
  timecard_not_submitted: 'failureNotSubmitted',
  timecard_not_found: 'failureNotFound',
  timecard_payroll_locked: 'failurePayrollLocked',
}

export function TimecardApprovalsClient({
  currentUserId,
  allowSelfReview = false,
}: {
  currentUserId: string
  /** Super-admins may approve their own cards — in a small org they're often
   *  the only approver. The server enforces the same rule; this just avoids
   *  offering a doomed click to everyone else. */
  allowSelfReview?: boolean
}) {
  const t = useTranslations('admin.timecards')
  const { statusLabel, duration, period, locale } = useTimecardIntl()
  const [items, setItems] = useState<ApprovalRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sharedNote, setSharedNote] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(TIMECARD_STATUSES.SUBMITTED)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Bulk approve/reject only makes sense on the open (submitted) tab.
  const bulkEnabled = statusFilter === TIMECARD_STATUSES.SUBMITTED

  const loadQueue = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({
      status: statusFilter,
      limit: '100',
    })
    if (periodFilter !== 'all') params.set('period_type', periodFilter)

    const result = await apiFetch<ListResponse>(`/api/admin/timecards?${params}`)
    if (result.success && result.data) {
      setItems(result.data.items)
      // Drop any selected ids that no longer match.
      setSelected(prev => {
        const stillThere = new Set<string>()
        for (const r of result.data!.items) if (prev.has(r.id)) stillThere.add(r.id)
        return stillThere
      })
    } else {
      setError(result.error || t('queueLoadError'))
    }
    setIsLoading(false)
  }, [periodFilter, statusFilter, t])

  // Reload whenever a filter changes. setState inside the effect
  // is the right pattern here — we kick off an async fetch that calls
  // setItems / setError when it lands — so the lint rule is suppressed.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadQueue()
  }, [loadQueue])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Own cards are normally not selectable — the server enforces the four-eyes
  // rule (timecard_self_review), so don't offer the doomed click. Super-admins
  // are exempt (allowSelfReview) since they're often the sole approver.
  const selectableItems = useMemo(
    () => (allowSelfReview ? items : items.filter(i => i.user_id !== currentUserId)),
    [items, currentUserId, allowSelfReview],
  )
  const allSelected = selectableItems.length > 0 && selected.size === selectableItems.length

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(selectableItems.map(i => i.id)))
  }

  const runBulk = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return
    // A rejection reason is optional — it's sent when provided so the submitter
    // knows what to change, but isn't required.
    setBusy(true)
    setError(null)
    setMessage(null)
    const result = await apiFetch<BulkResultResponse>('/api/admin/timecards/bulk-review', {
      method: 'POST',
      body: {
        ids: Array.from(selected),
        status,
        review_notes: sharedNote.trim() || null,
      },
    })
    setBusy(false)
    if (!result.success || !result.data) {
      setError(result.error || t('queueBulkError'))
      return
    }
    const okCount = result.data.approved + result.data.rejected
    const okPart = status === 'approved'
      ? t('bulkApprovedResult', { count: okCount })
      : t('bulkRejectedResult', { count: okCount })
    // Surface WHY rows failed — a bare failure count without a reason left the
    // approver guessing (self-review, race, payroll lock all looked identical).
    const failureReasons = Array.from(new Set(
      result.data.results
        .filter(r => !r.ok)
        .map(r => {
          const key = BULK_FAILURE_KEYS[r.error ?? '']
          return key ? t(key as never) : (r.error ?? t('failureUnknown'))
        })
    ))
    setMessage(
      okPart +
      (result.data.failed > 0
        ? ` · ${t('bulkFailedResult', { count: result.data.failed, reasons: failureReasons.join(', ') })}`
        : '')
    )
    setSelected(new Set())
    setSharedNote('')
    await loadQueue()
  }

  const totalSelectedMinutes = useMemo(() => {
    return items.filter(i => selected.has(i.id)).reduce((sum, i) => sum + (Number(i.total_minutes) || 0), 0)
  }, [items, selected])

  return (
    <div className="space-y-4">
      {/* Filter strip */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{t('queueStatusLabel')}</span>
          {([TIMECARD_STATUSES.SUBMITTED, TIMECARD_STATUSES.APPROVED] as StatusFilter[]).map(opt => (
            <Button
              key={opt}
              variant={statusFilter === opt ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setStatusFilter(opt); setSelected(new Set()) }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium h-auto ${
                statusFilter === opt
                  ? ''
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              {opt === TIMECARD_STATUSES.SUBMITTED ? t('queueTabOpen') : t('queueTabApproved')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{t('queuePeriodLabel')}</span>
          {(['all', 'week', 'month'] as PeriodFilter[]).map(opt => (
            <Button
              key={opt}
              variant={periodFilter === opt ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriodFilter(opt)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium h-auto ${
                periodFilter === opt
                  ? ''
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              {opt === 'all' ? t('queueFilterAll') : opt === 'week' ? t('queueFilterWeeks') : t('queueFilterMonths')}
            </Button>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueue}
            disabled={isLoading}
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('queueRefresh')}
          </Button>
        </div>
      </div>

      {/* Sticky action bar — only when something is selected */}
      {bulkEnabled && selected.size > 0 && (
        <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:rounded-xl border border-strong dark:border-action/30 bg-action-muted/10 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm font-medium text-action-text">
              {t('queueSelected', { count: selected.size, duration: duration(totalSelectedMinutes) })}
            </div>
            <Input
              type="text"
              value={sharedNote}
              onChange={e => setSharedNote(e.target.value)}
              placeholder={t('queueNotePlaceholder')}
              className="flex-1 min-w-0"
              maxLength={1000}
            />
            <div className="flex gap-2 shrink-0">
              <Button
                variant="primary"
                onClick={() => runBulk('approved')}
                disabled={busy}
                className="inline-flex items-center gap-1.5 bg-success-600 hover:bg-success-700 text-white text-sm font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('queueApproveCount', { count: selected.size })}
              </Button>
              <Button
                variant="destructive-outline"
                onClick={() => runBulk('rejected')}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
              >
                <XCircle className="w-4 h-4" />
                {t('queueReject')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status banners */}
      {message && (
        <div className="rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 px-4 py-2.5 text-sm text-success-700 dark:text-success-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-2.5 text-sm text-error-700 dark:text-error-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue */}
      <div className="rounded-xl border border bg-surface-base overflow-hidden">
        {items.length === 0 && !isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-text-tertiary">
            {t('queueEmpty', { time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-2.5 border-b border flex items-center gap-3 bg-surface-raised">
              {bulkEnabled && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label={t('queueSelectAll')}
                  className="w-4 h-4 rounded-sm border-default text-action focus:ring-action"
                />
              )}
              <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                {t('queueCount', { count: items.length })}
              </span>
            </div>
            <ul className="divide-y divide-subtle">
              {items.map(row => {
                const isSelected = selected.has(row.id)
                // Own card is only lockable when the viewer isn't a super-admin.
                const isOwn = row.user_id === currentUserId && !allowSelfReview
                const status = row.status as TimecardStatus
                const statusColor = TIMECARD_STATUS_COLORS[status] ?? ''
                const subtitleParts = [
                  row.position,
                  row.department,
                  row.employment_type,
                ].filter(Boolean).join(' · ')
                return (
                  <li
                    key={row.id}
                    className={cn(
                      'flex items-center gap-3 px-4 sm:px-6 py-3 transition-colors',
                      isSelected && adminInteractive.rowSelected,
                      adminInteractive.rowHoverFaint,
                    )}
                  >
                    {bulkEnabled && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(row.id)}
                        disabled={isOwn}
                        title={isOwn ? t('queueOwnTooltip') : undefined}
                        aria-label={t('queueRowAria', { name: row.user_name || row.user_email })}
                        className="w-4 h-4 rounded-sm border-default text-action focus:ring-action shrink-0 disabled:opacity-40"
                      />
                    )}
                    <Avatar
                      name={row.user_name || row.user_email}
                      size="sm"
                      colorClassName="bg-surface-overlay text-text-secondary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-text-primary truncate">
                          {row.user_name || row.user_email}
                        </span>
                        {isOwn && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-surface-overlay text-text-tertiary">
                            {t('queueOwnBadge')}
                          </span>
                        )}
                        {row.team_profile_id && (
                          <Link
                            href={`/admin/team/${row.team_profile_id}`}
                            target="_blank"
                            className="text-text-muted hover:text-action"
                            aria-label={t('queueProfileAria')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      {subtitleParts && (
                        <div className="text-xs text-text-tertiary truncate">
                          {subtitleParts}
                        </div>
                      )}
                      {/* Period moves under the name on phones (right column is hidden there). */}
                      <div className="text-xs text-text-tertiary truncate sm:hidden">
                        {period(row.period_type, row.period_start, row.period_end)}
                      </div>
                    </div>
                    <div className="hidden sm:block min-w-0 text-sm text-text-secondary truncate text-right">
                      {period(row.period_type, row.period_start, row.period_end)}
                    </div>
                    <div className="font-semibold text-text-primary text-right whitespace-nowrap text-sm">
                      {duration(Number(row.total_minutes) || 0)}
                    </div>
                    <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}>
                      {statusLabel(row.status)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenCardId(row.id)}
                      className="shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> {t('queueReview')}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {openCardId && (
        <TimecardReviewDrawer
          cardId={openCardId}
          currentUserId={currentUserId}
          allowSelfReview={allowSelfReview}
          onClose={() => setOpenCardId(null)}
          onChanged={loadQueue}
        />
      )}
    </div>
  )
}
