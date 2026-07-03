'use client'

import { useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatTimecardDuration } from '@/config/timecards'
import { useCellSelection } from './useCellSelection'

/**
 * HourRangePicker — pick a day's worked hours by selecting half-hour slots,
 * using the SAME model as the month calendar (useCellSelection): click,
 * Ctrl/Cmd-click for NON-ADJACENT slots, Shift-click or drag for a range.
 *
 * Non-adjacent selection = split shifts: select 09:00–12:00 and 13:00–17:00
 * and the 12:00–13:00 gap becomes the break automatically. The picker reports:
 *   start    = first selected slot
 *   end      = end of the last selected slot
 *   break    = minutes inside [start, end) that are NOT selected (the gaps)
 *   duration = selected minutes (gross worked time)
 *
 * Controlled by the day's entry: the parent keys this component by date, so it
 * re-seeds from the entry whenever the selected day changes.
 */

const DAY_START_HOUR = 6
const DAY_END_HOUR = 22
const STEP_MINUTES = 30
const SLOT_COUNT = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / STEP_MINUTES

function slotToTime(slotIndex: number): string {
  const mins = DAY_START_HOUR * 60 + slotIndex * STEP_MINUTES
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function timeToSlot(time: string | null | undefined): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
  const [h, m] = time.split(':').map(Number)
  const slot = (h * 60 + m - DAY_START_HOUR * 60) / STEP_MINUTES
  if (slot < 0 || slot > SLOT_COUNT) return null
  return Math.round(slot)
}

/**
 * Rebuild the set of worked slots from a stored entry. We know the span
 * [start, end) and the worked duration, but not which middle slots were the
 * break — so we drop the surplus slots from the midday window first (the usual
 * lunch break), then from the end, leaving exactly duration/30 slots selected.
 */
function reconstructWorkedSlots(
  start: string | null | undefined,
  end: string | null | undefined,
  durationMinutes: number,
): number[] {
  const from = timeToSlot(start)
  const toExcl = timeToSlot(end)
  if (from === null || toExcl === null || toExcl <= from) return []
  const span = toExcl - from
  const worked = Math.max(0, Math.min(span, Math.round(durationMinutes / STEP_MINUTES)))
  const slots = new Set<number>()
  for (let i = from; i < toExcl; i++) slots.add(i)
  let toRemove = span - worked
  const middayFrom = timeToSlot('12:00')
  const middayTo = timeToSlot('14:00')
  if (toRemove > 0 && middayFrom !== null && middayTo !== null) {
    for (let i = middayFrom; i < middayTo && toRemove > 0; i++) {
      if (slots.delete(i)) toRemove--
    }
  }
  for (let i = toExcl - 1; i > from && toRemove > 0; i--) {
    if (slots.delete(i)) toRemove--
  }
  return [...slots].sort((a, b) => a - b)
}

export function HourRangePicker({
  start,
  end,
  durationMinutes,
  onChange,
}: {
  start: string | null | undefined
  end: string | null | undefined
  durationMinutes: number
  /** start/end "HH:MM" (null when cleared), break + gross duration in minutes. */
  onChange: (start: string | null, end: string | null, breakMinutes: number, durationMinutes: number) => void
}) {
  const slotKeys = useMemo(() => Array.from({ length: SLOT_COUNT }, (_, i) => String(i)), [])
  // Seed once (component is keyed by date upstream, so this runs per day).
  const initial = useMemo(
    () => reconstructWorkedSlots(start, end, durationMinutes).map(String),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const sel = useCellSelection(slotKeys, initial)

  // Keep the latest onChange in a ref so the report-effect can depend only on
  // the selection (an inline onChange from the parent would otherwise re-fire
  // it every render and loop).
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Report user-driven changes upward; skip the seed render so we don't loop.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const idxs = [...sel.selected].map(Number).sort((a, b) => a - b)
    if (idxs.length === 0) {
      onChangeRef.current(null, null, 0, 0)
      return
    }
    const from = idxs[0]
    const to = idxs[idxs.length - 1]
    const worked = idxs.length * STEP_MINUTES
    const span = (to - from + 1) * STEP_MINUTES
    onChangeRef.current(slotToTime(from), slotToTime(to + 1), span - worked, worked)
  }, [sel.selected])

  const idxs = [...sel.selected].map(Number).sort((a, b) => a - b)
  const hasSelection = idxs.length > 0
  const from = hasSelection ? idxs[0] : 0
  const to = hasSelection ? idxs[idxs.length - 1] : 0
  const worked = idxs.length * STEP_MINUTES
  const breakMinutes = hasSelection ? (to - from + 1) * STEP_MINUTES - worked : 0

  return (
    <div>
      <div
        role="grid"
        aria-label="Arbeitszeit wählen"
        className="grid select-none grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8"
      >
        {slotKeys.map((key, i) => {
          const inRange = sel.selected.has(key)
          const isHourStart = (DAY_START_HOUR * 60 + i * STEP_MINUTES) % 60 === 0
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              aria-pressed={inRange}
              onPointerDown={e => sel.onCellPointerDown(e)}
              onMouseDown={e => sel.onCellMouseDown(key, e)}
              onMouseEnter={() => sel.onCellMouseEnter(key)}
              onClick={e => sel.onCellClick(key, e)}
              className={cn(
                'h-auto rounded-md border px-0 py-2 text-center font-mono text-xs tabular-nums transition-colors',
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
              {slotToTime(from)}–{slotToTime(to + 1)}
            </span>{' '}
            · {formatTimecardDuration(worked)}
            {breakMinutes > 0 && <> · {formatTimecardDuration(breakMinutes)} Pause</>}
          </>
        ) : (
          <>
            {/* Device-matched hint: Ctrl/Cmd and drag don't exist on touch. */}
            <span className="[@media(pointer:coarse)]:hidden">
              Klicke oder ziehe über die Stunden. Ctrl/Cmd-Klick für geteilte Schichten (Lücke = Pause).
            </span>
            <span className="hidden [@media(pointer:coarse)]:inline">
              Tippe zuerst die Start-Stunde an, dann die End-Stunde.
            </span>
          </>
        )}
      </p>
    </div>
  )
}
