'use client'

import { useTranslations } from 'next-intl'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import type { TimecardStatus } from '@/config/timecards'
import type { UseTimecardDraftResult } from '../useTimecardDraft'

/** Owns the month-view toolbar: "fill month from plan" / "fill and submit" actions plus the Schnellauswahl selection shortcuts. */
export function TimecardMonthToolbar({
  tc,
  serverStatus,
}: {
  tc: UseTimecardDraftResult
  serverStatus: TimecardStatus
}) {
  const t = useTranslations('admin.timecards')

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={tc.fillMonthFromSchedule}
          disabled={tc.isLoadingDraft || tc.isSubmitting}
          title={t('fillMonthHint')}
          className="gap-1.5"
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          {t('fillMonth')}
        </Button>
        {/* One-click normal month: fill from plan AND submit — shown only
            while the month is an empty draft (the reminder's deep link
            lands exactly here). */}
        {tc.periodEntries.length === 0 && serverStatus === 'draft' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={tc.submitFromPlan}
            disabled={tc.isLoadingDraft || tc.isSubmitting}
            className="gap-1.5"
          >
            {tc.isSubmitting ? t('submitting') : t('fillAndSubmit')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Eyebrow as="span">
          {t('selectLabel')}
        </Eyebrow>
        <Button type="button" variant="ghost" size="sm" onClick={tc.selectAll} className="h-auto px-2 py-1 text-sm text-text-secondary hover:text-text-primary">
          {t('selectAllDays')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={tc.selectAllWeekdays} className="h-auto px-2 py-1 text-sm text-text-secondary hover:text-text-primary">
          {t('selectAllWeekdays')}
        </Button>
      </div>
    </div>
  )
}
