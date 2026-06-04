'use client'

/**
 * PayrollClient
 *
 * Tight UX: pick a month, see preview ("5 Karten, 84 Std bereit"),
 * one button to close the batch. Past batches show as a table with
 * a download button per row.
 *
 * The preview auto-refreshes when the month changes so HR never
 * accidentally closes against the wrong period — the count is what
 * they're closing, not whatever they typed last time.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Calendar, Lock, Download, AlertTriangle, CheckCircle2,
  RefreshCw, FileText, Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatTimecardDuration } from '@/config/timecards'
import { formatDateShort } from '@/lib/date-formats'

interface PendingPreview {
  pending_count: number
  pending_minutes: number
}

interface BatchRow {
  id: string
  period_start: string
  period_end: string
  closed_at: string | null
  closed_by_name: string | null
  closed_by_email: string | null
  exported_at: string | null
  notes: string | null
  timecard_count: number
  total_minutes: number
}

interface CloseResponse {
  batchId: string
  linkedCount: number
}

function monthBounds(monthInput: string): { start: string; end: string } | null {
  // monthInput from <input type="month"> is YYYY-MM
  const match = /^(\d{4})-(\d{2})$/.exec(monthInput)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) // 1..12
  const start = `${match[1]}-${match[2]}-01`
  // Last day of the month: day 0 of next month
  const next = new Date(Date.UTC(year, month, 0))
  const end = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
  return { start, end }
}

function currentMonthInput(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatPeriod(s: string, e: string): string {
  return `${formatDateShort(s)} – ${formatDateShort(e)}`
}

export function PayrollClient() {
  const [monthInput, setMonthInput] = useState<string>(() => {
    // Default to LAST month — HR closes May at the start of June.
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [notes, setNotes] = useState('')
  const [preview, setPreview] = useState<PendingPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bounds = monthBounds(monthInput)

  const loadPreview = useCallback(async () => {
    if (!bounds) {
      setPreview(null)
      return
    }
    setPreviewLoading(true)
    setError(null)
    const params = new URLSearchParams({
      period_start: bounds.start,
      period_end: bounds.end,
    })
    const result = await apiFetch<PendingPreview>(`/api/admin/payroll/close?${params}`)
    setPreviewLoading(false)
    if (result.success && result.data) {
      setPreview(result.data)
    } else {
      setError(result.error || 'Vorschau fehlgeschlagen.')
      setPreview(null)
    }
  }, [bounds])

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true)
    const result = await apiFetch<{ items: BatchRow[] }>('/api/admin/payroll/batches')
    setBatchesLoading(false)
    if (result.success && result.data) {
      setBatches(result.data.items)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadPreview()
  }, [loadPreview])
  useEffect(() => {
    void loadBatches()
  }, [loadBatches])
  /* eslint-enable react-hooks/set-state-in-effect */

  const close = async () => {
    if (!bounds) return
    if (!preview || preview.pending_count === 0) {
      setError('Es gibt keine offenen genehmigten Zeitkarten in diesem Zeitraum.')
      return
    }
    setClosing(true)
    setError(null)
    setMessage(null)
    const result = await apiFetch<CloseResponse>('/api/admin/payroll/close', {
      method: 'POST',
      body: {
        period_start: bounds.start,
        period_end: bounds.end,
        notes: notes.trim() || null,
      },
    })
    setClosing(false)
    if (!result.success || !result.data) {
      setError(result.error || 'Lohnlauf konnte nicht abgeschlossen werden.')
      return
    }
    setMessage(`Lohnlauf erstellt — ${result.data.linkedCount} Zeitkarten verbucht.`)
    setNotes('')
    await loadPreview()
    await loadBatches()
  }

  return (
    <div className="space-y-6">
      {/* Close batch card */}
      <div className="rounded-xl border border bg-surface-base p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <Lock className="w-5 h-5 text-action mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Monat abschliessen</h2>
            <p className="text-sm text-text-tertiary">
              Sperrt alle genehmigten Zeitkarten dieses Monats und friert den Stundensatz pro Person ein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs font-medium text-text-secondary mb-1 block">
              Monat
            </span>
            <Input
              type="month"
              value={monthInput}
              onChange={e => setMonthInput(e.target.value)}
              max={currentMonthInput()}
            />
          </label>
          <div className="flex flex-col justify-end">
            <div className="rounded-lg border border bg-surface-raised px-3 py-2">
              {previewLoading ? (
                <span className="text-sm text-text-tertiary inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Lade Vorschau…
                </span>
              ) : preview ? (
                <span className="text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    {preview.pending_count}
                  </span>{' '}
                  Karten · <span className="font-semibold text-text-primary">
                    {formatTimecardDuration(preview.pending_minutes)}
                  </span>{' '}
                  bereit
                </span>
              ) : (
                <span className="text-sm text-text-tertiary">—</span>
              )}
            </div>
          </div>
        </div>

        <label className="block mb-3">
          <span className="text-xs font-medium text-text-secondary mb-1 block">
            Notiz (optional)
          </span>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="z. B. Mai 2026 – Schlussbatch nach Q2 Bonus-Anpassung"
            rows={2}
            maxLength={1000}
          />
        </label>

        {error && (
          <div className="mb-3 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-3 py-2 text-sm text-error-700 dark:text-error-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-3 rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 px-3 py-2 text-sm text-success-700 dark:text-success-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <button
          onClick={close}
          disabled={closing || !preview || preview.pending_count === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-60 bg-action hover:bg-action-hover text-action-text"
        >
          {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Lohnlauf abschliessen
        </button>
      </div>

      {/* Past batches */}
      <div className="rounded-xl border border bg-surface-base overflow-hidden">
        <div className="px-5 py-3.5 border-b border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Vergangene Lohnläufe
            </h2>
          </div>
          <button
            onClick={loadBatches}
            disabled={batchesLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-default text-xs font-medium text-text-secondary hover:bg-surface-raised dark:hover:bg-surface-base/4 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${batchesLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-tertiary">
            Noch keine Lohnläufe abgeschlossen.
          </div>
        ) : (
          <ul className="divide-y divide-subtle">
            {batches.map(batch => (
              <li key={batch.id} className="px-5 py-4 flex items-start gap-3 hover:bg-surface-raised dark:hover:bg-surface-base/2 transition-colors">
                <FileText className="w-4 h-4 mt-1 text-text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">
                      {formatPeriod(batch.period_start, batch.period_end)}
                    </span>
                    {batch.exported_at && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success-700 dark:text-success-300">
                        <CheckCircle2 className="w-3 h-3" /> exportiert
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {batch.timecard_count} Karten · {formatTimecardDuration(Number(batch.total_minutes) || 0)}
                    {batch.closed_by_name && (
                      <> · abgeschlossen von {batch.closed_by_name}</>
                    )}
                    {batch.closed_at && (
                      <> · {formatDateShort(batch.closed_at)}</>
                    )}
                  </p>
                  {batch.notes && (
                    <p className="mt-1 text-xs text-text-secondary">{batch.notes}</p>
                  )}
                </div>
                <a
                  href={`/api/admin/payroll/batches/${batch.id}/export.csv`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success-600 hover:bg-success-700 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
