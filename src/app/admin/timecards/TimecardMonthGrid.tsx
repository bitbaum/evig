'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  formatTimecardDuration,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { getEntryForDate } from '@/lib/team/timecard-utils'

/**
 * The month's day grid. Each tile is a button — selecting it makes that
 * day editable in the day-detail aside. Pure render; selection state is
 * a controlled prop.
 */
export function TimecardMonthGrid({
  monthLabel,
  visibleDates,
  entries,
  selectedDate,
  onSelect,
}: {
  monthLabel: string
  visibleDates: string[]
  entries: TimecardEntryInput[]
  selectedDate: string
  onSelect: (date: string) => void
}) {
  return (
    <div className="rounded-lg border bg-surface-base p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{monthLabel}</h2>
          <p className="mt-1 text-sm text-text-tertiary">
            Normale Tage bleiben unverändert. Wähle nur einen Tag aus, wenn etwas anders war.
          </p>
        </div>
        <div className="text-sm text-text-tertiary">Monatsübersicht</div>
      </div>

      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
        {visibleDates.map(date => {
          const entry = getEntryForDate(entries, date)
          const active = selectedDate === date
          const weekdayLabel = new Intl.DateTimeFormat('de-CH', { weekday: 'short' }).format(
            new Date(`${date}T00:00:00.000Z`),
          )
          return (
            <Button
              key={date}
              type="button"
              variant="outline"
              onClick={() => onSelect(date)}
              className={`min-h-28 rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-action bg-action-muted ring-2 ring-action/20'
                  : 'border bg-surface-raised hover:border-strong hover:bg-surface-base'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{weekdayLabel}</p>
                {entry && <Check className="h-4 w-4 text-success-600" />}
              </div>
              <p className="mt-1 text-xs text-text-tertiary">{date.slice(5)}</p>
              <p className="mt-4 text-lg font-semibold text-text-primary">
                {formatTimecardDuration(entry?.duration_minutes ?? 0)}
              </p>
              <p className="mt-1 truncate text-xs text-text-tertiary">
                {entry
                  ? TIMECARD_ENTRY_CATEGORY_LABELS[entry.category as TimecardEntryCategory]
                  : 'Vorgefüllt aus Schedule'}
              </p>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
