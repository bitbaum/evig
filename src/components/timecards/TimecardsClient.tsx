'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, ChevronRight, ChevronLeft, CalendarDays, CalendarRange } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatTimecardDuration } from '@/config/timecards'
import { getDisplayDate } from '@/lib/team/timecard-utils'
import { NoScheduleNotice } from './NoScheduleNotice'
import { TimecardDayEditor } from './TimecardDayEditor'
import { TimecardHeader } from './TimecardHeader'
import { TimecardMonthGrid } from './TimecardMonthGrid'
import { TimecardBulkBar } from './TimecardBulkBar'
import { ShiftWidget } from '@/components/timecards/ShiftWidget'
import { useTimecardDraft } from './useTimecardDraft'
import type { TimecardAIResult } from './types'

/**
 * Timecard editor (shared by /dashboard/timecards + /admin/timecards).
 *
 * Calendar-first, predictive UX:
 *   - One-tap "Monat aus Plan füllen" for the 95% case.
 *   - Multi-select days → contextual bulk bar (fill / Krank / Ferien /
 *     Feiertag / leeren) for batches like "I was on holiday these days".
 *   - Month ⇄ Tag view toggle: the day view is for fine edits ("left
 *     early on Tuesday") without hunting in a 31-tile grid.
 *   - Notes + AI assist tucked behind a disclosure.
 *
 * All state + handlers live in useTimecardDraft.
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
  const [view, setView] = useState<'month' | 'day'>('month')
  const t = useTranslations('admin.timecards')

  const currentData = {
    period_label: tc.monthLabel,
    schedule: tc.scheduleSummary,
    summary: `${userName}: ${formatTimecardDuration(tc.totalMinutes)} in diesem Monat. ${tc.periodEntries.length} Einträge.`,
    entries: tc.periodEntries,
    notes: tc.draft.notes,
  }

  // Day-view navigation within the visible month.
  const dayIndex = tc.visibleDates.indexOf(tc.draft.selectedDate)
  const gotoDay = (delta: number) => {
    const next = tc.visibleDates[dayIndex + delta]
    if (next) tc.setSelectedDate(next)
  }

  // In month view a click both focuses the day (for the editor) and toggles
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

      {/* Clock-in lives here — an optional, integral part of the tool. A
          finished shift is written straight into this month's draft. */}
      <ShiftWidget onClockOut={tc.addShiftEntry} />

      {/* View toggle + (month) selection hint */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === 'month' ? (
          <p className="text-sm text-text-tertiary">{t('selectHint')}</p>
        ) : (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => gotoDay(-1)} disabled={dayIndex <= 0} aria-label={t('dayPrev')}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="min-w-[11rem] text-center text-sm font-medium text-text-primary">
              {getDisplayDate(tc.draft.selectedDate)}
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={() => gotoDay(1)} disabled={dayIndex < 0 || dayIndex >= tc.visibleDates.length - 1} aria-label={t('dayNext')}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="inline-flex rounded-lg border border-subtle p-0.5">
          <ViewTab active={view === 'month'} onClick={() => setView('month')} icon={<CalendarRange className="h-3.5 w-3.5" />}>
            {t('viewMonth')}
          </ViewTab>
          <ViewTab active={view === 'day'} onClick={() => setView('day')} icon={<CalendarDays className="h-3.5 w-3.5" />}>
            {t('viewDay')}
          </ViewTab>
        </div>
      </div>

      {view === 'month' ? (
        <>
          <TimecardMonthGrid
            visibleDates={tc.visibleDates}
            entries={tc.periodEntries}
            focusedDate={tc.draft.selectedDate}
            selectedDates={tc.selectedDates}
            onDaySelect={tc.handleDaySelect}
            onClearSelected={tc.clearSelectedEntries}
          />

          <TimecardBulkBar
            count={tc.selectedDates.length}
            onFillFromSchedule={tc.bulkFillFromSchedule}
            onSetAbsence={tc.bulkSetAbsence}
            onClearDays={tc.bulkClear}
            onCancel={tc.clearSelection}
          />

          {tc.selectedDates.length > 1 && (
            <Button type="button" variant="ghost" onClick={tc.selectAllWeekdays} className="h-auto px-0 text-sm text-text-tertiary hover:text-text-secondary">
              {t('selectAllWeekdays')}
            </Button>
          )}
        </>
      ) : (
        <TimecardDayEditor
          selectedDate={tc.draft.selectedDate}
          selectedEntry={tc.selectedEntry}
          hasSchedule={tc.hasSchedule}
          onPatch={tc.updateSelectedEntry}
          onMarkOff={tc.markSelectedDateOff}
          onRestoreFromSchedule={tc.restoreSelectedDateFromSchedule}
          onApplyDefault9To17={tc.applyDefault9To17}
        />
      )}

      {/* Extras: notes + AI assist + reset, behind a disclosure. */}
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

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'gap-1.5 rounded-md px-3 text-sm',
        active ? 'bg-surface-raised text-text-primary' : 'text-text-tertiary hover:text-text-secondary',
      )}
    >
      {icon}
      {children}
    </Button>
  )
}
