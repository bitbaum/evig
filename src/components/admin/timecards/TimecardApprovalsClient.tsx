'use client'

/**
 * TimecardApprovalsClient
 *
 * Multi-select approval queue. The hot path: HR opens this on Monday
 * morning, scans 18 submitted weekly timecards, ticks them all, hits
 * "Genehmigen". One round-trip. Edge cases (a row that needs a custom
 * note, or a row that should be rejected) keep their per-row affordances.
 *
 * Density choices:
 *   - One row per timecard, table-style. Avatar + name + dept + period +
 *     hours + status badge. Click a name → opens person profile in a
 *     new tab (so the queue position isn't lost).
 *   - Sticky action bar at the top once anything is selected.
 *   - Filter strip: period_type (week / month / both), status (always
 *     "submitted" by default, can include "rejected" to retry).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  RefreshCw,
  XCircle,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  TIMECARD_STATUSES,
  TIMECARD_STATUS_LABELS,
  TIMECARD_STATUS_COLORS,
  formatTimecardDuration,
  type TimecardStatus,
} from '@/config/timecards'
import { formatTimecardPeriod } from '@/lib/team/timecard-display'
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

export function TimecardApprovalsClient() {
  const [items, setItems] = useState<ApprovalRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sharedNote, setSharedNote] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({
      status: TIMECARD_STATUSES.SUBMITTED,
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
      setError(result.error || 'Zeitkarten konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [periodFilter])

  // Reload whenever the period filter changes. setState inside the effect
  // is the right pattern here — we kick off an async fetch that calls
  // setItems / setError when it lands — so the lint rule is suppressed.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadQueue()
  }, [loadQueue])
  /* eslint-enable react-hooks/set-state-in-effect */

  const allSelected = items.length > 0 && selected.size === items.length

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
    else setSelected(new Set(items.map(i => i.id)))
  }

  const runBulk = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return
    if (status === 'rejected' && !sharedNote.trim()) {
      setError('Eine Begründung ist nötig, wenn Karten zurückgewiesen werden.')
      return
    }
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
      setError(result.error || 'Mehrfach-Freigabe fehlgeschlagen.')
      return
    }
    const okWord = status === 'approved' ? 'genehmigt' : 'zurückgewiesen'
    setMessage(
      `${result.data.approved + result.data.rejected} ${okWord}` +
      (result.data.failed > 0 ? ` · ${result.data.failed} fehlgeschlagen` : '')
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
          <span className="text-sm text-text-secondary">Zeitraum:</span>
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
              {opt === 'all' ? 'Alle' : opt === 'week' ? 'Wochen' : 'Monate'}
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
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Sticky action bar — only when something is selected */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:rounded-xl border border-strong dark:border-action/30 bg-action-muted/10 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm font-medium text-action-text">
              {selected.size} ausgewählt · {formatTimecardDuration(totalSelectedMinutes)}
            </div>
            <Input
              type="text"
              value={sharedNote}
              onChange={e => setSharedNote(e.target.value)}
              placeholder="Notiz (optional bei Genehmigung, Pflicht bei Rückweisung)"
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
                Genehmigen ({selected.size})
              </Button>
              <Button
                variant="destructive-outline"
                onClick={() => runBulk('rejected')}
                disabled={busy || !sharedNote.trim()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                title={!sharedNote.trim() ? 'Notiz erforderlich für Rückweisung' : undefined}
              >
                <XCircle className="w-4 h-4" />
                Zurückweisen
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
            Keine offenen Zeitkarten. Stand: {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-2.5 border-b border flex items-center gap-3 bg-surface-raised">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Alle auswählen"
                className="w-4 h-4 rounded-sm border-default text-action focus:ring-action"
              />
              <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                {items.length} eingereicht
              </span>
            </div>
            <ul className="divide-y divide-subtle">
              {items.map(row => {
                const isSelected = selected.has(row.id)
                const status = row.status as TimecardStatus
                const statusColor = TIMECARD_STATUS_COLORS[status] ?? ''
                const statusLabel = TIMECARD_STATUS_LABELS[status] ?? row.status
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
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(row.id)}
                      aria-label={`Zeitkarte von ${row.user_name || row.user_email} auswählen`}
                      className="w-4 h-4 rounded-sm border-default text-action focus:ring-action shrink-0"
                    />
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
                        {row.team_profile_id && (
                          <Link
                            href={`/admin/team/${row.team_profile_id}`}
                            target="_blank"
                            className="text-text-muted hover:text-action"
                            aria-label="Profil in neuem Tab öffnen"
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
                    </div>
                    <div className="hidden sm:block min-w-0 text-sm text-text-secondary truncate text-right">
                      {formatTimecardPeriod(row.period_type, row.period_start, row.period_end)}
                    </div>
                    <div className="font-semibold text-text-primary text-right whitespace-nowrap text-sm">
                      {formatTimecardDuration(Number(row.total_minutes) || 0)}
                    </div>
                    <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
