'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TIMECARD_DAY_GRID } from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { useCellSelection } from './useCellSelection'

/**
 * HourRangePicker — pick a day's worked hours by selecting half-hour slots,
 * on the SAME gesture model as the month calendar (useGridPointerInput):
 * drag/swipe paints a block, a drag starting on a selected slot erases,
 * click/tap toggles one slot, Shift-click adds a range.
 *
 * Split shifts are first-class: paint 08:00–12:00, lift, paint 14:00–17:00.
 * The picker reports:
 *   start    = first selected slot
 *   end      = end of the last selected slot
 *   break    = minutes inside [start, end) that are NOT selected (the gaps)
 *   duration = selected minutes (worked time)
 *
 * Controlled from outside: when the entry's start/end/duration change through
 * another surface (the Von/Bis/Pause fields, a fill action, an absence
 * switch), the grid re-seeds itself — but user gestures never echo back
 * (see `version` in useCellSelection).
 */

const { startHour: DAY_START_HOUR, endHour: DAY_END_HOUR, stepMinutes: STEP_MINUTES } = TIMECARD_DAY_GRID
const SLOT_COUNT = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / STEP_MINUTES

function slotToTime(slotIndex: number): string {
  const mins = DAY_START_HOUR * 60 + slotIndex * STEP_MINUTES
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function timeToSlot(time: string | null | undefined): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null
  const slot = (Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) - DAY_START_HOUR * 60) / STEP_MINUTES
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
  const middayFrom = timeToSlot(TIMECARD_DAY_GRID.middayBreakStart)
  const middayTo = timeToSlot(TIMECARD_DAY_GRID.middayBreakEnd)
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

/** Contiguous runs of selected slot indices → shift blocks for the summary. */
function toBlocks(idxs: number[]): Array<{ from: number; toExcl: number }> {
  const blocks: Array<{ from: number; toExcl: number }> = []
  for (const i of idxs) {
    const last = blocks[blocks.length - 1]
    if (last && last.toExcl === i) last.toExcl = i + 1
    else blocks.push({ from: i, toExcl: i + 1 })
  }
  return blocks
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
  const t = useTranslations('admin.timecards')
  const { duration } = useTimecardIntl()
  const slotKeys = useMemo(() => Array.from({ length: SLOT_COUNT }, (_, i) => String(i)), [])
  const sel = useCellSelection(
    slotKeys,
    reconstructWorkedSlots(start, end, durationMinutes).map(String),
  )

  // Keep the latest onChange in a ref so the report-effect can depend only on
  // the user-gesture version (an inline onChange from the parent would
  // otherwise re-fire it every render and loop).
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // What we last told the parent — so an entry update that merely echoes our
  // own report doesn't re-seed the grid (which would lose the break position).
  const lastReported = useRef<{ start: string | null; end: string | null; duration: number } | null>(null)

  // Report USER-driven changes upward. `version` only moves on gestures, so
  // programmatic re-seeds (setExact below, or the initial seed) never echo.
  useEffect(() => {
    if (sel.version === 0) return
    const idxs = [...sel.selected].map(Number).sort((a, b) => a - b)
    if (idxs.length === 0) {
      lastReported.current = { start: null, end: null, duration: 0 }
      onChangeRef.current(null, null, 0, 0)
      return
    }
    const from = idxs[0]
    const to = idxs[idxs.length - 1]
    const worked = idxs.length * STEP_MINUTES
    const span = (to - from + 1) * STEP_MINUTES
    lastReported.current = { start: slotToTime(from), end: slotToTime(to + 1), duration: worked }
    onChangeRef.current(slotToTime(from), slotToTime(to + 1), span - worked, worked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel.version])

  // Re-seed when the entry changed through ANOTHER surface (time fields, fill
  // action, absence→work switch) — recognised by not matching our last report.
  const { setExact } = sel
  useEffect(() => {
    const r = lastReported.current
    if (r && r.start === (start ?? null) && r.end === (end ?? null) && r.duration === durationMinutes) return
    setExact(reconstructWorkedSlots(start, end, durationMinutes).map(String))
  }, [start, end, durationMinutes, setExact])

  const idxs = [...sel.selected].map(Number).sort((a, b) => a - b)
  const hasSelection = idxs.length > 0
  const blocks = toBlocks(idxs)
  const worked = idxs.length * STEP_MINUTES
  const breakMinutes = hasSelection
    ? (idxs[idxs.length - 1] - idxs[0] + 1) * STEP_MINUTES - worked
    : 0

  return (
    <div>
      <div
        {...sel.containerProps}
        role="grid"
        aria-label={t('hourGridLabel')}
        className="grid touch-pan-y select-none grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8"
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
              {...sel.getCellProps(key)}
              className={cn(
                'h-auto min-h-9 rounded-md border px-0 py-2 text-center font-mono text-xs tabular-nums transition-colors',
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
              {blocks.map(b => `${slotToTime(b.from)}–${slotToTime(b.toExcl)}`).join(' · ')}
            </span>{' '}
            · {duration(worked)}
            {breakMinutes > 0 && <> · {duration(breakMinutes)} {t('hourBreakSuffix')}</>}
          </>
        ) : (
          <>
            {/* Device-matched hint (drag vs swipe wording). */}
            <span className="[@media(pointer:coarse)]:hidden">{t('hourHint')}</span>
            <span className="hidden [@media(pointer:coarse)]:inline">{t('hourHintTouch')}</span>
          </>
        )}
      </p>
    </div>
  )
}
