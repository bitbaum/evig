'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_STATUSES,
  sumTimecardMinutes,
  TIMECARD_ENTRY_CATEGORIES,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_ABSENCE_TYPES,
  TIMECARD_MANUAL_DEFAULT,
  isAbsenceCategory,
  getAbsenceType,
  type TimecardEntryCategory,
  type TimecardStatus,
} from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
import {
  buildTimecardEntriesForMonth,
  buildScheduleEntryForDate,
  weekdayIdFromDate,
  calculateTimeRangeMinutes,
  getMonthStart,
  getNextMonthStart,
  parseWeeklySchedule,
  toISODate,
  WEEKDAY_IDS,
  STANDARD_WEEKLY_SCHEDULE,
} from '@/lib/team/schedule'
import {
  getDaysInRange,
  getEntryForDate,
  mergeEntries,
  normalizeEntry,
  getDisplayDate,
} from '@/lib/team/timecard-utils'
import type {
  Timecard,
  TimecardEntryInput,
  TimecardSaveInput,
} from '@/lib/schemas/timecards'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { createDraft, toDraftState } from './draft-utils'
import type { DraftState, TimecardAIResult } from './types'

/**
 * useTimecardDraft — every piece of state + every handler that used to
 * live inline in TimecardsClient (the 593-line god component).
 *
 * Why a hook and not a context or a reducer:
 *   - One consumer (TimecardsClient parent + a few presentational kids
 *     it passes hook output to). A context would be overkill; a reducer
 *     would force every "patch field X" into an action enum that does
 *     not earn its keep.
 *   - Pure derivations (monthDates, periodEntries, totalMinutes, …) are
 *     useMemo'd so the children re-render only when their inputs change.
 *
 * The hook owns:
 *   - Initial schedule parsing and month-window calculations
 *   - Server-side draft load on mount
 *   - Save / submit network calls
 *   - Per-day patches (start/end/break/category/description)
 *   - "Day off" notes flow
 *   - "Reset day from schedule" and "rebuild whole month from schedule"
 *   - AI-form-assist merge
 *
 * The parent component just composes presentational subcomponents around
 * the hook's return value.
 */
/**
 * Content signature for dirty tracking — only the persisted fields, so
 * server-added metadata (entry ids, timestamps) can't fake a diff between
 * "what the server has" and "what's on screen".
 */
function entrySignature(entry: TimecardEntryInput): string {
  return [
    entry.work_date,
    entry.start_time ?? '',
    entry.end_time ?? '',
    entry.break_minutes ?? 0,
    entry.duration_minutes,
    entry.category ?? 'other',
    entry.description ?? '',
  ].join('|')
}

function draftSignature(entries: TimecardEntryInput[], notes: string): string {
  return `${[...entries].map(entrySignature).sort().join(';')}::${notes ?? ''}`
}

export function useTimecardDraft({ workingHours }: { workingHours: string | null }) {
  const t = useTranslations('admin.timecards')
  const intl = useTimecardIntl()
  // ── Schedule + period window ───────────────────────────────────────
  const schedule = useMemo(() => parseWeeklySchedule(workingHours), [workingHours])
  const hasSchedule = useMemo(
    () => WEEKDAY_IDS.some(day => schedule.days[day].enabled),
    [schedule],
  )
  const currentDate = useMemo(() => new Date(), [])
  const currentMonthStart = useMemo(() => getMonthStart(currentDate), [currentDate])
  const currentMonthEnd = useMemo(() => getNextMonthStart(currentDate), [currentDate])
  const monthDates = useMemo(
    () => getDaysInRange(currentMonthStart, currentMonthEnd),
    [currentMonthStart, currentMonthEnd],
  )
  const monthEntries = useMemo(
    () => buildTimecardEntriesForMonth(schedule, currentMonthStart),
    [schedule, currentMonthStart],
  )
  const monthLabel = useMemo(
    () => intl.monthLabel(currentDate),
    [currentDate, intl],
  )
  // For "fill the month", fall back to the standard Mon-Fri 09:00–17:00 plan
  // when the user hasn't set a schedule yet — so the one-click fill works out
  // of the box (the user can then adjust their schedule and re-fill).
  const effectiveSchedule = useMemo(
    () => (hasSchedule ? schedule : STANDARD_WEEKLY_SCHEDULE),
    [hasSchedule, schedule],
  )
  const monthFillEntries = useMemo(
    () => buildTimecardEntriesForMonth(effectiveSchedule, currentMonthStart),
    [effectiveSchedule, currentMonthStart],
  )
  const scheduleSummary = hasSchedule
    ? intl.scheduleSummary(schedule)
    : t('scheduleStandardSummary')

  const currentPeriodRange = useMemo(
    () => ({
      period_type: 'month' as const,
      period_start: toISODate(currentMonthStart),
      period_end: toISODate(currentMonthEnd),
    }),
    [currentMonthStart, currentMonthEnd],
  )

  // Context handed to the AI assistant so it can resolve natural-language input
  // ("this week", "Tuesday", "left at 3pm") into concrete dated entries: today,
  // a date→weekday map of the month, and the schedule's hours per weekday.
  const aiContext = useMemo(() => {
    const longWeekday = (iso: string) =>
      new Intl.DateTimeFormat('de-CH', { weekday: 'long' }).format(new Date(`${iso}T00:00:00.000Z`))
    const today = toISODate(currentDate)
    // 2024-01-01 was a Monday → index 0 = Montag … 6 = Sonntag (WEEKDAY_IDS order)
    const weekdayName = (index: number) =>
      new Intl.DateTimeFormat('de-CH', { weekday: 'long' }).format(new Date(Date.UTC(2024, 0, 1 + index)))
    return {
      today,
      today_weekday: longWeekday(today),
      month_label: monthLabel,
      calendar: monthDates.map(date => ({ date, weekday: longWeekday(date) })),
      schedule_days: WEEKDAY_IDS.map((id, index) => {
        const day = effectiveSchedule.days[id]
        return {
          weekday: weekdayName(index),
          enabled: day.enabled,
          start: day.start,
          end: day.end,
          break_minutes: day.break_minutes,
        }
      }),
      absence_categories: TIMECARD_ABSENCE_TYPES.map(a => ({
        value: a.value,
        label: a.label,
        paid: a.paid,
      })),
    }
  }, [currentDate, monthLabel, monthDates, effectiveSchedule])

  // ── Draft state ────────────────────────────────────────────────────
  const [draft, setDraft] = useState<DraftState>(() =>
    createDraft(
      monthEntries,
      monthDates.find(date => getEntryForDate(monthEntries, date)) || monthDates[0],
    ),
  )
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Server truth for dirty/lock decisions: the card's persisted status plus a
  // content snapshot of the last server state. Local edits never touch these —
  // isDirty is derived by comparing content, so editing and then reverting to
  // the exact saved state correctly reads as "not dirty".
  const [serverStatus, setServerStatus] = useState<TimecardStatus | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const applyServerCard = useCallback((card: Timecard, fallbackSelectedDate: string) => {
    const next = toDraftState(card, fallbackSelectedDate)
    setDraft(next)
    setServerStatus((card.status as TimecardStatus) ?? null)
    setSavedSnapshot(draftSignature(next.entries, next.notes))
  }, [])

  // ── Derived ────────────────────────────────────────────────────────
  const periodEntries = draft.entries
  const totalMinutes = sumTimecardMinutes(periodEntries)
  const selectedEntry = getEntryForDate(periodEntries, draft.selectedDate)
  const visibleDates = monthDates
  const currentSavePayload: TimecardSaveInput = {
    period_type: currentPeriodRange.period_type,
    period_start: currentPeriodRange.period_start,
    period_end: currentPeriodRange.period_end,
    notes: draft.notes || null,
    entries: periodEntries.map(entry => normalizeEntry(entry)),
  }
  const isDirty = useMemo(
    () =>
      savedSnapshot === null
        ? true
        : draftSignature(periodEntries, draft.notes) !== savedSnapshot,
    [savedSnapshot, periodEntries, draft.notes],
  )

  // ── Mutators ───────────────────────────────────────────────────────
  const updateCurrentDraft = useCallback(
    (updater: (current: DraftState) => DraftState) => {
      setDraft(prev => updater(prev))
      setSyncMessage(null)
      setErrorMessage(null)
    },
    [],
  )

  const rebuildCurrentDraft = useCallback(() => {
    const nextEntries = monthEntries
    const nextSelected =
      monthDates.find(date => getEntryForDate(nextEntries, date)) || monthDates[0]
    updateCurrentDraft(current => ({
      ...current,
      entries: nextEntries,
      notes: '',
      status: TIMECARD_STATUSES.DRAFT,
      selectedDate: nextSelected,
    }))
  }, [monthEntries, monthDates, updateCurrentDraft])

  /**
   * Fill the whole month from the (effective) schedule in one tap — the
   * primary "I worked my normal hours this month" affordance. SMART, not
   * destructive: only adds entries for weekdays that are still empty AND not
   * already marked off in the notes, so manual edits + days-off survive.
   * Uses the standard Mon-Fri 9–17 plan when no schedule is set.
   */
  const fillMonthFromSchedule = useCallback(() => {
    updateCurrentDraft(current => {
      const existingDates = new Set(current.entries.map(entry => entry.work_date))
      const toAdd = monthFillEntries.filter(
        entry =>
          !existingDates.has(entry.work_date) &&
          !current.notes.includes(getDisplayDate(entry.work_date)),
      )
      if (toAdd.length === 0) return current
      return {
        ...current,
        entries: mergeEntries(current.entries, toAdd),
        status: TIMECARD_STATUSES.DRAFT,
      }
    })
  }, [monthFillEntries, updateCurrentDraft])

  // ── Day selection (spreadsheet model) + bulk actions ───────────────
  // Plain click = select one day · Ctrl/Cmd-click = toggle (non-adjacent) ·
  // Shift-click = range from the anchor · Delete = clear the selected days.
  // The bulk bar then applies one action (fill from plan / an absence type /
  // clear) to every selected day. selectedDate (focused day for the editor)
  // tracks the last clicked day.
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [anchorDate, setAnchorDate] = useState<string | null>(null)

  const handleDaySelect = useCallback(
    (date: string, mode: 'single' | 'toggle' | 'range' | 'add' | 'remove') => {
      updateCurrentDraft(current => ({ ...current, selectedDate: date }))
      if (mode === 'toggle') {
        setSelectedDates(prev =>
          prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date],
        )
        setAnchorDate(date)
      } else if (mode === 'add') {
        // Paint: add each day the drag passes over (dragging down a column
        // paints that weekday's days, across a row paints that week's days).
        setSelectedDates(prev => (prev.includes(date) ? prev : [...prev, date]))
        setAnchorDate(date)
      } else if (mode === 'remove') {
        // Erase-paint: a touch drag that started on a selected day removes
        // each day it passes over instead.
        setSelectedDates(prev => prev.filter(d => d !== date))
        setAnchorDate(date)
      } else if (mode === 'range' && anchorDate) {
        const a = monthDates.indexOf(anchorDate)
        const b = monthDates.indexOf(date)
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a <= b ? [a, b] : [b, a]
          setSelectedDates(monthDates.slice(lo, hi + 1))
        } else {
          setSelectedDates([date])
          setAnchorDate(date)
        }
      } else {
        setSelectedDates([date])
        setAnchorDate(date)
      }
    },
    [anchorDate, monthDates, updateCurrentDraft],
  )

  const clearSelection = useCallback(() => {
    setSelectedDates([])
    setAnchorDate(null)
  }, [])

  /** Select every occurrence of one weekday (0=Sun…6=Sat) in the month — the
   *  entry point for clicking a weekday column header ("all Mondays"). With
   *  `additive`, merges into the current selection (dragging across headers). */
  const selectWeekday = useCallback((weekday: number, additive = false) => {
    const days = monthDates.filter(
      date => new Date(`${date}T00:00:00.000Z`).getUTCDay() === weekday,
    )
    if (days.length === 0) return
    setSelectedDates(prev => (additive ? Array.from(new Set([...prev, ...days])) : days))
    setAnchorDate(days[0])
  }, [monthDates])

  const selectAllWeekdays = useCallback(() => {
    const weekdays = monthDates.filter(date => {
      const wd = new Date(`${date}T00:00:00.000Z`).getUTCDay()
      return wd !== 0 && wd !== 6
    })
    setSelectedDates(weekdays)
    setAnchorDate(weekdays[0] ?? null)
  }, [monthDates])

  /** Select every day of the month — the entry point for "empty everything" or
   *  "the whole month was Ferien": select all, then pick a bulk action. */
  const selectAll = useCallback(() => {
    setSelectedDates(monthDates)
    setAnchorDate(monthDates[0] ?? null)
  }, [monthDates])

  /** Schedule hours for a given date's weekday — null when it's NOT a plan day. */
  const scheduleTemplateForDate = useCallback(
    (date: string): { start: string; end: string; break_minutes: number } | null => {
      const wd = new Date(`${date}T00:00:00.000Z`).getUTCDay()
      const weekday = WEEKDAY_IDS[wd === 0 ? 6 : wd - 1]
      const day = effectiveSchedule.days[weekday]
      return day.enabled
        ? { start: day.start, end: day.end, break_minutes: day.break_minutes }
        : null
    },
    [effectiveSchedule],
  )

  /**
   * Like scheduleTemplateForDate but with a 09:00–17:00 fallback, for surfaces
   * that need SOME time baseline (manual editing, AI work entries on explicit
   * dates). Never use it for plan-fills or absence hours — a non-plan day has
   * 0 scheduled hours and must not silently gain a full workday.
   */
  const dayTemplateForDate = useCallback(
    (date: string): { start: string; end: string; break_minutes: number } =>
      scheduleTemplateForDate(date) ?? TIMECARD_MANUAL_DEFAULT,
    [scheduleTemplateForDate],
  )

  /** Whether the date's weekday has plan hours — drives fill-button labels. */
  const dayHasPlan = useCallback(
    (date: string) => scheduleTemplateForDate(date) !== null,
    [scheduleTemplateForDate],
  )

  // Shared entry builders — ONE definition each for "a scheduled work day" and
  // "an absence day", used by both the month bulk actions and the day view, so
  // the two surfaces produce identical data (SSOT/DRY).
  //
  // Day/bulk fill now goes through the SAME canonical builder as the whole-month
  // fill (buildScheduleEntryForDate), so both store the schedule day's own
  // category + description — previously per-day fill hardcoded ADMIN + '',
  // diverging from month fill for any non-ADMIN schedule day (payroll bug).
  const buildScheduleEntry = useCallback(
    (date: string): TimecardEntryInput | null =>
      buildScheduleEntryForDate(date, effectiveSchedule.days[weekdayIdFromDate(date)]),
    [effectiveSchedule],
  )

  /**
   * A standard manual work day (TIMECARD_MANUAL_DEFAULT) — the fill result for
   * a day the user EXPLICITLY targeted that has no plan hours ("I came in on
   * Friday"). Never used by the whole-month fill, which stays plan-only.
   */
  const buildDefaultDayEntry = useCallback((date: string): TimecardEntryInput => {
    const tpl = TIMECARD_MANUAL_DEFAULT
    return {
      work_date: date,
      start_time: tpl.start,
      end_time: tpl.end,
      break_minutes: tpl.break_minutes,
      duration_minutes: calculateTimeRangeMinutes(tpl.start, tpl.end, tpl.break_minutes),
      category: TIMECARD_ENTRY_CATEGORIES.ADMIN,
      source: 'manual',
      description: '',
    }
  }, [])

  const buildAbsenceEntry = useCallback(
    (date: string, category: TimecardEntryCategory): TimecardEntryInput => {
      const paid = getAbsenceType(category)?.paid ?? true
      const t = scheduleTemplateForDate(date)
      // Paid absences (Ferien/Krank/…) count the day's SCHEDULED hours — on a
      // non-plan day that is 0 (Ferien on a free Friday must not add paid
      // time). Unpaid (Unbezahlt) always records 0h but stays labelled.
      const counted = paid && t !== null
      return {
        work_date: date,
        start_time: counted ? t.start : null,
        end_time: counted ? t.end : null,
        break_minutes: counted ? t.break_minutes : 0,
        duration_minutes: counted ? calculateTimeRangeMinutes(t.start, t.end, t.break_minutes) : 0,
        category,
        source: 'manual',
        description: intl.categoryLabel(category),
      }
    },
    [scheduleTemplateForDate, intl],
  )

  const applyToSelected = useCallback(
    (build: (date: string) => TimecardEntryInput) => {
      if (selectedDates.length === 0) return
      updateCurrentDraft(current => ({
        ...current,
        entries: mergeEntries(current.entries, selectedDates.map(build)),
        status: TIMECARD_STATUSES.DRAFT,
      }))
      clearSelection()
    },
    [selectedDates, updateCurrentDraft, clearSelection],
  )

  /**
   * Fill the SELECTED days: plan hours on plan days; a standard manual day on
   * days without plan hours — the user explicitly picked them ("I worked that
   * Friday"), so refusing/skipping is wrong. The message says which days got
   * default times so they can be adjusted.
   */
  const bulkFillFromSchedule = useCallback(() => {
    if (selectedDates.length === 0) return
    let defaulted = 0
    const additions = selectedDates.map(date => {
      const entry = buildScheduleEntry(date)
      if (entry) return entry
      defaulted++
      return buildDefaultDayEntry(date)
    })
    updateCurrentDraft(current => ({
      ...current,
      entries: mergeEntries(current.entries, additions),
      status: TIMECARD_STATUSES.DRAFT,
    }))
    if (defaulted > 0) {
      // After updateCurrentDraft (which clears messages) so it survives.
      setSyncMessage(t('fillDefaultedNonPlanDays', { count: defaulted }))
    }
    clearSelection()
  }, [selectedDates, buildScheduleEntry, buildDefaultDayEntry, updateCurrentDraft, clearSelection, t])

  const bulkSetAbsence = useCallback(
    (category: TimecardEntryCategory) =>
      applyToSelected(date => buildAbsenceEntry(date, category)),
    [applyToSelected, buildAbsenceEntry],
  )

  const bulkClear = useCallback(() => {
    if (selectedDates.length === 0) return
    const set = new Set(selectedDates)
    updateCurrentDraft(current => ({
      ...current,
      entries: current.entries.filter(entry => !set.has(entry.work_date)),
      status: TIMECARD_STATUSES.DRAFT,
    }))
    clearSelection()
  }, [selectedDates, updateCurrentDraft, clearSelection])

  /** Delete/Backspace — clear the selected days' entries, KEEP the selection. */
  const clearSelectedEntries = useCallback(() => {
    if (selectedDates.length === 0) return
    const set = new Set(selectedDates)
    updateCurrentDraft(current => ({
      ...current,
      entries: current.entries.filter(entry => !set.has(entry.work_date)),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }, [selectedDates, updateCurrentDraft])

  const setSelectedDate = useCallback(
    (date: string) =>
      updateCurrentDraft(current => ({ ...current, selectedDate: date })),
    [updateCurrentDraft],
  )

  const setNotes = useCallback(
    (notes: string) => updateCurrentDraft(current => ({ ...current, notes })),
    [updateCurrentDraft],
  )

  const updateSelectedEntry = useCallback(
    (patch: Partial<TimecardEntryInput>) => {
      updateCurrentDraft(current => {
        const selectedDate = current.selectedDate
        const existing = getEntryForDate(current.entries, selectedDate)
        const baseEntry = existing ?? {
          work_date: selectedDate,
          start_time: TIMECARD_MANUAL_DEFAULT.start,
          end_time: TIMECARD_MANUAL_DEFAULT.end,
          break_minutes: TIMECARD_MANUAL_DEFAULT.break_minutes,
          duration_minutes: calculateTimeRangeMinutes(
            TIMECARD_MANUAL_DEFAULT.start,
            TIMECARD_MANUAL_DEFAULT.end,
            TIMECARD_MANUAL_DEFAULT.break_minutes,
          ),
          category: 'other',
          source: 'manual',
          description: '',
        }

        const categoryChanged =
          patch.category !== undefined && patch.category !== baseEntry.category
        let nextEntry: TimecardEntryInput

        if (categoryChanged && isAbsenceCategory(patch.category as string)) {
          // Switching to an absence re-derives the day from the plan (0h on
          // non-plan days) — previously-entered work hours must not carry
          // over into a paid absence.
          nextEntry = buildAbsenceEntry(selectedDate, patch.category as TimecardEntryCategory)
        } else {
          const wasAbsence = isAbsenceCategory(baseEntry.category ?? '')
          // Absence → work: restore a time baseline so the day is editable.
          const template = dayTemplateForDate(selectedDate)
          const seed =
            categoryChanged && wasAbsence
              ? {
                  ...baseEntry,
                  start_time: template.start,
                  end_time: template.end,
                  break_minutes: template.break_minutes,
                  description: '',
                }
              : baseEntry
          const mergedEntry = normalizeEntry({ ...seed, ...patch })
          const shouldRecalc =
            patch.start_time !== undefined ||
            patch.end_time !== undefined ||
            patch.break_minutes !== undefined ||
            (categoryChanged && wasAbsence)
          nextEntry = !shouldRecalc
            ? mergedEntry
            : mergedEntry.start_time && mergedEntry.end_time
              ? {
                  ...mergedEntry,
                  duration_minutes: calculateTimeRangeMinutes(
                    mergedEntry.start_time,
                    mergedEntry.end_time,
                    mergedEntry.break_minutes ?? 0,
                  ),
                }
              : // Times were cleared (hour grid emptied) — a work entry without
                // a time range has no worked minutes; keeping the old duration
                // would leave a phantom total.
                { ...mergedEntry, duration_minutes: 0 }
        }

        const nextEntries = existing
          ? current.entries.map(entry =>
              entry.work_date === selectedDate ? nextEntry : entry,
            )
          : mergeEntries(current.entries, [nextEntry])
        return { ...current, entries: nextEntries, status: TIMECARD_STATUSES.DRAFT }
      })
    },
    [updateCurrentDraft, buildAbsenceEntry, dayTemplateForDate],
  )

  // ── Day-scope actions (the day view applies to the focused day) ────────
  // Same builders as the month bulk actions → identical data, no note hacks.
  // On a non-plan day the fill falls back to the standard manual day (the
  // button is relabelled accordingly via dayHasPlan) — "I worked this Friday"
  // must produce an editable entry, not a refusal.
  const fillDayFromSchedule = useCallback(() => {
    const entry =
      buildScheduleEntry(draft.selectedDate) ?? buildDefaultDayEntry(draft.selectedDate)
    updateCurrentDraft(current => ({
      ...current,
      entries: mergeEntries(current.entries, [entry]),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }, [updateCurrentDraft, buildScheduleEntry, buildDefaultDayEntry, draft.selectedDate])

  const setDayAbsence = useCallback(
    (category: TimecardEntryCategory) => {
      updateCurrentDraft(current => ({
        ...current,
        entries: mergeEntries(current.entries, [buildAbsenceEntry(current.selectedDate, category)]),
        status: TIMECARD_STATUSES.DRAFT,
      }))
    },
    [updateCurrentDraft, buildAbsenceEntry],
  )

  const clearDay = useCallback(() => {
    updateCurrentDraft(current => ({
      ...current,
      entries: current.entries.filter(entry => entry.work_date !== current.selectedDate),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }, [updateCurrentDraft])

  /**
   * Turn one raw AI entry into a valid, internally-consistent TimecardEntryInput
   * — never trust the model's arithmetic. We recompute durations ourselves and
   * force absences onto the canonical paid/unpaid shape (same rules as the bulk
   * absence action), so a malformed AI response can't produce an entry that
   * fails server validation on save.
   */
  const sanitizeAIEntry = useCallback(
    (raw: unknown): TimecardEntryInput | null => {
      if (!raw || typeof raw !== 'object') return null
      const r = raw as Record<string, unknown>
      const work_date = typeof r.work_date === 'string' ? r.work_date : ''
      if (!/^\d{4}-\d{2}-\d{2}$/.test(work_date)) return null
      const category = (
        (TIMECARD_ENTRY_CATEGORY_OPTIONS as string[]).includes(String(r.category))
          ? String(r.category)
          : TIMECARD_ENTRY_CATEGORIES.ADMIN
      ) as TimecardEntryCategory
      const tpl = dayTemplateForDate(work_date)
      const desc = typeof r.description === 'string' ? r.description.slice(0, 500) : ''

      if (isAbsenceCategory(category)) {
        const paid = getAbsenceType(category)?.paid ?? true
        // Same rule as buildAbsenceEntry: paid absences count SCHEDULED hours,
        // which are 0 on non-plan days.
        const sched = scheduleTemplateForDate(work_date)
        const counted = paid && sched !== null
        return {
          work_date,
          start_time: counted ? sched.start : null,
          end_time: counted ? sched.end : null,
          break_minutes: counted ? sched.break_minutes : 0,
          duration_minutes: counted
            ? calculateTimeRangeMinutes(sched.start, sched.end, sched.break_minutes)
            : 0,
          category,
          source: 'ai_assisted',
          description: desc || intl.categoryLabel(category),
        }
      }

      const isHHMM = (v: unknown): v is string => typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)
      const start = isHHMM(r.start_time) ? r.start_time : tpl.start
      const end = isHHMM(r.end_time) ? r.end_time : tpl.end
      const brk = typeof r.break_minutes === 'number' && r.break_minutes >= 0 ? r.break_minutes : tpl.break_minutes
      return {
        work_date,
        start_time: start,
        end_time: end,
        break_minutes: brk,
        duration_minutes: calculateTimeRangeMinutes(start, end, brk),
        category,
        source: 'ai_assisted',
        description: desc,
      }
    },
    [dayTemplateForDate, scheduleTemplateForDate, intl],
  )

  const handleAIFieldsFilled = useCallback(
    (
      data: Partial<TimecardAIResult>,
      _metadata: Record<string, AIFieldMetadataEntry>,
    ) => {
      updateCurrentDraft(current => {
        const incoming = Array.isArray(data.entries)
          ? (data.entries.map(sanitizeAIEntry).filter(Boolean) as TimecardEntryInput[])
          : []
        const nextEntries = incoming.length
          ? mergeEntries(current.entries, incoming)
          : current.entries
        return {
          ...current,
          entries: nextEntries,
          notes: typeof data.notes === 'string' ? data.notes : current.notes,
          status: TIMECARD_STATUSES.DRAFT,
          selectedDate: incoming[0]?.work_date || current.selectedDate,
        }
      })
    },
    [updateCurrentDraft, sanitizeAIEntry],
  )

  // ── Network ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true

    const loadDraft = async () => {
      setIsLoadingDraft(true)
      setSyncMessage(null)
      try {
        const params = new URLSearchParams({
          period_type: currentPeriodRange.period_type,
          period_date: currentPeriodRange.period_start,
        })
        const result = await apiFetch<Timecard>(`/api/timecards?${params.toString()}`)
        if (!active) return
        if (!result.success || !result.data) {
          setErrorMessage(result.error || t('draftLoadError'))
          return
        }
        applyServerCard(result.data, monthDates[0])
        setSyncMessage(t('draftLoaded'))
      } finally {
        if (active) setIsLoadingDraft(false)
      }
    }

    loadDraft().catch(() => {
      if (active) {
        setErrorMessage(t('draftLoadError'))
        setIsLoadingDraft(false)
      }
    })

    return () => {
      active = false
    }
    // monthDates is derived from currentPeriodRange via useMemo, so the
    // identity churn is bounded to the actual month change.
  }, [
    currentPeriodRange.period_end,
    currentPeriodRange.period_start,
    currentPeriodRange.period_type,
    monthDates,
    applyServerCard,
    t,
  ])

  const saveDraft = useCallback(async () => {
    setIsSaving(true)
    setSyncMessage(null)
    setErrorMessage(null)
    try {
      const result = await apiFetch<Timecard>('/api/timecards', {
        method: 'PUT',
        body: currentSavePayload,
      })
      if (!result.success || !result.data) throw new Error(result.error || 'save_failed')
      applyServerCard(result.data, draft.selectedDate)
      setSyncMessage(t('draftSaved'))
    } catch {
      setErrorMessage(t('draftSaveError'))
    } finally {
      setIsSaving(false)
    }
  }, [currentSavePayload, draft.selectedDate, applyServerCard, t])

  /**
   * Add a clocked shift to the month draft and persist it immediately.
   * Integral to the tool: the clock-in/out widget calls this so a finished
   * shift lands in the SAME month timecard the user is editing (the old
   * separate shift page wrote to a parallel WEEK card — fragmentation).
   * Accumulates into the day's existing entry rather than clobbering it.
   */
  const addShiftEntry = useCallback(
    async (shift: {
      work_date: string
      start_time: string
      end_time: string
      minutes: number
      category: TimecardEntryCategory
      description?: string
    }) => {
      const existing = getEntryForDate(periodEntries, shift.work_date)
      const merged: TimecardEntryInput = existing
        ? {
            ...existing,
            start_time: existing.start_time ?? shift.start_time,
            end_time: shift.end_time,
            duration_minutes: existing.duration_minutes + shift.minutes,
            description:
              [existing.description, shift.description].filter(Boolean).join(' · ') ||
              existing.description,
          }
        : {
            work_date: shift.work_date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            break_minutes: 0,
            duration_minutes: shift.minutes,
            category: shift.category,
            source: 'manual',
            description: shift.description ?? '',
          }
      const nextEntries = mergeEntries(periodEntries, [merged])

      setIsSaving(true)
      setSyncMessage(null)
      setErrorMessage(null)
      try {
        const result = await apiFetch<Timecard>('/api/timecards', {
          method: 'PUT',
          body: {
            period_type: currentPeriodRange.period_type,
            period_start: currentPeriodRange.period_start,
            period_end: currentPeriodRange.period_end,
            notes: draft.notes || null,
            entries: nextEntries,
          },
        })
        if (!result.success || !result.data) throw new Error(result.error || 'shift_save_failed')
        applyServerCard(result.data, shift.work_date)
        setSyncMessage(t('shiftSaved'))
      } catch {
        setErrorMessage(t('shiftSaveError'))
      } finally {
        setIsSaving(false)
      }
    },
    [periodEntries, currentPeriodRange, draft.notes, applyServerCard, t],
  )

  const submitDraft = useCallback(async () => {
    setIsSubmitting(true)
    setSyncMessage(null)
    setErrorMessage(null)
    try {
      const result = await apiFetch<Timecard>('/api/timecards', {
        method: 'POST',
        body: currentSavePayload,
      })
      if (!result.success || !result.data) throw new Error(result.error || 'submit_failed')
      applyServerCard(result.data, draft.selectedDate)
      setSyncMessage(t('submitSuccess'))
    } catch {
      setErrorMessage(t('submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }, [currentSavePayload, draft.selectedDate, t, applyServerCard])

  return {
    // schedule
    hasSchedule,
    scheduleSummary,
    // window
    monthLabel,
    visibleDates,
    // draft
    draft,
    periodEntries,
    totalMinutes,
    selectedEntry,
    serverStatus,
    isDirty,
    // network state
    isLoadingDraft,
    isSaving,
    isSubmitting,
    syncMessage,
    errorMessage,
    // mutators
    setSelectedDate,
    setNotes,
    updateSelectedEntry,
    fillMonthFromSchedule,
    // day-scope actions (day view)
    dayHasPlan,
    fillDayFromSchedule,
    setDayAbsence,
    clearDay,
    // multi-select + bulk
    selectedDates,
    handleDaySelect,
    selectWeekday,
    clearSelection,
    clearSelectedEntries,
    selectAllWeekdays,
    selectAll,
    // ai
    aiContext,
    bulkFillFromSchedule,
    bulkSetAbsence,
    bulkClear,
    addShiftEntry,
    rebuildCurrentDraft,
    saveDraft,
    submitDraft,
    handleAIFieldsFilled,
  }
}

export type UseTimecardDraftResult = ReturnType<typeof useTimecardDraft>
