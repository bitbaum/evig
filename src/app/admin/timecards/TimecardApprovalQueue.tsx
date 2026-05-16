'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_STATUSES,
  formatTimecardDuration,
  getTimecardStatusLabel,
} from '@/config/timecards'

interface TimecardReviewRow {
  id: string
  user_name: string | null
  user_email: string
  period_type: string
  period_start: string
  period_end: string
  status: string
  total_minutes: number
  submitted_at: string | null
}

interface TimecardQueueResponse {
  items: TimecardReviewRow[]
  limit: number
  offset: number
}

function formatPeriod(row: TimecardReviewRow): string {
  return `${row.period_start} bis ${row.period_end}`
}

export function TimecardApprovalQueue() {
  const [items, setItems] = useState<TimecardReviewRow[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({
      status: TIMECARD_STATUSES.SUBMITTED,
      period_type: 'month',
      limit: '25',
    })
    const result = await apiFetch<TimecardQueueResponse>(`/api/admin/timecards?${params.toString()}`)
    if (result.success && result.data) {
      setItems(result.data.items)
    } else {
      setError(result.error || 'Zeitkarten konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueue()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadQueue])

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id)
    setError(null)
    setMessage(null)
    const result = await apiFetch(`/api/admin/timecards/${id}`, {
      method: 'PATCH',
      body: {
        status,
        review_notes: notes[id]?.trim() || null,
      },
    })

    if (!result.success) {
      setError(result.error || 'Zeitkarte konnte nicht bearbeitet werden.')
      setBusyId(null)
      return
    }

    setItems(current => current.filter(item => item.id !== id))
    setNotes(current => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setMessage(status === 'approved' ? 'Zeitkarte genehmigt.' : 'Zeitkarte zurückgewiesen.')
    setBusyId(null)
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Freigabe</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Eingereichte Monatskarten prüfen. Normale Karten können direkt genehmigt werden; Rückfragen gehen mit Notiz zurück.
          </p>
        </div>
        <button
          type="button"
          onClick={loadQueue}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-success-700 dark:text-success-300">{message}</p>}
      {error && <p className="mt-3 text-sm text-error-700 dark:text-error-300">{error}</p>}

      <div className="mt-4 space-y-3">
        {items.length === 0 && !isLoading && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-white/[0.06] dark:text-neutral-400">
            Keine eingereichten Monatskarten offen.
          </div>
        )}

        {items.map(item => (
          <article
            key={item.id}
            className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-white/[0.06] dark:bg-neutral-900/40 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  {item.user_name || item.user_email}
                </h3>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                  {getTimecardStatusLabel(item.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {formatPeriod(item)} · {formatTimecardDuration(Number(item.total_minutes) || 0)}
              </p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                {item.user_email}
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                value={notes[item.id] || ''}
                onChange={(event) => setNotes(current => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Notiz nur bei Rückfrage oder Korrektur"
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => review(item.id, TIMECARD_STATUSES.APPROVED)}
                  disabled={busyId === item.id}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success-600 px-3 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Genehmigen
                </button>
                <button
                  type="button"
                  onClick={() => review(item.id, TIMECARD_STATUSES.REJECTED)}
                  disabled={busyId === item.id || !notes[item.id]?.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-800 dark:bg-neutral-900 dark:text-error-300 dark:hover:bg-error-900/20"
                >
                  <XCircle className="h-4 w-4" />
                  Zurück
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
