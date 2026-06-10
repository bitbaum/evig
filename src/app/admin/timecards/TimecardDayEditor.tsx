'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  formatTimecardDuration,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { cn } from '@/lib/utils'

/**
 * Inline day editor (replaces the right-aside detail panel).
 *
 * Default state is collapsed — just the date header, the day's hours,
 * and three quick actions (Frei / Krank / Anpassen). The full time
 * range + category + note fields only expand when the user taps
 * "Anpassen" — most days are normal and need zero edits.
 *
 * Empty-day affordance: if no entry exists for the selected date,
 * the quick actions include "Aus Schedule ausfüllen" (uses the user's
 * working_hours) and "9–17 ausfüllen" (a manual one-tap fallback if
 * no schedule is set). This is the path the user complained about:
 * "if a day is not filled and I click on it, there should be an
 * option to autofill it with my schedule or with 9-17."
 *
 * No card border around the whole component — let the parent control
 * spacing. The editor surfaces as a thin sticky panel underneath the
 * month grid.
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
  const [expanded, setExpanded] = useState(false)
  const hasEntry = !!selectedEntry

  return (
    <section className="rounded-lg border border-subtle bg-surface-base p-5">
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

      <div className="mt-4 flex flex-wrap gap-2">
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
        {hasEntry && (
          <ActionChip onClick={() => setExpanded(e => !e)}>
            {expanded ? t('dayActionAdjustClose') : t('dayActionAdjust')}
          </ActionChip>
        )}
      </div>

      {expanded && hasEntry && (
        <DetailFields entry={selectedEntry} onPatch={onPatch} />
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        primary
          ? 'border-action bg-action text-white hover:bg-action-strong'
          : 'border-subtle bg-surface-base text-text-secondary hover:border-strong hover:text-text-primary',
      )}
    >
      {children}
    </button>
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
    <div className="mt-5 grid gap-4 border-t border-subtle pt-5 sm:grid-cols-2">
      <Field label={t('fieldStart')}>
        <input
          type="time"
          value={entry.start_time ?? '09:00'}
          onChange={e => onPatch({ start_time: e.target.value })}
          className="w-full rounded-md border border-subtle bg-surface-base px-3 py-1.5 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        />
      </Field>
      <Field label={t('fieldEnd')}>
        <input
          type="time"
          value={entry.end_time ?? '17:00'}
          onChange={e => onPatch({ end_time: e.target.value })}
          className="w-full rounded-md border border-subtle bg-surface-base px-3 py-1.5 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        />
      </Field>
      <Field label={t('fieldBreak')}>
        <input
          type="number"
          min={0}
          max={240}
          step={15}
          value={entry.break_minutes ?? 0}
          onChange={e => onPatch({ break_minutes: Number(e.target.value) })}
          className="w-full rounded-md border border-subtle bg-surface-base px-3 py-1.5 text-sm tabular-nums focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        />
      </Field>
      <Field label={t('fieldCategory')}>
        <select
          value={entry.category ?? 'other'}
          onChange={e => onPatch({ category: e.target.value as TimecardEntryCategory })}
          className="w-full rounded-md border border-subtle bg-surface-base px-3 py-1.5 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
        >
          {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
            <option key={category} value={category}>
              {TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('fieldNote')} className="sm:col-span-2">
        <textarea
          rows={2}
          value={entry.description ?? ''}
          onChange={e => onPatch({ description: e.target.value })}
          placeholder={t('fieldNotePlaceholder')}
          className="w-full resize-none rounded-md border border-subtle bg-surface-base px-3 py-2 text-sm focus:border-action focus:outline-none focus:ring-1 focus:ring-action"
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
