'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  formatTimecardDuration,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { getDisplayDate } from '@/lib/team/timecard-utils'

/**
 * The right-side detail editor for the selected day: quick "off/sick"
 * actions, time range, break, category, free-text note, and the
 * "restore from schedule" button. Pure form — all changes flow through
 * the parent's handlers.
 */
export function TimecardDayEditor({
  selectedDate,
  selectedEntry,
  onPatch,
  onMarkOff,
  onRestoreFromSchedule,
}: {
  selectedDate: string
  selectedEntry: TimecardEntryInput | undefined
  onPatch: (patch: Partial<TimecardEntryInput>) => void
  onMarkOff: (reason: string) => void
  onRestoreFromSchedule: () => void
}) {
  return (
    <aside className="rounded-lg border bg-surface-base p-4">
      <h2 className="text-lg font-semibold text-text-primary">Ausnahme</h2>
      <p className="mt-1 text-sm text-text-tertiary">{getDisplayDate(selectedDate)}</p>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onMarkOff('frei')}
            className="rounded-lg border border-default px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            Frei
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onMarkOff('krank')}
            className="rounded-lg border border-default px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            Krank
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-medium text-text-secondary">
            Start
            <Input
              variant="elevated"
              type="time"
              value={selectedEntry?.start_time ?? '09:00'}
              onChange={e => onPatch({ start_time: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-text-secondary">
            Ende
            <Input
              variant="elevated"
              type="time"
              value={selectedEntry?.end_time ?? '17:00'}
              onChange={e => onPatch({ end_time: e.target.value })}
              className="mt-1"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-text-secondary">
          Pause in Minuten
          <Input
            variant="elevated"
            type="number"
            min={0}
            max={240}
            step={15}
            value={selectedEntry?.break_minutes ?? 0}
            onChange={e => onPatch({ break_minutes: Number(e.target.value) })}
            className="mt-1"
          />
        </label>

        <div className="rounded-lg bg-surface-raised px-3 py-2 text-sm text-text-secondary">
          Berechnete Dauer:{' '}
          <span className="font-semibold text-text-primary">
            {formatTimecardDuration(selectedEntry?.duration_minutes ?? 0)}
          </span>
        </div>

        <label className="block text-sm font-medium text-text-secondary">
          Kategorie
          <Select
            variant="elevated"
            value={selectedEntry?.category ?? 'other'}
            onChange={e => onPatch({ category: e.target.value as TimecardEntryCategory })}
            className="mt-1"
          >
            {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
              <option key={category} value={category}>
                {TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory]}
              </option>
            ))}
          </Select>
        </label>

        <label className="block text-sm font-medium text-text-secondary">
          Notiz
          <Textarea
            variant="elevated"
            rows={3}
            value={selectedEntry?.description ?? ''}
            onChange={e => onPatch({ description: e.target.value })}
            placeholder="Nur wenn dieser Tag anders war"
            className="mt-1 resize-none"
          />
        </label>

        <Button
          type="button"
          variant="outline"
          onClick={onRestoreFromSchedule}
          className="w-full rounded-lg border border-default px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
        >
          Tag aus Vorlage wiederherstellen
        </Button>
      </div>
    </aside>
  )
}
