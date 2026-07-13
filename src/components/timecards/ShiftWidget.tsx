'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Play, Square, Clock } from 'lucide-react'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_ENTRY_CATEGORY_LABELS,
  type TimecardEntryCategory,
} from '@/config/timecards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Clock-in / clock-out, embedded INTO the timecard tool (not a separate
 * page). A finished shift is handed to `onClockOut`, which writes it into
 * the same month draft the user is editing — so clock-in is an integral,
 * optional part of the tool, fully connected to the rest of it.
 *
 * Active-shift state lives in localStorage (survives refresh / phone-lock);
 * a shift only touches the server when the user clocks out.
 */

export interface ClockedShift {
  work_date: string
  start_time: string
  end_time: string
  minutes: number
  category: TimecardEntryCategory
  description?: string
}

const STORAGE_KEY = 'revampit:active-shift:v1'

interface ActiveShift {
  startedAt: string
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

export function ShiftWidget({ onClockOut }: { onClockOut: (shift: ClockedShift) => void | Promise<void> }) {
  const [active, setActive] = useState<ActiveShift | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState<TimecardEntryCategory>('other')
  const [description, setDescription] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readActive()
    if (stored) {
      setActive(stored)
      setCategory(stored.category)
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])

  const handleStart = useCallback(() => {
    const shift: ActiveShift = { startedAt: new Date().toISOString(), category }
    writeActive(shift)
    setActive(shift)
    setNow(Date.now())
  }, [category])

  const handleStop = useCallback(async () => {
    if (!active || submitting) return
    setSubmitting(true)
    const start = new Date(active.startedAt)
    const end = new Date()
    const minutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
    try {
      await onClockOut({
        // A shift bills to the day it STARTED (crosses-midnight convention).
        work_date: active.startedAt.slice(0, 10),
        start_time: hhmm(start),
        end_time: hhmm(end),
        minutes,
        category: active.category,
        description: description.trim() || undefined,
      })
      writeActive(null)
      setActive(null)
      setDescription('')
    } finally {
      setSubmitting(false)
    }
  }, [active, submitting, description, onClockOut])

  const handleCancel = useCallback(() => {
    writeActive(null)
    setActive(null)
  }, [])

  const startedAtMs = active ? new Date(active.startedAt).getTime() : 0
  const elapsedLabel = useMemo(
    () => (active ? formatElapsed(startedAtMs, now) : null),
    [active, startedAtMs, now],
  )

  return (
    <section
      className={cn(
        'rounded-xl border p-4',
        active ? 'border-action/30 bg-action-muted' : 'border-subtle bg-surface-base',
      )}
    >
      {active ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-action">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Schicht läuft
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-text-primary">{elapsedLabel}</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Start {hhmm(new Date(active.startedAt))} · {TIMECARD_ENTRY_CATEGORY_LABELS[active.category]}
            </p>
          </div>
          {/* Controls share one height (min-h-touch) so the row reads as one unit. */}
          <div className="flex flex-col gap-2 sm:max-w-sm sm:flex-1">
            <Input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional: Was machst du?"
              maxLength={500}
              className="min-h-touch"
            />
            <div className="flex gap-2">
              <Button type="button" variant="primary" onClick={handleStop} disabled={submitting} className="flex-1 gap-2">
                <Square className="h-4 w-4" aria-hidden="true" />
                {submitting ? 'Speichern…' : 'Schicht beenden'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={submitting} className="text-text-tertiary">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">Jetzt arbeiten?</p>
            <p className="mt-1 text-sm text-text-secondary">Starte eine Schicht — sie landet direkt in dieser Zeitkarte.</p>
          </div>
          {/* Stacked full-width on mobile (no cramped side-by-side / overflow);
              height-matched row from sm up. */}
          <div className="flex flex-col items-stretch gap-2 sm:flex-row">
            <label className="sm:flex-none">
              <span className="sr-only">Kategorie</span>
              <Select
                value={category}
                onChange={e => setCategory(e.target.value as TimecardEntryCategory)}
                className="min-h-touch w-full sm:w-48"
              >
                {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{TIMECARD_ENTRY_CATEGORY_LABELS[c]}</option>
                ))}
              </Select>
            </label>
            <Button type="button" variant="primary" onClick={handleStart} className="w-full justify-center gap-2 whitespace-nowrap sm:w-auto">
              <Play className="h-4 w-4" aria-hidden="true" />
              Schicht starten
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
