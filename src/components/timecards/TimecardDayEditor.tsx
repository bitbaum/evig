'use client'

import { useTranslations } from 'next-intl'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_MANUAL_DEFAULT,
  isAbsenceCategory,
  type TimecardEntryCategory,
} from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HourRangePicker } from './HourRangePicker'
import { TimecardActions } from './TimecardActions'

/**
 * Day view — fine edits for ONE day. Mirrors the month surface: same open
 * framing (no card chrome — an open surface like the month grid) and the SAME
 * action set (TimecardActions: fill from plan / structured absences / clear)
 * at the top, scoped to this day. Below it, the HourRangePicker (the day-level
 * counterpart to the calendar grid — same pointer-paint model) is the visual
 * way in for work days, with exact Von/Bis/Pause fields beside it as the
 * precise (and screen-reader-friendly) path — both edit the same entry and
 * stay in sync. Absence days show their label. Category + note round it out.
 *
 * On a day without plan hours the fill action is relabelled to the standard
 * manual day, so an unscheduled work day ("came in on Friday") is one tap.
 *
 * The date itself lives in the view's nav bar, so it is NOT repeated here.
 */
export function TimecardDayEditor({
  selectedDate,
  selectedEntry,
  dayHasPlan,
  onPatch,
  onFillDay,
  onSetAbsence,
  onClearDay,
}: {
  selectedDate: string
  selectedEntry: TimecardEntryInput | undefined
  /** Whether this date's weekday has plan hours (drives the fill label). */
  dayHasPlan: boolean
  onPatch: (patch: Partial<TimecardEntryInput>) => void
  onFillDay: () => void
  onSetAbsence: (category: TimecardEntryCategory) => void
  onClearDay: () => void
}) {
  const t = useTranslations('admin.timecards')
  const { categoryLabel, duration } = useTimecardIntl()
  const hasEntry = !!selectedEntry
  const isAbsence = hasEntry && isAbsenceCategory(selectedEntry.category)

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {hasEntry
            ? isAbsence
              ? categoryLabel(selectedEntry.category)
              : t('dayEditorHasEntry')
            : t('dayEditorNoEntry')}
        </p>
        {hasEntry && (
          <p className="font-mono text-xl tabular-nums text-text-primary">
            {duration(selectedEntry.duration_minutes)}
          </p>
        )}
      </div>

      {/* Same actions as the month bulk bar, scoped to this day. */}
      <TimecardActions
        fillLabel={
          dayHasPlan
            ? t('dayFill')
            : t('dayFillDefault', {
                start: TIMECARD_MANUAL_DEFAULT.start,
                end: TIMECARD_MANUAL_DEFAULT.end,
              })
        }
        onFill={onFillDay}
        onSetAbsence={onSetAbsence}
        onClear={onClearDay}
      />

      {isAbsence ? (
        <p className="border-t border-subtle pt-5 text-sm text-text-secondary">
          {categoryLabel(selectedEntry.category)} —{' '}
          {duration(selectedEntry.duration_minutes)} {t('dayAbsenceCounted')}
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
          <TimeFields entry={selectedEntry} onPatch={onPatch} />
          {hasEntry && <DetailFields entry={selectedEntry} onPatch={onPatch} />}
        </div>
      )}
    </section>
  )
}

/**
 * Exact time entry (Von / Bis / Pause) — the precise counterpart to the hour
 * grid. Works on any device and for any times (also off the 30-min raster);
 * editing an empty day creates the entry, exactly like painting the grid.
 */
function TimeFields({
  entry,
  onPatch,
}: {
  entry: TimecardEntryInput | undefined
  onPatch: (patch: Partial<TimecardEntryInput>) => void
}) {
  const t = useTranslations('admin.timecards')
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Field label={t('fieldStart')}>
        <Input
          type="time"
          value={entry?.start_time ?? ''}
          onChange={e => onPatch({ start_time: e.target.value || null })}
        />
      </Field>
      <Field label={t('fieldEnd')}>
        <Input
          type="time"
          value={entry?.end_time ?? ''}
          onChange={e => onPatch({ end_time: e.target.value || null })}
        />
      </Field>
      <Field label={t('fieldBreak')} className="col-span-2 sm:col-span-1">
        <Input
          type="number"
          min={0}
          step={5}
          inputMode="numeric"
          value={entry?.break_minutes ?? 0}
          onChange={e => {
            const parsed = Number.parseInt(e.target.value, 10)
            onPatch({ break_minutes: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) })
          }}
        />
      </Field>
    </div>
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
  const { categoryLabel } = useTimecardIntl()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t('fieldCategory')}>
        <Select
          value={entry.category ?? 'other'}
          onChange={e => onPatch({ category: e.target.value as TimecardEntryCategory })}
        >
          {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
            <option key={category} value={category}>
              {categoryLabel(category)}
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
