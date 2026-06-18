'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TIMECARD_ABSENCE_TYPES, type TimecardEntryCategory } from '@/config/timecards'

/**
 * TimecardActions — the SSOT action set for applying to a timecard scope:
 * "fill from plan", any structured absence (config-driven from
 * TIMECARD_ABSENCE_TYPES), and clear. Used by BOTH the month bulk bar (apply
 * to selected days) and the day view (apply to the focused day), so the two
 * surfaces stay identical — same buttons, same wording, same data.
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="primary" size="sm" onClick={onFill}>
        {fillLabel ?? t('bulkFill')}
      </Button>
      {TIMECARD_ABSENCE_TYPES.map(absence => (
        <Button
          key={absence.value}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSetAbsence(absence.value)}
          title={absence.paid ? 'Bezahlte Abwesenheit (zählt geplante Stunden)' : 'Unbezahlt (0 Std.)'}
        >
          {absence.label}
        </Button>
      ))}
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
