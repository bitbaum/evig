'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { TIMECARD_STATUSES, sumTimecardMinutes } from '@/config/timecards'
import {
  buildTimecardEntriesForMonth,
  calculateTimeRangeMinutes,
  getMonthStart,
  getNextMonthStart,
  parseWeeklySchedule,
  summarizeWeeklySchedule,
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
export function useTimecardDraft({ workingHours }: { workingHours: string | null }) {
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
    () => new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(currentDate),
    [currentDate],
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
    ? summarizeWeeklySchedule(schedule)
    : 'Standard: Mo–Fr 09:00–17:00 (anpassbar)'

  const currentPeriodRange = useMemo(
    () => ({
      period_type: 'month' as const,
      period_start: toISODate(currentMonthStart),
      period_end: toISODate(currentMonthEnd),
    }),
    [currentMonthStart, currentMonthEnd],
  )

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
    entries: periodEntries,
  }

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
          start_time: '09:00',
          end_time: '17:00',
          break_minutes: 60,
          duration_minutes: 420,
          category: 'other',
          source: 'manual',
          description: '',
        }
        const mergedEntry = normalizeEntry({ ...baseEntry, ...patch })
        const shouldRecalc =
          patch.start_time !== undefined ||
          patch.end_time !== undefined ||
          patch.break_minutes !== undefined
        const nextEntry =
          shouldRecalc && mergedEntry.start_time && mergedEntry.end_time
            ? {
                ...mergedEntry,
                duration_minutes: calculateTimeRangeMinutes(
                  mergedEntry.start_time,
                  mergedEntry.end_time,
                  mergedEntry.break_minutes ?? 0,
                ),
              }
            : mergedEntry
        const nextEntries = existing
          ? current.entries.map(entry =>
              entry.work_date === selectedDate ? nextEntry : entry,
            )
          : mergeEntries(current.entries, [nextEntry])
        return { ...current, entries: nextEntries, status: TIMECARD_STATUSES.DRAFT }
      })
    },
    [updateCurrentDraft],
  )

  const markSelectedDateOff = useCallback(
    (reason: string) => {
      updateCurrentDraft(current => {
        const note = `${getDisplayDate(current.selectedDate)}: ${reason}`
        return {
          ...current,
          entries: current.entries.filter(entry => entry.work_date !== current.selectedDate),
          notes: current.notes.includes(note)
            ? current.notes
            : [current.notes, note].filter(Boolean).join('\n'),
          status: TIMECARD_STATUSES.DRAFT,
        }
      })
    },
    [updateCurrentDraft],
  )

  const restoreSelectedDateFromSchedule = useCallback(() => {
    const templateEntry = getEntryForDate(monthEntries, draft.selectedDate)
    updateCurrentDraft(current => ({
      ...current,
      entries: templateEntry
        ? mergeEntries(current.entries, [templateEntry])
        : current.entries.filter(entry => entry.work_date !== current.selectedDate),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }, [monthEntries, draft.selectedDate, updateCurrentDraft])

  /**
   * Manual fallback: apply a vanilla 09:00–17:00 (60 min break, "admin"
   * category) entry to the selected day, regardless of whether the user
   * has a working_hours schedule. Used by the empty-day affordance —
   * "if a day is empty and I click it, give me a one-tap apply-9-17."
   */
  const applyDefault9To17 = useCallback(() => {
    const standardEntry: TimecardEntryInput = {
      work_date: draft.selectedDate,
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 60,
      duration_minutes: calculateTimeRangeMinutes('09:00', '17:00', 60),
      category: 'admin',
      source: 'manual',
      description: '',
    }
    updateCurrentDraft(current => ({
      ...current,
      entries: mergeEntries(current.entries, [standardEntry]),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }, [draft.selectedDate, updateCurrentDraft])

  const handleAIFieldsFilled = useCallback(
    (
      data: Partial<TimecardAIResult>,
      _metadata: Record<string, AIFieldMetadataEntry>,
    ) => {
      updateCurrentDraft(current => {
        const nextEntries = Array.isArray(data.entries)
          ? mergeEntries(current.entries, data.entries)
          : current.entries
        return {
          ...current,
          entries: nextEntries,
          notes: typeof data.notes === 'string' ? data.notes : current.notes,
          status: TIMECARD_STATUSES.DRAFT,
          selectedDate: nextEntries[0]?.work_date || current.selectedDate,
        }
      })
    },
    [updateCurrentDraft],
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
          setErrorMessage(result.error || 'Zeitkarte konnte nicht geladen werden.')
          return
        }
        setDraft(toDraftState(result.data, monthDates[0]))
        setSyncMessage('Zeitkarte geladen')
      } finally {
        if (active) setIsLoadingDraft(false)
      }
    }

    loadDraft().catch(() => {
      if (active) {
        setErrorMessage('Zeitkarte konnte nicht geladen werden.')
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
      setDraft(toDraftState(result.data, draft.selectedDate))
      setSyncMessage('Gespeichert')
    } catch {
      setErrorMessage('Zeitkarte konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }, [currentSavePayload, draft.selectedDate])

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
      setDraft(toDraftState(result.data, draft.selectedDate))
      setSyncMessage('Zur Prüfung gesendet')
    } catch {
      setErrorMessage('Zeitkarte konnte nicht eingereicht werden.')
    } finally {
      setIsSubmitting(false)
    }
  }, [currentSavePayload, draft.selectedDate])

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
    markSelectedDateOff,
    restoreSelectedDateFromSchedule,
    applyDefault9To17,
    fillMonthFromSchedule,
    rebuildCurrentDraft,
    saveDraft,
    submitDraft,
    handleAIFieldsFilled,
  }
}

export type UseTimecardDraftResult = ReturnType<typeof useTimecardDraft>
