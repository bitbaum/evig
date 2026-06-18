'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, ChevronRight } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { formatTimecardDuration } from '@/config/timecards'
import { NoScheduleNotice } from './NoScheduleNotice'
import { TimecardDayEditor } from './TimecardDayEditor'
import { TimecardHeader } from './TimecardHeader'
import { TimecardMonthGrid } from './TimecardMonthGrid'
import { useTimecardDraft } from './useTimecardDraft'
import type { TimecardAIResult } from './types'

/**
 * /admin/timecards — monthly timecard view.
 *
 * x.ai-inspired layout: minimal chrome, single primary action,
 * calendar-first. Day details appear inline below the grid when a
 * day is tapped. Notes + AI assist live behind a collapsed disclosure
 * so they do not consume visual weight on the common path
 * ("everything was normal, submit").
 *
 * State + handlers all live in useTimecardDraft.
 */
export function TimecardsClient({
  workingHours,
  userName,
}: {
  workingHours: string | null
  userName: string
}) {
  const tc = useTimecardDraft({ workingHours })
  const [extrasOpen, setExtrasOpen] = useState(false)
  const t = useTranslations('admin.timecards')

  const currentData = {
    period_label: tc.monthLabel,
    schedule: tc.scheduleSummary,
    summary: `${userName}: ${formatTimecardDuration(tc.totalMinutes)} in diesem Monat. ${tc.periodEntries.length} Einträge.`,
    entries: tc.periodEntries,
    notes: tc.draft.notes,
  }

  return (
    <article className="space-y-8 pb-12">
      <TimecardHeader
        monthLabel={tc.monthLabel}
        scheduleSummary={tc.scheduleSummary}
        totalMinutes={tc.totalMinutes}
        entryCount={tc.periodEntries.length}
        status={tc.draft.status}
        hasEntries={tc.periodEntries.length > 0}
        isSaving={tc.isSaving}
        isSubmitting={tc.isSubmitting}
        isLoadingDraft={tc.isLoadingDraft}
        errorMessage={tc.errorMessage}
        syncMessage={tc.syncMessage}
        onFillMonth={tc.fillMonthFromSchedule}
        onSubmit={tc.submitDraft}
        onSave={tc.saveDraft}
      />

      {!tc.hasSchedule && <NoScheduleNotice hasSchedule={tc.hasSchedule} />}

      <TimecardMonthGrid
        visibleDates={tc.visibleDates}
        entries={tc.periodEntries}
        selectedDate={tc.draft.selectedDate}
        onSelect={tc.setSelectedDate}
      />

      <TimecardDayEditor
        selectedDate={tc.draft.selectedDate}
        selectedEntry={tc.selectedEntry}
        hasSchedule={tc.hasSchedule}
        onPatch={tc.updateSelectedEntry}
        onMarkOff={tc.markSelectedDateOff}
        onRestoreFromSchedule={tc.restoreSelectedDateFromSchedule}
        onApplyDefault9To17={tc.applyDefault9To17}
      />

      {/* Extras: notes + AI assist + reset.
          Tucked behind a single disclosure so they don't compete with
          the main calendar flow. ~95% of timecards do not need them. */}
      <section className="border-t border-subtle pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setExtrasOpen(o => !o)}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary hover:text-text-secondary h-auto px-0"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${extrasOpen ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          {t('extrasToggle')}
        </Button>

        {extrasOpen && (
          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
                {t('extrasMonthComment')}
              </span>
              <Textarea
                variant="elevated"
                rows={2}
                value={tc.draft.notes}
                onChange={e => tc.setNotes(e.target.value)}
                placeholder={t('extrasMonthCommentPlaceholder')}
                className="mt-1 resize-none"
              />
            </label>

            <div className="rounded-lg border border-subtle bg-surface-base p-4">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
                <Sparkles className="h-3.5 w-3.5 text-action" aria-hidden="true" />
                {t('extrasAiAssist')}
              </p>
              <div className="mt-3">
                <AIFormAssist<TimecardAIResult>
                  formType="timecard"
                  variant="section"
                  defaultExpanded
                  currentData={currentData}
                  placeholder={t('extrasAiPlaceholder')}
                  onFieldsFilled={tc.handleAIFieldsFilled}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={tc.rebuildCurrentDraft}
              className="text-sm text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline h-auto px-0"
            >
              {t('extrasResetMonth')}
            </Button>
          </div>
        )}
      </section>
    </article>
  )
}
