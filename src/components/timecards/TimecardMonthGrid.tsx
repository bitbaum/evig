'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  formatTimecardDuration,
  isAbsenceCategory,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { getEntryForDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Month grid for the timecard editor.
 *
 * Selection is spreadsheet-style:
 *   - Plain click selects one day (and focuses it for the day editor below).
 *   - Ctrl/Cmd-click toggles a day into a non-adjacent selection.
 *   - Shift-click selects a range from the anchor.
 *   - Click + DRAG across days selects that range in one gesture (the fast
 *     path for "mark these 4 days") — mousedown starts, mouseenter extends,
 *     mouseup anywhere ends.
 *   - Delete/Backspace clears the selected days' entries.
 * Selected days get an action-tinted border + check; the focused day gets a
 * ring. Absence days (Krank/Ferien/…) show the label instead of a duration;
 * gaps render "—" so the eye finds empty days immediately.
 */
export function TimecardMonthGrid({
  visibleDates,
  entries,
  focusedDate,
  selectedDates,
  onDaySelect,
  onWeekdaySelect,
  onClearSelected,
  onDayContextMenu,
}: {
  visibleDates: string[]
  entries: TimecardEntryInput[]
  focusedDate: string
  selectedDates: string[]
  onDaySelect: (date: string, mode: 'single' | 'toggle' | 'range' | 'add') => void
  onWeekdaySelect?: (weekday: number, additive: boolean) => void
  onClearSelected: () => void
  onDayContextMenu?: (date: string, pos: { x: number; y: number }) => void
}) {
  const selected = new Set(selectedDates)

  // Drag-to-select (paint). `dragging` = a day-cell drag is in progress (each
  // entered cell is painted into the selection); `headerDragging` = a weekday
  // header drag (each entered column is added). `dragged` remembers a drag
  // happened so the trailing click doesn't collapse it back to one day.
  const [dragging, setDragging] = useState(false)
  const [headerDragging, setHeaderDragging] = useState(false)
  const dragged = useRef(false)

  // Touch has no mouseenter-drag, no Ctrl/Shift and no right-click, so taps
  // TOGGLE days into the selection instead (multi-select by tapping). The
  // browser fires synthetic mouse events after a tap — pointerdown tells us
  // which device started the interaction so the mouse handlers can stand down.
  const lastPointerType = useRef<string>('mouse')

  useEffect(() => {
    const stop = () => {
      setDragging(false)
      setHeaderDragging(false)
    }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // Weekday-aligned calendar: blanks pad the first row so the 1st lands under
  // its weekday (Mon-first). A real month reads in ~6 rows — no endless scroll.
  const firstDow = (() => {
    const d = new Date(`${visibleDates[0]}T00:00:00.000Z`).getUTCDay()
    return d === 0 ? 6 : d - 1
  })()

  return (
    <div
      role="grid"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          onClearSelected()
        }
      }}
      className="select-none rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action/40"
    >
      <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAY_LABELS.map((w, i) => {
          // WEEKDAY_LABELS is Mon-first; map to JS getUTCDay (Sun=0…Sat=6).
          const weekday = i === 6 ? 0 : i + 1
          return (
            <Button
              key={w}
              type="button"
              variant="ghost"
              title={`Alle ${w} auswählen — ziehen für mehrere Spalten`}
              onMouseDown={e => {
                if (e.button !== 0 || !onWeekdaySelect) return
                e.preventDefault()
                setHeaderDragging(true)
                onWeekdaySelect(weekday, false)
              }}
              onMouseEnter={() => {
                if (headerDragging && onWeekdaySelect) onWeekdaySelect(weekday, true)
              }}
              className={cn(
                // Taller tap target on touch layouts (the header is the only
                // way to select a whole column); compact again on sm+.
                'h-auto w-full rounded-sm bg-transparent px-0 py-2.5 text-center font-mono text-[0.6rem] uppercase tracking-wide transition-colors sm:py-1 sm:text-xs',
                onWeekdaySelect && 'cursor-pointer hover:bg-action-muted hover:text-action',
                i >= 5 ? 'text-text-tertiary' : 'text-text-secondary',
              )}
            >
              {w}
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden="true" />
        ))}
        {visibleDates.map(date => {
          const entry = getEntryForDate(entries, date)
          const isFocused = focusedDate === date
          const isSelected = selected.has(date)
          const d = new Date(`${date}T00:00:00.000Z`)
          const dayNum = d.getUTCDate()
          const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
          const absence = entry ? isAbsenceCategory(entry.category) : false
          const categoryLabel = entry
            ? TIMECARD_ENTRY_CATEGORY_LABELS[entry.category as TimecardEntryCategory]
            : undefined

          return (
            <Button
              key={date}
              type="button"
              variant="ghost"
              onPointerDown={e => {
                lastPointerType.current = e.pointerType
              }}
              onMouseDown={e => {
                // Touch taps arrive here as synthetic mousedowns — selection is
                // handled in onClick for touch (toggle), so stand down.
                if (lastPointerType.current === 'touch') return
                // Modifier clicks (toggle/range) are handled in onClick — let them through.
                if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return
                e.preventDefault()
                dragged.current = false
                setDragging(true)
                onDaySelect(date, 'single')
              }}
              onMouseEnter={() => {
                if (!dragging) return
                dragged.current = true
                // Paint: add exactly the cells the cursor passes over (drag down
                // a column → that weekday's days; across a row → that week).
                onDaySelect(date, 'add')
              }}
              onClick={e => {
                // Swallow the click that ends a drag so it doesn't reset to one day.
                if (dragged.current) {
                  dragged.current = false
                  return
                }
                if (lastPointerType.current === 'touch') {
                  onDaySelect(date, 'toggle')
                  return
                }
                onDaySelect(
                  date,
                  e.shiftKey ? 'range' : e.ctrlKey || e.metaKey ? 'toggle' : 'single',
                )
              }}
              onContextMenu={e => {
                if (!onDayContextMenu) return
                e.preventDefault()
                // Right-clicking a day outside the current selection selects just
                // it; right-clicking inside the selection keeps the whole batch.
                if (!selected.has(date)) onDaySelect(date, 'single')
                onDayContextMenu(date, { x: e.clientX, y: e.clientY })
              }}
              title={categoryLabel}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex h-auto min-h-[3.25rem] w-full min-w-0 flex-col items-start gap-0.5 rounded-md border px-1.5 py-1 text-left transition-colors sm:min-h-[4rem] sm:px-2 sm:py-1.5',
                isSelected
                  ? 'border-action bg-action-muted'
                  : isFocused
                    ? 'border-action ring-2 ring-action/15'
                    : 'border-subtle hover:border-strong',
                !entry && !isSelected && !isFocused && 'bg-canvas',
              )}
            >
              {isSelected && (
                <span className="absolute right-1 top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-action text-action-text">
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
              )}
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  isWeekend ? 'text-text-tertiary' : 'text-text-secondary',
                )}
              >
                {String(dayNum).padStart(2, '0')}
              </span>
              {absence ? (
                <span className="w-full truncate text-[0.65rem] font-medium leading-tight text-action sm:text-xs">
                  {categoryLabel}
                </span>
              ) : (
                <span
                  className={cn(
                    'font-mono text-sm tabular-nums leading-tight sm:text-base',
                    entry ? 'text-text-primary' : 'text-text-tertiary',
                  )}
                >
                  {entry ? formatTimecardDuration(entry.duration_minutes) : '·'}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
