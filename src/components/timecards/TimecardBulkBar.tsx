'use client'

import { CalendarCheck, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { TimecardEntryCategory } from '@/config/timecards'
import { TimecardActions } from './TimecardActions'

/**
 * Contextual action bar for the month grid — appears only when one or more
 * days are selected, so the affordance is discovered by selecting. Wraps the
 * shared TimecardActions (fill / absence / clear) with the selection count and
 * a cancel control. The same TimecardActions render in the day view, keeping
 * the two surfaces identical.
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
    // bottom-16 keeps the bar clear of the page's sticky save/submit footer
    // (bottom-0, ~3.5rem tall) — at bottom-4 the two overlapped on mobile.
    <div className="sticky bottom-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-action/30 bg-surface-base p-3 shadow-sm">
      <span className="mr-1 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
        <CalendarCheck className="h-4 w-4 text-action" aria-hidden="true" />
        {t('bulkSelected', { count })}
      </span>

      <TimecardActions onFill={onFillFromSchedule} onSetAbsence={onSetAbsence} onClear={onClearDays} />

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
