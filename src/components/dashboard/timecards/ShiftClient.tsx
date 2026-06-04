'use client'

/**
 * ShiftClient — Clock-In hero + live elapsed counter + clock-out flow.
 *
 * State machine:
 *   no-shift   → "Schicht starten" button
 *   active     → live counter + category picker + "Schicht beenden"
 *   submitting → spinner, button disabled
 *   done       → success card, "Neue Schicht starten" cycles back
 *
 * The active shift lives in localStorage so refreshes / phone-locks /
 * accidental-back-button don't lose the start time. When the user clocks
 * out we round to the nearest minute and POST the entry to the current
 * week's draft timecard via /api/timecards.
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Square, CheckCircle2, History, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_ENTRY_CATEGORY_LABELS,
  formatTimecardDuration,
  type TimecardEntryCategory,
} from '@/config/timecards'
import { toISODate } from '@/lib/team/schedule'
import { startOfWeek, getWeekDates } from '@/lib/team/timecard-utils'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface TodayEntry {
  id: string
  startTime: string | null
  endTime: string | null
  durationMinutes: number
  category: string
  description: string | null
}

interface ShiftClientProps {
  todayEntries: TodayEntry[]
  totalMinutesToday: number
  totalMinutesMonth: number
  today: string
  userName: string
}

const STORAGE_KEY = 'revampit:active-shift:v1'
const TICK_MS = 1000

interface ActiveShift {
  startedAt: string // ISO
  category: TimecardEntryCategory
}

function readActive(): ActiveShift | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.startedAt !== 'string') return null
    return { startedAt: parsed.startedAt, category: parsed.category || 'other' }
  } catch {
    return null
  }
}

function writeActive(shift: ActiveShift | null) {
  if (typeof window === 'undefined') return
  if (shift) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shift))
  else window.localStorage.removeItem(STORAGE_KEY)
}

function formatElapsed(startMs: number, nowMs: number): string {
  const total = Math.max(0, Math.floor((nowMs - startMs) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function hhmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function ShiftClient({
  todayEntries,
  totalMinutesToday,
  totalMinutesMonth,
  today,
  userName,
}: ShiftClientProps) {
  const router = useRouter()
  const [active, setActive] = useState<ActiveShift | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState<{ minutes: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<TimecardEntryCategory>('other')
  const [description, setDescription] = useState('')

  // Hydrate from localStorage on mount only. setState inside useEffect is
  // exactly the right pattern here (we can't read localStorage during SSR
  // and need to reconcile after hydration), so the lint rule is suppressed.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readActive()
    if (stored) {
      setActive(stored)
      setCategory(stored.category)
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Live tick while a shift is running. No tick when idle to keep mobile battery happy.
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [active])

  const handleStart = useCallback(() => {
    setError(null)
    setJustSubmitted(null)
    const startedAt = new Date().toISOString()
    const shift: ActiveShift = { startedAt, category }
    writeActive(shift)
    setActive(shift)
    setNow(Date.now())
  }, [category])

  const handleStop = useCallback(async () => {
    if (!active) return
    setSubmitting(true)
    setError(null)

    const start = new Date(active.startedAt)
    const end = new Date()
    const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))

    // The shift's work_date is the day it STARTED — shifts that cross midnight
    // bill to the day they began, which is the convention HR + payroll use.
    const workDate = active.startedAt.slice(0, 10)

    // Compute the current week's period bounds. The /api/timecards PUT
    // endpoint upserts a draft for the matching period; we merge the new
    // entry into whatever is already there.
    const weekStart = startOfWeek(start)
    const periodStart = toISODate(weekStart)
    const weekDates = getWeekDates(periodStart)
    const periodEnd = weekDates[weekDates.length - 1]

    // Read the current draft so we can append rather than clobber existing
    // entries for the week.
    const existing = await apiFetch<{
      entries?: Array<{
        id?: string; work_date: string; start_time?: string | null; end_time?: string | null;
        break_minutes: number; duration_minutes: number; category: string;
        description?: string | null; task_id?: string | null; protocol_id?: string | null; source: string;
      }>;
      notes?: string | null;
    }>(`/api/timecards?period_type=week&period_date=${periodStart}`)

    const priorEntries = existing.success && existing.data?.entries ? existing.data.entries : []
    const newEntry = {
      work_date: workDate,
      start_time: hhmm(start),
      end_time: hhmm(end),
      break_minutes: 0,
      duration_minutes: minutes,
      category: active.category,
      description: description.trim() || null,
      source: 'manual',
    }

    const result = await apiFetch<unknown>('/api/timecards', {
      method: 'PUT',
      body: {
        period_type: 'week',
        period_start: periodStart,
        period_end: periodEnd,
        notes: existing.success ? existing.data?.notes ?? null : null,
        entries: [...priorEntries, newEntry],
      },
    })

    setSubmitting(false)

    if (!result.success) {
      setError(result.error || 'Schicht konnte nicht gespeichert werden.')
      return
    }

    writeActive(null)
    setActive(null)
    setDescription('')
    setJustSubmitted({ minutes })
    router.refresh()
  }, [active, description, router])

  const handleCancel = useCallback(() => {
    writeActive(null)
    setActive(null)
    setJustSubmitted(null)
    setError(null)
  }, [])

  const startedAtMs = active ? new Date(active.startedAt).getTime() : 0
  const elapsedLabel = useMemo(
    () => (active ? formatElapsed(startedAtMs, now) : null),
    [active, startedAtMs, now],
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Heading level={1} className="text-2xl sm:text-3xl font-bold text-text-primary">
          Schicht
        </Heading>
        <p className="mt-1 text-sm text-text-secondary">
          Hallo {userName} – starte deine Schicht mit einem Tipp.
        </p>
      </div>

      {/* Hero: start / running / submitted */}
      {active ? (
        <div className="rounded-2xl border border-strong dark:border-action/30 bg-action-muted/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-action text-sm font-medium mb-2">
            <Clock className="w-4 h-4" /> Schicht läuft
          </div>
          <div className="text-5xl sm:text-6xl font-bold text-action-text tabular-nums tracking-tight">
            {elapsedLabel}
          </div>
          <p className="mt-2 text-sm text-action">
            Start {hhmm(new Date(active.startedAt))} Uhr · {TIMECARD_ENTRY_CATEGORY_LABELS[active.category]}
          </p>

          <div className="mt-6 space-y-3">
            <label className="block">
              <span className="block text-xs font-medium text-action-text mb-1">
                Optional: Was machst du?
              </span>
              <Input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="z. B. Linux-Installfest, Geräteannahme..."
                maxLength={500}
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleStop}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-action hover:bg-action-hover text-action-text text-base font-semibold transition-colors disabled:opacity-60"
              >
                <Square className="w-4 h-4" />
                {submitting ? 'Speichern...' : 'Schicht beenden'}
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-3 rounded-lg border border-strong dark:border-action/40 text-action-text text-base font-medium hover:bg-action-muted/20 transition-colors disabled:opacity-60"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : justSubmitted ? (
        <div className="rounded-2xl border border-success-200 dark:border-success-500/30 bg-success-50 dark:bg-success-500/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-success-700 dark:text-success-300 text-sm font-medium mb-2">
            <CheckCircle2 className="w-4 h-4" /> Gespeichert
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-success-900 dark:text-success-100">
            {formatTimecardDuration(justSubmitted.minutes)} erfasst
          </div>
          <p className="mt-2 text-sm text-success-700 dark:text-success-300">
            Eintrag wurde zur aktuellen Wochen-Zeiterfassung hinzugefügt.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setJustSubmitted(null)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-success-600 hover:bg-success-700 text-white text-base font-semibold transition-colors"
            >
              <Play className="w-4 h-4" /> Neue Schicht starten
            </button>
            <Link
              href="/dashboard/timecards"
              className="px-4 py-3 rounded-lg border border-success-300 dark:border-success-500/40 text-success-700 dark:text-success-200 text-base font-medium hover:bg-success-100 dark:hover:bg-success-500/20 transition-colors text-center"
            >
              Zur Zeiterfassung
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-surface-base p-6 sm:p-8">
          <label className="block mb-4">
            <span className="block text-xs font-medium text-text-secondary mb-1">
              Kategorie
            </span>
            <Select
              value={category}
              onChange={e => setCategory(e.target.value as TimecardEntryCategory)}
            >
              {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>
                  {TIMECARD_ENTRY_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </label>

          <button
            onClick={handleStart}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-4 sm:py-5 rounded-lg bg-action hover:bg-action-hover text-action-text text-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5" />
            Schicht starten
          </button>
          <p className="mt-3 text-xs text-text-tertiary text-center">
            Wird auf deinem Gerät gespeichert, bis du sie beendest.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {/* Today summary */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="rounded-xl border bg-surface-base px-4 py-3">
          <div className="text-xs text-text-tertiary">Heute</div>
          <div className="text-xl font-semibold text-text-primary">
            {formatTimecardDuration(totalMinutesToday)}
          </div>
        </div>
        <div className="rounded-xl border bg-surface-base px-4 py-3">
          <div className="text-xs text-text-tertiary">Diesen Monat</div>
          <div className="text-xl font-semibold text-text-primary">
            {formatTimecardDuration(totalMinutesMonth)}
          </div>
        </div>
      </div>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div className="mt-6 rounded-xl border bg-surface-base overflow-hidden">
          <div className="px-4 py-3 border-b border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <History className="w-4 h-4" /> Heute erfasst
            </h2>
            <Link
              href="/dashboard/timecards"
              className="text-xs text-action hover:underline"
            >
              Bearbeiten
            </Link>
          </div>
          <ul className="divide-y divide-subtle">
            {todayEntries.map(e => (
              <li key={e.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-text-primary truncate">
                    {TIMECARD_ENTRY_CATEGORY_LABELS[e.category as TimecardEntryCategory] || e.category}
                  </div>
                  {e.description && (
                    <div className="text-xs text-text-tertiary truncate">
                      {e.description}
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-text-secondary whitespace-nowrap pl-3">
                  {e.startTime && e.endTime ? `${e.startTime.slice(0,5)}–${e.endTime.slice(0,5)}` : ''}
                  <span className="block font-semibold text-text-primary">
                    {formatTimecardDuration(e.durationMinutes)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
