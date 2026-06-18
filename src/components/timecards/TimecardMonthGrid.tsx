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
  onClearSelected,
  onDayContextMenu,
}: {
  visibleDates: string[]
  entries: TimecardEntryInput[]
  focusedDate: string
  selectedDates: string[]
  onDaySelect: (date: string, mode: 'single' | 'toggle' | 'range') => void
  onClearSelected: () => void
  onDayContextMenu?: (date: string, pos: { x: number; y: number }) => void
}) {
  const selected = new Set(selectedDates)

  // Drag-to-select. `dragging` enables mouseenter range-extension; `dragged`
  // remembers a drag happened so the trailing click (which fires on mouseup)
  // doesn't collapse the range back to a single day.
  const [dragging, setDragging] = useState(false)
  const dragged = useRef(false)

  useEffect(() => {
    if (!dragging) return
    const stop = () => setDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [dragging])

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
      className="grid grid-cols-2 gap-2 rounded-lg select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action/40 sm:grid-cols-4 md:grid-cols-7"
    >
      {visibleDates.map(date => {
        const entry = getEntryForDate(entries, date)
        const isFocused = focusedDate === date
        const isSelected = selected.has(date)
        const d = new Date(`${date}T00:00:00.000Z`)
        const weekdayLabel = new Intl.DateTimeFormat('de-CH', { weekday: 'short' }).format(d)
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
            onMouseDown={e => {
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
              onDaySelect(date, 'range')
            }}
            onClick={e => {
              // Swallow the click that ends a drag so it doesn't reset to one day.
              if (dragged.current) {
                dragged.current = false
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
              'group relative flex h-auto w-full flex-col gap-1 rounded-lg border bg-surface-base px-3 py-2.5 text-left transition-colors',
              isSelected
                ? 'border-action bg-action-muted'
                : isFocused
                  ? 'border-action ring-2 ring-action/15'
                  : 'border-subtle hover:border-strong',
              !entry && !isSelected && !isFocused && 'bg-canvas',
            )}
          >
            {isSelected && (
              <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-action text-action-text">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
            )}
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  'font-mono text-xs uppercase tracking-wide',
                  isWeekend ? 'text-text-tertiary' : 'text-text-secondary',
                )}
              >
                {weekdayLabel}
              </span>
              <span className="font-mono text-xs tabular-nums text-text-tertiary">
                {String(dayNum).padStart(2, '0')}
              </span>
            </div>
            {absence ? (
              <span className="text-sm font-medium leading-tight text-action">{categoryLabel}</span>
            ) : (
              <span
                className={cn(
                  'font-mono text-lg tabular-nums leading-tight',
                  entry ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                {entry ? formatTimecardDuration(entry.duration_minutes) : '—'}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
