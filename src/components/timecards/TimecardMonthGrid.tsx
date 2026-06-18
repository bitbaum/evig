'use client'

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
 * Clicking a day TOGGLES it in the multi-selection (and focuses it for the
 * day editor below). Selected days get an action-tinted border + check; the
 * focused day gets a ring. Absence days (Krank/Ferien/Feiertag) show the
 * absence label instead of a duration so they read at a glance; gaps render
 * "—" so the eye finds empty days immediately.
 */
export function TimecardMonthGrid({
  visibleDates,
  entries,
  focusedDate,
  selectedDates,
  onDayClick,
}: {
  visibleDates: string[]
  entries: TimecardEntryInput[]
  focusedDate: string
  selectedDates: string[]
  onDayClick: (date: string) => void
}) {
  const selected = new Set(selectedDates)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
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
            onClick={() => onDayClick(date)}
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
