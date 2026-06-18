'use client'

import { CalendarCheck, X, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { TIMECARD_ENTRY_CATEGORIES, TIMECARD_ENTRY_CATEGORY_LABELS } from '@/config/timecards'
import type { TimecardEntryCategory } from '@/config/timecards'

/**
 * Contextual action bar for the month grid — appears only when one or more
 * days are selected, so the affordance is discovered by selecting. One tap
 * applies an action to every selected day: fill from plan, mark an absence
 * (Krank/Ferien/Feiertag), or clear.
 */
export function TimecardBulkBar({
  count,
  onFillFromSchedule,
  onSetAbsence,
  onClearDays,
  onCancel,
}: {
  count: number
  onFillFromSchedule: () => void
  onSetAbsence: (category: TimecardEntryCategory) => void
  onClearDays: () => void
  onCancel: () => void
}) {
  const t = useTranslations('admin.timecards')
  if (count === 0) return null

  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-action/30 bg-surface-base p-3 shadow-sm">
      <span className="mr-1 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
        <CalendarCheck className="h-4 w-4 text-action" aria-hidden="true" />
        {t('bulkSelected', { count })}
      </span>

      <Button type="button" variant="primary" size="sm" onClick={onFillFromSchedule}>
        {t('bulkFill')}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onSetAbsence(TIMECARD_ENTRY_CATEGORIES.KRANK)}>
        {TIMECARD_ENTRY_CATEGORY_LABELS.krank}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onSetAbsence(TIMECARD_ENTRY_CATEGORIES.FERIEN)}>
        {TIMECARD_ENTRY_CATEGORY_LABELS.ferien}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => onSetAbsence(TIMECARD_ENTRY_CATEGORIES.FEIERTAG)}>
        {TIMECARD_ENTRY_CATEGORY_LABELS.feiertag}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearDays}
        className="text-text-tertiary hover:text-error-600"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t('bulkClear')}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="ml-auto text-text-tertiary hover:text-text-secondary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        {t('bulkCancel')}
      </Button>
    </div>
  )
}
