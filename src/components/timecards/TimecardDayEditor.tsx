'use client'

import { useTranslations } from 'next-intl'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  formatTimecardDuration,
  isAbsenceCategory,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { cn } from '@/lib/utils'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HourRangePicker } from './HourRangePicker'
import { TimecardActions } from './TimecardActions'

/**
 * Day view — fine edits for ONE day. Mirrors the month surface: same open
 * framing (no card chrome — an open surface like the month grid) and the SAME
 * action set (TimecardActions: fill from plan / structured absences / clear)
 * at the top, scoped to this day. Below it, the HourRangePicker (the day-level
 * counterpart to the calendar grid — same useCellSelection model) is the star
 * for work days; absence days show their label. Category + note round it out.
 *
 * The date itself lives in the view's nav bar, so it is NOT repeated here.
 */
export function TimecardDayEditor({
  selectedDate,
  selectedEntry,
  onPatch,
  onFillDay,
  onSetAbsence,
  onClearDay,
}: {
  selectedDate: string
  selectedEntry: TimecardEntryInput | undefined
  onPatch: (patch: Partial<TimecardEntryInput>) => void
  onFillDay: () => void
  onSetAbsence: (category: TimecardEntryCategory) => void
  onClearDay: () => void
}) {
  const t = useTranslations('admin.timecards')
  const hasEntry = !!selectedEntry
  const isAbsence = hasEntry && isAbsenceCategory(selectedEntry.category)

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {hasEntry
            ? isAbsence
              ? TIMECARD_ENTRY_CATEGORY_LABELS[selectedEntry.category as TimecardEntryCategory]
              : t('dayEditorHasEntry')
            : t('dayEditorNoEntry')}
        </p>
        {hasEntry && (
          <p className="font-mono text-xl tabular-nums text-text-primary">
            {formatTimecardDuration(selectedEntry.duration_minutes)}
          </p>
        )}
      </div>

      {/* Same actions as the month bulk bar, scoped to this day. */}
      <TimecardActions
        fillLabel={t('dayFill')}
        onFill={onFillDay}
        onSetAbsence={onSetAbsence}
        onClear={onClearDay}
      />

      {isAbsence ? (
        <p className="border-t border-subtle pt-5 text-sm text-text-secondary">
          {TIMECARD_ENTRY_CATEGORY_LABELS[selectedEntry.category as TimecardEntryCategory]} —{' '}
          {formatTimecardDuration(selectedEntry.duration_minutes)} {t('dayAbsenceCounted')}
        </p>
      ) : (
        <div className="space-y-4 border-t border-subtle pt-5">
          <HourRangePicker
            key={selectedDate}
            start={selectedEntry?.start_time ?? null}
            end={selectedEntry?.end_time ?? null}
            durationMinutes={selectedEntry?.duration_minutes ?? 0}
            onChange={(start, end, breakMinutes) =>
              onPatch({ start_time: start, end_time: end, break_minutes: breakMinutes })
            }
          />
          {hasEntry && <DetailFields entry={selectedEntry} onPatch={onPatch} />}
        </div>
      )}
    </section>
  )
}

function DetailFields({
  entry,
  onPatch,
}: {
  entry: TimecardEntryInput
  onPatch: (patch: Partial<TimecardEntryInput>) => void
}) {
  const t = useTranslations('admin.timecards')
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('fieldCategory')}>
        <Select
          value={entry.category ?? 'other'}
          onChange={e => onPatch({ category: e.target.value as TimecardEntryCategory })}
        >
          {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
            <option key={category} value={category}>
              {TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('fieldNote')}>
        <Textarea
          rows={2}
          value={entry.description ?? ''}
          onChange={e => onPatch({ description: e.target.value })}
          placeholder={t('fieldNotePlaceholder')}
          className="resize-none"
        />
      </Field>
    </div>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('block text-xs font-medium uppercase tracking-wide text-text-tertiary', className)}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}
