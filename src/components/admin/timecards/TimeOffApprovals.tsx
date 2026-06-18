'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, X, CalendarCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  getTimeOffKindLabel,
  getTimeOffStatusLabel,
  TIME_OFF_STATUSES,
  type TimeOffStatus,
} from '@/config/time-off'
import type { TimeOffRequest } from '@/lib/schemas/time-off'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<TimeOffStatus, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'neutral',
}

/**
 * TimeOffApprovals — the approver queue (super admins + `timecards` permission).
 * Approve/reject pending requests; the requester is notified automatically.
 */
export function TimeOffApprovals() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await apiFetch<TimeOffRequest[]>(`/api/admin/time-off?status=${filter}`)
    if (res.success) setRequests(res.data ?? [])
  }, [filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data load on filter change
    void load()
  }, [load])

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id)
    const res = await apiFetch<TimeOffRequest>(`/api/admin/time-off/${id}`, {
      method: 'PATCH',
      body: { status, review_notes: null },
    })
    setBusyId(null)
    if (res.success) void load()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
          <CalendarCheck className="h-4 w-4 text-action" aria-hidden="true" />
          Abwesenheitsanträge
        </h2>
        <div className="inline-flex rounded-lg border border-subtle p-0.5">
          {(['pending', 'all'] as const).map(f => (
            <Button
              key={f}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                'h-auto rounded-md px-3 py-1 text-sm',
                filter === f ? 'bg-surface-raised text-text-primary' : 'text-text-tertiary hover:text-text-secondary',
              )}
            >
              {f === 'pending' ? 'Offen' : 'Alle'}
            </Button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-lg border border-subtle bg-canvas px-4 py-6 text-center text-sm text-text-tertiary">
          Keine {filter === 'pending' ? 'offenen ' : ''}Anträge.
        </p>
      ) : (
        <ul className="divide-y divide-subtle rounded-lg border border-subtle">
          {requests.map(r => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {r.user_name || r.user_email || 'Unbekannt'} · {getTimeOffKindLabel(r.kind)}
                </p>
                <p className="text-xs text-text-tertiary">
                  {getDisplayDate(r.starts_on)}
                  {r.ends_on !== r.starts_on && ` – ${getDisplayDate(r.ends_on)}`}
                  {r.note && ` · ${r.note}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.status === TIME_OFF_STATUSES.PENDING ? (
                  <>
                    <Button type="button" variant="primary" size="sm" disabled={busyId === r.id} onClick={() => review(r.id, 'approved')} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Genehmigen
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={busyId === r.id} onClick={() => review(r.id, 'rejected')} className="gap-1.5 text-error-600 hover:bg-error-50">
                      <X className="h-3.5 w-3.5" aria-hidden="true" /> Ablehnen
                    </Button>
                  </>
                ) : (
                  <StatusBadge variant={STATUS_VARIANT[r.status as TimeOffStatus] ?? 'neutral'}>
                    {getTimeOffStatusLabel(r.status)}
                  </StatusBadge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
