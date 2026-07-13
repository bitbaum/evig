'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarPlus, X } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  TIME_OFF_KIND_OPTIONS,
  TIME_OFF_KINDS,
  getTimeOffKindLabel,
  getTimeOffStatusLabel,
  TIME_OFF_STATUSES,
  type TimeOffStatus,
} from '@/config/time-off'
import type { TimeOffRequest } from '@/lib/schemas/time-off'
import { getDisplayDate } from '@/lib/team/timecard-utils'

const STATUS_VARIANT: Record<TimeOffStatus, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

/**
 * TimeOffPanel — staff request future leave (vacation, unpaid, …) and track
 * the approval status. Lives below the timecard editor. A collapsible so it
 * doesn't compete with the calendar for attention.
 */
export function TimeOffPanel() {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [kind, setKind] = useState<string>(TIME_OFF_KINDS.FERIEN)
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch<TimeOffRequest[]>('/api/time-off')
    if (res.success) setRequests(res.data ?? [])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data load on open
    if (open) void load()
  }, [open, load])

  const submit = async () => {
    setError(null)
    if (!startsOn || !endsOn) {
      setError('Bitte Start- und Enddatum wählen.')
      return
    }
    setSubmitting(true)
    const res = await apiFetch<TimeOffRequest>('/api/time-off', {
      method: 'POST',
      body: { kind, starts_on: startsOn, ends_on: endsOn, half_day: false, note: note || null },
    })
    setSubmitting(false)
    if (!res.success) {
      setError(res.error ?? 'Antrag konnte nicht gesendet werden.')
      return
    }
    setStartsOn('')
    setEndsOn('')
    setNote('')
    void load()
  }

  const cancel = async (id: string) => {
    const res = await apiFetch<TimeOffRequest>(`/api/time-off/${id}`, { method: 'PATCH' })
    if (res.success) void load()
  }

  return (
    <section className="border-t border-subtle pt-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-auto items-center gap-2 px-0 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary hover:text-text-secondary"
      >
        <CalendarPlus className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true" />
        Abwesenheit beantragen
      </Button>

      {open && (
        <div className="mt-5 space-y-5">
          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </p>
          )}

          {/* Request form */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">Art</span>
              <Select value={kind} onChange={e => setKind(e.target.value)} className="mt-1 min-h-touch">
                {TIME_OFF_KIND_OPTIONS.map(k => (
                  <option key={k} value={k}>{getTimeOffKindLabel(k)}</option>
                ))}
              </Select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">Von</span>
                <Input type="date" value={startsOn} onChange={e => setStartsOn(e.target.value)} className="mt-1 min-h-touch" />
              </label>
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">Bis</span>
                <Input type="date" value={endsOn} min={startsOn || undefined} onChange={e => setEndsOn(e.target.value)} className="mt-1 min-h-touch" />
              </label>
            </div>
            <label className="block sm:col-span-2">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">Notiz (optional)</span>
              <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="z.B. Sommerferien" className="mt-1 resize-none" />
            </label>
            <div className="sm:col-span-2">
              <Button type="button" variant="primary" onClick={submit} disabled={submitting}>
                {submitting ? 'Wird gesendet …' : 'Antrag senden'}
              </Button>
            </div>
          </div>

          {/* My requests */}
          {requests.length > 0 && (
            <ul className="divide-y divide-subtle rounded-lg border border-subtle">
              {requests.map(r => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {getTimeOffKindLabel(r.kind)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {getDisplayDate(r.starts_on)}
                      {r.ends_on !== r.starts_on && ` – ${getDisplayDate(r.ends_on)}`}
                      {r.review_notes && ` · ${r.review_notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={STATUS_VARIANT[r.status as TimeOffStatus] ?? 'neutral'}>
                      {getTimeOffStatusLabel(r.status)}
                    </StatusBadge>
                    {r.status === TIME_OFF_STATUSES.PENDING && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => cancel(r.id)}
                        className="h-auto px-1.5 py-1 text-text-tertiary hover:text-error-600"
                        aria-label="Antrag zurückziehen"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
