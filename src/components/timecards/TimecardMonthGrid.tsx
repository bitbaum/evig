'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  isAbsenceCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { WEEKDAY_IDS } from '@/lib/team/schedule'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { getEntryForDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useGridPointerInput } from './useGridPointerInput'

/**
 * Month grid for the timecard editor.
 *
 * Selection runs on the shared pointer engine (useGridPointerInput), so mouse
 * and touch behave symmetrically:
 *   - Mouse: click selects one day; click + drag PAINTS every touched day;
 *     Ctrl/Cmd-click toggles; Shift-click ranges; double-click opens the day
 *     editor; Delete/Backspace clears the selected days' entries.
 *   - Touch: tap toggles a day in/out of the selection; hold a day briefly
 *     (or start a sideways swipe) and drag to paint — starting on a selected
 *     day erases instead. Vertical swipes still scroll the page.
 * Selected days get an action-tinted border + check; the focused day gets a
 * ring. Absence days (Krank/Ferien/…) show the label instead of a duration;
 * gaps render "·" so the eye finds empty days immediately.
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
  onEditDay,
}: {
  visibleDates: string[]
  entries: TimecardEntryInput[]
  focusedDate: string
  selectedDates: string[]
  onDaySelect: (date: string, mode: 'single' | 'toggle' | 'range' | 'add' | 'remove') => void
  onWeekdaySelect?: (weekday: number, additive: boolean) => void
  onClearSelected: () => void
  onDayContextMenu?: (date: string, pos: { x: number; y: number }) => void
  /** Open the day editor for this date (double-click / "Tag bearbeiten"). */
  onEditDay?: (date: string) => void
}) {
  const t = useTranslations('admin.timecards')
  const { categoryLabel, duration, weekdayLabel } = useTimecardIntl()
  const selected = new Set(selectedDates)

  // Whether the running paint gesture adds or removes days — decided by the
  // state of the day the gesture started on (touch); mouse always paints.
  const paintModeRef = useRef<'add' | 'remove'>('add')

  const input = useGridPointerInput({
    onDragStart: (date, pointerType) => {
      if (pointerType === 'touch' || pointerType === 'pen') {
        paintModeRef.current = selected.has(date) ? 'remove' : 'add'
        onDaySelect(date, paintModeRef.current)
      } else {
        // Mouse press = the plain click semantic (the trailing click is
        // swallowed by the engine); a following drag then paints additively.
        paintModeRef.current = 'add'
        onDaySelect(date, 'single')
      }
    },
    onDragOver: date => onDaySelect(date, paintModeRef.current),
    onTap: (date, info) => {
      if (info.pointerType === 'touch' || info.pointerType === 'pen') {
        onDaySelect(date, 'toggle')
        return
      }
      onDaySelect(date, info.shiftKey ? 'range' : info.ctrlKey || info.metaKey ? 'toggle' : 'single')
    },
  })

  // Weekday-header drag (mouse): press selects the column, sweeping across
  // headers adds columns. On touch the synthetic mousedown from a tap selects
  // the column — good enough (columns are also paintable via long-press).
  const [headerDragging, setHeaderDragging] = useState(false)
  useEffect(() => {
    if (!headerDragging) return
    const stop = () => setHeaderDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [headerDragging])

  // Weekday-aligned calendar: blanks pad the first row so the 1st lands under
  // its weekday (Mon-first). A real month reads in ~6 rows — no endless scroll.
  const firstDow = (() => {
    const d = new Date(`${visibleDates[0]}T00:00:00.000Z`).getUTCDay()
    return d === 0 ? 6 : d - 1
  })()

  return (
    <div
      {...input.containerProps}
      role="grid"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          onClearSelected()
        }
      }}
      className="touch-pan-y select-none rounded-lg focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action/40"
    >
      <div className="mb-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAY_IDS.map((id, i) => {
          const w = weekdayLabel(id)
          // WEEKDAY_IDS is Mon-first; map to JS getUTCDay (Sun=0…Sat=6).
          const weekday = i === 6 ? 0 : i + 1
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              title={t('headerSelectColumn', { day: w })}
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
          const entryCategoryLabel = entry
            ? categoryLabel(entry.category)
            : undefined

          return (
            <Button
              key={date}
              type="button"
              variant="ghost"
              {...input.getCellProps(date)}
              onDoubleClick={() => onEditDay?.(date)}
              onContextMenu={e => {
                if (!onDayContextMenu) return
                e.preventDefault()
                // A touch long-press is a paint gesture here, not a context
                // menu (the bulk bar carries the same actions on touch).
                if (input.dragActiveRef.current || input.lastPointerTypeRef.current === 'touch') return
                // Right-clicking a day outside the current selection selects just
                // it; right-clicking inside the selection keeps the whole batch.
                if (!selected.has(date)) onDaySelect(date, 'single')
                onDayContextMenu(date, { x: e.clientX, y: e.clientY })
              }}
              title={entryCategoryLabel}
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
                  {entryCategoryLabel}
                </span>
              ) : (
                <span
                  className={cn(
                    'font-mono text-sm tabular-nums leading-tight sm:text-base',
                    entry ? 'text-text-primary' : 'text-text-tertiary',
                  )}
                >
                  {entry ? duration(entry.duration_minutes) : '·'}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
