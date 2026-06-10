'use client'

import { Sparkles } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { Textarea } from '@/components/ui/textarea'
import { formatTimecardDuration } from '@/config/timecards'
import { NoScheduleNotice } from './NoScheduleNotice'
import { TimecardDayEditor } from './TimecardDayEditor'
import { TimecardHeader } from './TimecardHeader'
import { TimecardMonthGrid } from './TimecardMonthGrid'
import { TimecardStats } from './TimecardStats'
import { useTimecardDraft } from './useTimecardDraft'
import type { TimecardAIResult } from './types'

/**
 * Monthly timecard editor.
 *
 * Most of the brain lives in useTimecardDraft (state + every mutation +
 * the save/submit network calls). This component is now just composition:
 * read the hook, pass the bits each presentational subcomponent needs,
 * keep the AI-assist + notes inline (they're tiny and only used here).
 *
 * Prior version was a 593-line god component. The hook + subcomponent
 * split is the audit fix called out in the admin code-quality review.
 */
export function TimecardsClient({
  workingHours,
  userName,
}: {
  workingHours: string | null
  userName: string
}) {
  const tc = useTimecardDraft({ workingHours })

  const currentData = {
    period_label: tc.monthLabel,
    schedule: tc.scheduleSummary,
    summary: `${userName}: ${formatTimecardDuration(tc.totalMinutes)} in diesem Monat. ${tc.periodEntries.length} Einträge.`,
    entries: tc.periodEntries,
    notes: tc.draft.notes,
  }

  return (
    <div className="space-y-5">
      <TimecardHeader
        monthLabel={tc.monthLabel}
        hasSchedule={tc.hasSchedule}
        hasEntries={tc.periodEntries.length > 0}
        isSaving={tc.isSaving}
        isSubmitting={tc.isSubmitting}
        isLoadingDraft={tc.isLoadingDraft}
        errorMessage={tc.errorMessage}
        syncMessage={tc.syncMessage}
        onSubmit={tc.submitDraft}
        onReset={tc.rebuildCurrentDraft}
        onSave={tc.saveDraft}
      />

      <TimecardStats
        totalMinutes={tc.totalMinutes}
        entryCount={tc.periodEntries.length}
        status={tc.draft.status}
        scheduleSummary={tc.scheduleSummary}
        hasSchedule={tc.hasSchedule}
      />

      <NoScheduleNotice hasSchedule={tc.hasSchedule} />

      <AIFormAssist<TimecardAIResult>
        formType="timecard"
        variant="section"
        defaultExpanded={false}
        currentData={currentData}
        placeholder="z.B. 12. und 13. frei, sonst normal"
        onFieldsFilled={tc.handleAIFieldsFilled}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TimecardMonthGrid
          monthLabel={tc.monthLabel}
          visibleDates={tc.visibleDates}
          entries={tc.periodEntries}
          selectedDate={tc.draft.selectedDate}
          onSelect={tc.setSelectedDate}
        />

        <TimecardDayEditor
          selectedDate={tc.draft.selectedDate}
          selectedEntry={tc.selectedEntry}
          onPatch={tc.updateSelectedEntry}
          onMarkOff={tc.markSelectedDateOff}
          onRestoreFromSchedule={tc.restoreSelectedDateFromSchedule}
        />
      </section>

      <label className="block rounded-lg border bg-surface-base p-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Sparkles className="h-4 w-4 text-action" />
          Wochen- oder Monatskommentar
        </span>
        <Textarea
          variant="elevated"
          rows={2}
          value={tc.draft.notes}
          onChange={e => tc.setNotes(e.target.value)}
          placeholder="Optional, z.B. Ferien, Krankheit, Sondereinsatz oder Korrekturgrund"
          className="mt-2 resize-none"
        />
      </label>
    </div>
  )
}
