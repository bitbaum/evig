'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import { ContextMenu, type ContextMenuItem, type ContextMenuPosition } from '@/components/ui/context-menu'
import { formatTimecardDuration, TIMECARD_ABSENCE_TYPES } from '@/config/timecards'
import { ROUTES } from '@/config/routes'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import { NoScheduleNotice } from './NoScheduleNotice'
import { TimecardDayEditor } from './TimecardDayEditor'
import { TimecardHeader } from './TimecardHeader'
import { TimecardMonthGrid } from './TimecardMonthGrid'
import { TimecardBulkBar } from './TimecardBulkBar'
import { TimeOffPanel } from './TimeOffPanel'
import { useTimecardDraft } from './useTimecardDraft'
import { TimecardViewBar } from './client/TimecardViewBar'
import { TimecardMonthToolbar } from './client/TimecardMonthToolbar'
import { TimecardEntryTools } from './client/TimecardEntryTools'
import { TimecardExtras } from './client/TimecardExtras'
import { TimecardActionBar } from './client/TimecardActionBar'

/**
 * Timecard editor (shared by /dashboard/timecards + /admin/zeiterfassung).
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
  canApprove = false,
}: {
  workingHours: string | null
  userName: string
  /** Approvers can reopen a card that was reviewed/approved by mistake. */
  canApprove?: boolean
}) {
  const tc = useTimecardDraft({ workingHours })
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [view, setView] = useState<'month' | 'day'>('month')
  const [menuPos, setMenuPos] = useState<ContextMenuPosition | null>(null)
  const [menuCount, setMenuCount] = useState(1)
  const t = useTranslations('admin.timecards')
  const { categoryLabel } = useTimecardIntl()

  // Lock/label decisions come from the SERVER status + a content diff, not
  // from the local draft status (which flips on every keystroke): editing a
  // submitted card and reverting reads as "not dirty" again, and an approved
  // card stays locked no matter what local mutators did.
  const serverStatus = tc.serverStatus ?? 'draft'
  const isApproved = serverStatus === 'approved'
  const isSubmittedUnchanged = serverStatus === 'submitted' && !tc.isDirty

  // Jump into the day editor for one date (double-click a day, the bulk bar's
  // "Tag bearbeiten", or the context menu on a single day).
  const editDay = (date: string) => {
    tc.setSelectedDate(date)
    setView('day')
  }

  // Right-click a day → the same bulk actions as the action bar, at the cursor.
  const openDayMenu = (date: string, pos: ContextMenuPosition) => {
    setMenuCount(tc.selectedDates.includes(date) ? tc.selectedDates.length : 1)
    setMenuPos(pos)
  }
  const dayMenuItems: ContextMenuItem[] = [
    ...(menuCount === 1
      ? [{
          label: t('editDay'),
          icon: <Pencil className="h-4 w-4" />,
          // With one day in play, the selection holds exactly that day (a
          // right-click outside the selection re-selects it first).
          onSelect: () => editDay(tc.selectedDates[0] ?? tc.draft.selectedDate),
        }]
      : []),
    { label: t('bulkFill'), icon: <CalendarCheck className="h-4 w-4" />, onSelect: tc.bulkFillFromSchedule },
    ...TIMECARD_ABSENCE_TYPES.map(absence => ({
      label: categoryLabel(absence.value),
      onSelect: () => tc.bulkSetAbsence(absence.value),
    })),
    { label: t('bulkClear'), icon: <Trash2 className="h-4 w-4" />, tone: 'danger' as const, separatorBefore: true, onSelect: tc.bulkClear },
  ]

  // Context for the AI assistant: the schedule/date map (so "this week",
  // "Tuesday", "left at 3pm" resolve to real dated entries) plus the current
  // draft. The long `summary` string also flips AIFormAssist into refine mode,
  // which is what sends this context to the model.
  const currentData = {
    ...tc.aiContext,
    schedule_summary: tc.scheduleSummary,
    current_entries: tc.periodEntries,
    notes: tc.draft.notes,
    summary: `${userName}: ${formatTimecardDuration(tc.totalMinutes)} in ${tc.monthLabel} erfasst, ${tc.periodEntries.length} Tage. Heute ist ${tc.aiContext.today} (${tc.aiContext.today_weekday}).`,
  }

  // Day-view navigation within the visible month.
  const dayIndex = tc.visibleDates.indexOf(tc.draft.selectedDate)
  const gotoDay = (delta: number) => {
    const next = tc.visibleDates[dayIndex + delta]
    if (next) tc.setSelectedDate(next)
  }

  // In month view a click both focuses the day (for the editor) and toggles
  return (
    <article className="space-y-6 pb-12">
      {/* Opened from the history sidebar: make the time-travel obvious and
          offer the way back (the URL owns the viewed period). */}
      {!tc.isViewingCurrentPeriod && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-info-200 bg-info-50 px-4 py-2.5 text-sm text-info-800 dark:border-info-800 dark:bg-info-900/20 dark:text-info-200">
          <span>{t('viewingPastPeriod', { period: tc.monthLabel })}</span>
          <Link href={ROUTES.admin.zeiterfassung} className="font-medium underline underline-offset-2">
            {t('backToCurrentMonth')}
          </Link>
        </div>
      )}

      <TimecardHeader
        monthLabel={tc.monthLabel}
        totalMinutes={tc.totalMinutes}
        entryCount={tc.periodEntries.length}
        status={serverStatus}
      />

      {!tc.hasSchedule && <NoScheduleNotice hasSchedule={tc.hasSchedule} />}

      {/* View toggle + (month) selection hint — the calendar is the hero, so
          the entry tools (clock-in, AI) sit BELOW it, not above. */}
      <TimecardViewBar tc={tc} view={view} setView={setView} dayIndex={dayIndex} gotoDay={gotoDay} />

      {view === 'month' ? (
        <>
          {/* Two DISTINCT intents, kept apart (they read as one blob when
              crammed on a line): LEFT = the 95% case "fill the whole month from
              my plan" (primary action); RIGHT = a labelled "Schnellauswahl"
              group to pick days for the bulk bar below. justify-between splits
              them; on mobile they wrap to two coherent rows. */}
          <TimecardMonthToolbar tc={tc} serverStatus={serverStatus} />

          <TimecardMonthGrid
            visibleDates={tc.visibleDates}
            entries={tc.periodEntries}
            focusedDate={tc.draft.selectedDate}
            selectedDates={tc.selectedDates}
            onDaySelect={tc.handleDaySelect}
            onWeekdaySelect={tc.selectWeekday}
            onClearSelected={tc.clearSelectedEntries}
            onDayContextMenu={openDayMenu}
            onEditDay={editDay}
          />

          <TimecardBulkBar
            count={tc.selectedDates.length}
            onFillFromSchedule={tc.bulkFillFromSchedule}
            onSetAbsence={tc.bulkSetAbsence}
            onClearDays={tc.bulkClear}
            onCancel={tc.clearSelection}
            onEditDay={
              tc.selectedDates.length === 1
                ? () => editDay(tc.selectedDates[0])
                : undefined
            }
          />
        </>
      ) : (
        <TimecardDayEditor
          selectedDate={tc.draft.selectedDate}
          selectedEntry={tc.selectedEntry}
          dayHasPlan={tc.dayHasPlan(tc.draft.selectedDate)}
          onPatch={tc.updateSelectedEntry}
          onFillDay={tc.fillDayFromSchedule}
          onSetAbsence={tc.setDayAbsence}
          onClearDay={tc.clearDay}
        />
      )}

      {/* Entry tools below the hero calendar: clock-in (compact) + the AI
          assistant (collapsed by default so the calendar stays the focus).
          Month view only — they act on the whole card / today, and in the day
          view they buried the day form under two more widgets on phones. */}
      {view === 'month' && <TimecardEntryTools tc={tc} currentData={currentData} />}

      {/* Extras: month note + reset, behind a disclosure. */}
      <TimecardExtras tc={tc} extrasOpen={extrasOpen} setExtrasOpen={setExtrasOpen} />

      <TimeOffPanel />

      <ContextMenu
        position={menuPos}
        items={dayMenuItems}
        onClose={() => setMenuPos(null)}
        header={t('bulkSelected', { count: menuCount })}
      />

      {/* Sticky action bar — THE (single) Save/Einreichen cluster; the month
          header deliberately has none. pr clears the floating feedback FAB
          (fixed right-4 on phones) so it can't cover the submit button. */}
      <TimecardActionBar
        tc={tc}
        serverStatus={serverStatus}
        isApproved={isApproved}
        isSubmittedUnchanged={isSubmittedUnchanged}
        canApprove={canApprove}
      />
    </article>
  )
}
