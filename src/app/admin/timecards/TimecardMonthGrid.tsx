'use client'

import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  formatTimecardDuration,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { getEntryForDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'

/**
 * Month grid for /admin/timecards.
 *
 * Design: one button per day, 7 columns ≥sm. Each tile renders only the
 * minimum needed signal — weekday letter, day number, duration. Category
 * appears as a thin underline ("admin", "workshop", etc.) on hover via
 * title attribute; the previous version put the full category label on
 * every tile which produced a wall of repetitive "Administration"
 * strings. The active day gets an outlined ring; days with no entry
 * render muted ("—") so the eye finds gaps immediately.
 */
export function TimecardMonthGrid({
  visibleDates,
  entries,
  selectedDate,
  onSelect,
}: {
  visibleDates: string[]
  entries: TimecardEntryInput[]
  selectedDate: string
  onSelect: (date: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
      {visibleDates.map(date => {
        const entry = getEntryForDate(entries, date)
        const active = selectedDate === date
        const d = new Date(`${date}T00:00:00.000Z`)
        const weekdayLabel = new Intl.DateTimeFormat('de-CH', { weekday: 'short' }).format(d)
        const dayNum = d.getUTCDate()
        const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
        const categoryLabel = entry
          ? TIMECARD_ENTRY_CATEGORY_LABELS[entry.category as TimecardEntryCategory]
          : undefined

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            title={categoryLabel}
            className={cn(
              'group flex flex-col gap-1 rounded-lg border bg-surface-base px-3 py-2.5 text-left transition-colors',
              active
                ? 'border-action ring-2 ring-action/15'
                : 'border-subtle hover:border-strong',
              !entry && !active && 'bg-canvas',
            )}
          >
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
            <span
              className={cn(
                'font-mono text-lg tabular-nums leading-tight',
                entry ? 'text-text-primary' : 'text-text-tertiary',
              )}
            >
              {entry ? formatTimecardDuration(entry.duration_minutes) : '—'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
