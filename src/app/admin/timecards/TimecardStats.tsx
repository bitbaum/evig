'use client'

import { Clock, UserCheck } from 'lucide-react'
import { TIMECARD_STATUSES, formatTimecardDuration } from '@/config/timecards'
import type { DraftState } from './types'

/**
 * Three-card metric row: monthly hours, draft/submitted status, schedule
 * summary. Pure render — pass everything in.
 */
export function TimecardStats({
  totalMinutes,
  entryCount,
  status,
  scheduleSummary,
  hasSchedule,
}: {
  totalMinutes: number
  entryCount: number
  status: DraftState['status']
  scheduleSummary: string
  hasSchedule: boolean
}) {
  const isSubmitted = status === TIMECARD_STATUSES.SUBMITTED
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border bg-surface-base p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
          Diesen Monat
        </p>
        <p className="mt-2 text-2xl font-semibold text-text-primary">
          {formatTimecardDuration(totalMinutes)}
        </p>
        <p className="mt-1 text-sm text-text-tertiary">
          {entryCount} vorbereitete Tage aus Schedule und Ausnahmen.
        </p>
      </div>

      <div className="rounded-lg border bg-surface-base p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Status</p>
        <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-text-primary">
          {isSubmitted ? (
            <UserCheck className="h-5 w-5 text-success-600" />
          ) : (
            <Clock className="h-5 w-5 text-text-tertiary" />
          )}
          {isSubmitted ? 'Bereit' : 'Entwurf'}
        </p>
        <p className="mt-1 text-sm text-text-tertiary">
          Einreichen heisst: von dir geprüft und bereit für Freigabe.
        </p>
      </div>

      <div className="rounded-lg border bg-surface-base p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Schedule</p>
        <p className="mt-2 text-lg font-semibold text-text-primary">{scheduleSummary}</p>
        {!hasSchedule && (
          <p className="mt-1 text-sm text-warning-600">
            Ohne Standardschedule kannst du nur manuell arbeiten.
          </p>
        )}
      </div>
    </div>
  )
}
