'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatTimecardDuration } from '@/config/timecards'

/**
 * HourRangePicker — pick a day's worked block by clicking/dragging across a
 * timeline of half-hour slots. This is the day-view counterpart to the month
 * grid: the SAME interaction (click a slot, drag to extend a contiguous range)
 * applied to hours instead of days, so the tool reads as one consistent system.
 *
 * Unlike the month grid (an arbitrary set of days) a work block is ONE
 * contiguous range, so this picks a single [from, to] span. Selecting a range
 * reports start/end times via onChange; the caller turns that into the day's
 * entry. Break time is handled separately, so the displayed duration here is
 * gross (end − start) — the net is shown by the editor once break is applied.
 */

const DAY_START_HOUR = 6
const DAY_END_HOUR = 22
const STEP_MINUTES = 30

const SLOT_COUNT = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / STEP_MINUTES

function slotToTime(slotIndex: number): string {
  const mins = DAY_START_HOUR * 60 + slotIndex * STEP_MINUTES
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToSlot(time: string | null | undefined): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
  const [h, m] = time.split(':').map(Number)
  const mins = h * 60 + m
  const slot = (mins - DAY_START_HOUR * 60) / STEP_MINUTES
  if (slot < 0 || slot > SLOT_COUNT) return null
  return Math.round(slot)
}

export function HourRangePicker({
  start,
  end,
  onChange,
}: {
  start: string | null | undefined
  end: string | null | undefined
  /** start/end as "HH:MM"; end is the exclusive boundary of the last slot. */
  onChange: (start: string, end: string) => void
}) {
  // Current selection as inclusive slot indices [from, to]. Derived from props
  // so external edits (quick actions, AI) stay in sync.
  const fromSlot = timeToSlot(start)
  const toSlotExclusive = timeToSlot(end)
  const selFrom = fromSlot
  const selTo = toSlotExclusive !== null ? toSlotExclusive - 1 : null
  const hasSelection = selFrom !== null && selTo !== null && selTo >= selFrom

  const [dragging, setDragging] = useState(false)
  const anchor = useRef<number | null>(null)

  useEffect(() => {
    if (!dragging) return
    const stop = () => setDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [dragging])

  const commit = (a: number, b: number) => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    onChange(slotToTime(lo), slotToTime(hi + 1))
  }

  return (
    <div>
      <div
        role="grid"
        aria-label="Arbeitszeit wählen"
        className="grid grid-cols-4 gap-1 select-none sm:grid-cols-8"
      >
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const inRange = hasSelection && i >= (selFrom as number) && i <= (selTo as number)
          const isHourStart = (DAY_START_HOUR * 60 + i * STEP_MINUTES) % 60 === 0
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              aria-pressed={inRange}
              onMouseDown={e => {
                if (e.button !== 0) return
                e.preventDefault()
                anchor.current = i
                setDragging(true)
                commit(i, i)
              }}
              onMouseEnter={() => {
                if (!dragging || anchor.current === null) return
                commit(anchor.current, i)
              }}
              onClick={() => {
                // Plain click (no drag) selects a single 30-min slot.
                if (!dragging) commit(i, i)
              }}
              className={cn(
                'h-auto rounded-md border px-0 py-1.5 text-center font-mono text-xs tabular-nums transition-colors',
                inRange
                  ? 'border-action bg-action-muted text-action'
                  : isHourStart
                    ? 'border-subtle bg-surface-raised text-text-secondary hover:border-strong'
                    : 'border-subtle bg-canvas text-text-tertiary hover:border-strong',
              )}
            >
              {slotToTime(i)}
            </Button>
          )
        })}
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        {hasSelection ? (
          <>
            <span className="font-medium text-text-primary">
              {slotToTime(selFrom as number)}–{slotToTime((selTo as number) + 1)}
            </span>{' '}
            · {formatTimecardDuration(((selTo as number) - (selFrom as number) + 1) * STEP_MINUTES)} brutto
          </>
        ) : (
          'Ziehe über die Stunden, um die Arbeitszeit zu wählen.'
        )}
      </p>
    </div>
  )
}
