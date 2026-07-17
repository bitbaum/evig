'use client'

import { CalendarCheck, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TIMECARD_ABSENCE_TYPES, type TimecardEntryCategory } from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'

/**
 * TimecardActions — the SSOT action set for applying to a timecard scope. Three
 * DISTINCT jobs, kept visually distinct so they don't read as one button-wall:
 *   1. Fill from plan (the primary intent) — solid button.
 *   2. Mark absent — the config-driven TIMECARD_ABSENCE_TYPES, wrapped in a
 *      labelled group ("Abwesend: …") so the six read as ONE set, not six
 *      unrelated buttons.
 *   3. Clear — the destructive escape hatch, pushed to the end.
 * Used by BOTH the month bulk bar (selected days) and the day view (focused
 * day), so the two surfaces stay identical.
 */
export function TimecardActions({
  onFill,
  onSetAbsence,
  onClear,
  fillLabel,
}: {
  onFill: () => void
  onSetAbsence: (category: TimecardEntryCategory) => void
  onClear: () => void
  /** Override the fill button label per scope (e.g. "Tag aus Plan füllen"). */
  fillLabel?: string
}) {
  const t = useTranslations('admin.timecards')
  const { categoryLabel } = useTimecardIntl()

  return (
    // gap-x-4 between the three groups, gap-1.5 within the absence set — the
    // wider inter-group gap is what makes the grouping legible.
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* 1 — Fill from plan */}
      <Button type="button" variant="primary" size="sm" onClick={onFill} className="gap-1.5">
        <CalendarCheck className="h-4 w-4" aria-hidden="true" />
        {fillLabel ?? t('bulkFill')}
      </Button>

      {/* 2 — Mark absent (labelled group) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          {t('bulkAbsenceLabel')}
        </span>
        {TIMECARD_ABSENCE_TYPES.map(absence => (
          <Button
            key={absence.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetAbsence(absence.value)}
            title={absence.paid ? t('absencePaidHint') : t('absenceUnpaidHint')}
          >
            {categoryLabel(absence.value)}
          </Button>
        ))}
      </div>

      {/* 3 — Clear (destructive) */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-text-tertiary hover:text-error-600"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('bulkClear')}
      </Button>
    </div>
  )
}
