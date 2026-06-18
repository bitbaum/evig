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
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HourRangePicker } from './HourRangePicker'

/**
 * Day view — fine edits for ONE day. The centrepiece is the HourRangePicker:
 * the day-view counterpart to the month grid, where you pick the worked block
 * by dragging across a timeline of hours (the "select hours like you select
 * days" the user asked for). Break / category / note sit below.
 *
 * Empty-day affordance: quick actions "Aus Schedule ausfüllen" (uses the
 * user's working_hours) and "9–17 ausfüllen" (manual fallback if no schedule).
 * Absence days (Krank/Ferien/…) show their label instead of the hour grid.
 */
export function TimecardDayEditor({
  selectedDate,
  selectedEntry,
  hasSchedule,
  onPatch,
  onMarkOff,
  onRestoreFromSchedule,
  onApplyDefault9To17,
}: {
  selectedDate: string
  selectedEntry: TimecardEntryInput | undefined
  hasSchedule: boolean
  onPatch: (patch: Partial<TimecardEntryInput>) => void
  onMarkOff: (reason: string) => void
  onRestoreFromSchedule: () => void
  onApplyDefault9To17: () => void
}) {
  const t = useTranslations('admin.timecards')
  const hasEntry = !!selectedEntry
  const isAbsence = hasEntry && isAbsenceCategory(selectedEntry.category)

  return (
    <section className="space-y-5 rounded-lg border border-subtle bg-surface-base p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {hasEntry ? t('dayEditorHasEntry') : t('dayEditorNoEntry')}
          </p>
          <h2 className="mt-1 text-lg font-medium text-text-primary">
            {getDisplayDate(selectedDate)}
          </h2>
        </div>
        {hasEntry && (
          <p className="font-mono text-xl tabular-nums text-text-primary">
            {formatTimecardDuration(selectedEntry.duration_minutes)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!hasEntry && hasSchedule && (
          <ActionChip onClick={onRestoreFromSchedule} primary>
            {t('dayActionFillFromSchedule')}
          </ActionChip>
        )}
        {!hasEntry && (
          <ActionChip onClick={onApplyDefault9To17} primary={!hasSchedule}>
            {t('dayActionFillDefault')}
          </ActionChip>
        )}
        <ActionChip onClick={() => onMarkOff('frei')}>{t('dayActionFree')}</ActionChip>
        <ActionChip onClick={() => onMarkOff('krank')}>{t('dayActionSick')}</ActionChip>
      </div>

      {isAbsence ? (
        <div className="border-t border-subtle pt-5 text-sm text-text-secondary">
          {TIMECARD_ENTRY_CATEGORY_LABELS[selectedEntry.category as TimecardEntryCategory]} —{' '}
          {formatTimecardDuration(selectedEntry.duration_minutes)} {t('dayAbsenceCounted')}
        </div>
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

function ActionChip({
  onClick,
  primary,
  children,
}: {
  onClick: () => void
  primary?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={primary ? 'primary' : 'outline'}
      onClick={onClick}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-sm font-medium h-auto',
        !primary && 'border-subtle bg-surface-base text-text-secondary hover:border-strong hover:text-text-primary',
      )}
    >
      {children}
    </Button>
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
