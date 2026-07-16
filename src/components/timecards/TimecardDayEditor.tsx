'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_MANUAL_DEFAULT,
  formatTimecardDuration,
  isAbsenceCategory,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { HourRangePicker } from './HourRangePicker'
import { TimecardActions } from './TimecardActions'

/**
 * Day view — fine edits for ONE day, ordered by what the user came to do:
 *
 *   1. Duration hero (how much is on this day right now)
 *   2. Von / Bis / Pause — THE direct way to enter the day's hours. First,
 *      always visible, big touch targets. On phones this used to sit below a
 *      full-screen hour grid, which read as "no way to enter hours".
 *   3. Quick actions (fill standard/plan day, absences, clear)
 *   4. Hour grid — the visual/multi-block alternative, collapsed on phones
 *      (it dwarfs everything else there), open on desktop where it fits
 *      beside the form (lg: two columns).
 *   5. Category + note (rarely touched)
 *
 * Absence days short-circuit to the label + counted hours + the same actions.
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
  const hasEntry = !!selectedEntry
  const isAbsence = hasEntry && isAbsenceCategory(selectedEntry.category)

  // Hour grid disclosure. null = no user choice yet → the DEFAULT comes from
  // CSS (hidden on phones, open from lg), so SSR/client render identically and
  // desktop needs no effect-driven flicker. The first toggle resolves null
  // against the actual viewport.
  const [gridOpen, setGridOpen] = useState<boolean | null>(null)
  const toggleGrid = () =>
    setGridOpen(prev =>
      prev === null ? !window.matchMedia('(min-width: 1024px)').matches : !prev,
    )

  const fillLabel = dayHasPlan
    ? t('dayFill')
    : t('dayFillDefault', {
        start: TIMECARD_MANUAL_DEFAULT.start,
        end: TIMECARD_MANUAL_DEFAULT.end,
      })

  return (
    <section className="space-y-5">
      {/* Duration hero: what this day currently counts. */}
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {hasEntry
            ? isAbsence
              ? TIMECARD_ENTRY_CATEGORY_LABELS[selectedEntry.category as TimecardEntryCategory]
              : t('dayEditorHasEntry')
            : t('dayEditorNoEntry')}
        </p>
        <p className="font-mono text-2xl tabular-nums text-text-primary sm:text-3xl">
          {formatTimecardDuration(selectedEntry?.duration_minutes ?? 0)}
        </p>
      </div>

      {isAbsence ? (
        <>
          <TimecardActions
            fillLabel={fillLabel}
            onFill={onFillDay}
            onSetAbsence={onSetAbsence}
            onClear={onClearDay}
          />
          <p className="border-t border-subtle pt-5 text-sm text-text-secondary">
            {TIMECARD_ENTRY_CATEGORY_LABELS[selectedEntry.category as TimecardEntryCategory]} —{' '}
            {formatTimecardDuration(selectedEntry.duration_minutes)} {t('dayAbsenceCounted')}
          </p>
        </>
      ) : (
        <div className="grid gap-x-8 gap-y-5 border-t border-subtle pt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-5">
            {/* 1 — Direct time entry, always visible. */}
            <TimeFields entry={selectedEntry} onPatch={onPatch} />

            {/* 2 — Quick actions for the whole day. */}
            <TimecardActions
              fillLabel={fillLabel}
              onFill={onFillDay}
              onSetAbsence={onSetAbsence}
              onClear={onClearDay}
            />

            {/* 3 — Rarely-touched details. */}
            {hasEntry && <DetailFields entry={selectedEntry} onPatch={onPatch} />}
          </div>

          {/* 4 — The visual grid: collapsed on phones, open on desktop. */}
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={toggleGrid}
              aria-expanded={gridOpen ?? undefined}
              className="inline-flex h-auto items-center gap-2 px-0 font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary hover:text-text-secondary"
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  gridOpen === null ? 'lg:rotate-90' : gridOpen && 'rotate-90',
                )}
                aria-hidden="true"
              />
              {gridOpen === null ? (
                <>
                  <span className="lg:hidden">{t('dayGridShow')}</span>
                  <span className="hidden lg:inline">{t('dayGridHide')}</span>
                </>
              ) : gridOpen ? (
                t('dayGridHide')
              ) : (
                t('dayGridShow')
              )}
            </Button>
            <div
              className={cn(
                'mt-3',
                gridOpen === null ? 'hidden lg:block' : gridOpen ? 'block' : 'hidden',
              )}
            >
              <HourRangePicker
                key={selectedDate}
                start={selectedEntry?.start_time ?? null}
                end={selectedEntry?.end_time ?? null}
                durationMinutes={selectedEntry?.duration_minutes ?? 0}
                onChange={(start, end, breakMinutes) =>
                  onPatch({ start_time: start, end_time: end, break_minutes: breakMinutes })
                }
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/**
 * Exact time entry (Von / Bis / Pause) — the primary input for a day's hours.
 * Works on any device and for any times (also off the 30-min raster);
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
          className="h-11 text-base tabular-nums"
        />
      </Field>
      <Field label={t('fieldEnd')}>
        <Input
          type="time"
          value={entry?.end_time ?? ''}
          onChange={e => onPatch({ end_time: e.target.value || null })}
          className="h-11 text-base tabular-nums"
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
          className="h-11 text-base tabular-nums"
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
