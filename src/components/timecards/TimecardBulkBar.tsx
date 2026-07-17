'use client'

import { CalendarCheck, Pencil, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { TimecardEntryCategory } from '@/config/timecards'
import { TimecardActions } from './TimecardActions'

/**
 * Contextual action bar for the month grid — appears only when one or more
 * days are selected, so the affordance is discovered by selecting. Wraps the
 * shared TimecardActions (fill / absence / clear) with the selection count and
 * a cancel control. The same TimecardActions render in the day view, keeping
 * the two surfaces identical. With exactly one day selected, `onEditDay` adds
 * a "Tag bearbeiten" jump into the day editor — the touch-friendly route to
 * fine edits (desktop also has double-click on the grid).
 */
export function TimecardBulkBar({
  count,
  onFillFromSchedule,
  onSetAbsence,
  onClearDays,
  onCancel,
  onEditDay,
}: {
  count: number
  onFillFromSchedule: () => void
  onSetAbsence: (category: TimecardEntryCategory) => void
  onClearDays: () => void
  onCancel: () => void
  /** Open the day editor for the single selected day (only passed when count === 1). */
  onEditDay?: () => void
}) {
  const t = useTranslations('admin.timecards')
  if (count === 0) return null

  return (
    // bottom offset keeps the bar clear of the page's sticky save/submit
    // footer (bottom-0; two rows ≈ 5.5rem on phones, one row ≈ 3.5rem from
    // sm) — the bar's tail actions used to disappear behind it on mobile.
    <div className="sticky bottom-[calc(6rem+var(--bottom-nav-clearance,0px))] z-10 space-y-2.5 rounded-xl border border-action/30 bg-surface-base p-3 shadow-sm sm:bottom-[calc(4rem+var(--bottom-nav-clearance,0px))]">
      {/* Header row: what's selected + the way out, always visible. */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
          <CalendarCheck className="h-4 w-4 text-action" aria-hidden="true" />
          {t('bulkSelected', { count })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-text-tertiary hover:text-text-secondary"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          {t('bulkCancel')}
        </Button>
      </div>

      {/* One day → the featured action is entering its hours. */}
      {onEditDay && (
        <Button type="button" variant="primary" size="sm" onClick={onEditDay} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          {t('editDay')}
        </Button>
      )}

      <TimecardActions onFill={onFillFromSchedule} onSetAbsence={onSetAbsence} onClear={onClearDays} />
    </div>
  )
}
