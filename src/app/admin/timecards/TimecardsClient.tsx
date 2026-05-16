'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Clock, RotateCcw, Send, Sparkles, UserCheck } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_ENTRY_CATEGORY_LABELS,
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_STATUSES,
  formatTimecardDuration,
  sumTimecardMinutes,
  type TimecardEntryCategory,
  type TimecardStatus,
} from '@/config/timecards'
import {
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  buildTimecardEntriesForMonth,
  buildTimecardEntriesFromSchedule,
  calculateTimeRangeMinutes,
  getMonthStart,
  getNextMonthStart,
  parseWeeklySchedule,
  summarizeWeeklySchedule,
} from '@/lib/team/schedule'
import type { Timecard, TimecardEntryInput, TimecardSaveInput } from '@/lib/schemas/timecards'

type PeriodMode = 'month' | 'week'

interface TimecardsClientProps {
  workingHours: string | null
  userName: string
}

interface TimecardAIResult {
  entries?: TimecardEntryInput[]
  notes?: string
}

interface DraftState {
  entries: TimecardEntryInput[]
  notes: string
  status: TimecardStatus
  selectedDate: string
}

function startOfWeek(date: Date): Date {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = next.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setUTCDate(next.getUTCDate() + diff)
  return next
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDaysInRange(start: Date, end: Date): string[] {
  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor < end) {
    dates.push(toISODate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

function getWeekDates(periodStart: string): string[] {
  const start = new Date(`${periodStart}T00:00:00.000Z`)
  return WEEKDAY_IDS.map((_, index) => toISODate(addDays(start, index)))
}

function getDisplayDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(date)
}

function normalizeEntry(entry: TimecardEntryInput): TimecardEntryInput {
  return {
    ...entry,
    break_minutes: entry.break_minutes ?? 0,
    category: entry.category ?? 'other',
    source: entry.source ?? 'manual',
  }
}

function mergeEntries(current: TimecardEntryInput[], incoming: TimecardEntryInput[]): TimecardEntryInput[] {
  const byDate = new Map(current.map(entry => [entry.work_date, normalizeEntry(entry)]))
  incoming.forEach(entry => byDate.set(entry.work_date, normalizeEntry(entry)))
  return Array.from(byDate.values()).sort((a, b) => a.work_date.localeCompare(b.work_date))
}

function getEntryForDate(entries: TimecardEntryInput[], date: string): TimecardEntryInput | undefined {
  return entries.find(entry => entry.work_date === date)
}

function createDraft(entries: TimecardEntryInput[], selectedDate: string): DraftState {
  return {
    entries,
    notes: '',
    status: TIMECARD_STATUSES.DRAFT,
    selectedDate,
  }
}

function toDraftState(timecard: Timecard, fallbackSelectedDate: string): DraftState {
  return {
    entries: timecard.entries,
    notes: timecard.notes ?? '',
    status: timecard.status as TimecardStatus,
    selectedDate:
      timecard.entries.find(entry => entry.work_date === fallbackSelectedDate)?.work_date ||
      timecard.entries[0]?.work_date ||
      fallbackSelectedDate,
  }
}

export function TimecardsClient({ workingHours, userName }: TimecardsClientProps) {
  const schedule = useMemo(() => parseWeeklySchedule(workingHours), [workingHours])
  const hasSchedule = useMemo(
    () => WEEKDAY_IDS.some(day => schedule.days[day].enabled),
    [schedule]
  )
  const currentDate = useMemo(() => new Date(), [])
  const currentWeekStart = useMemo(() => startOfWeek(currentDate), [currentDate])
  const currentMonthStart = useMemo(() => getMonthStart(currentDate), [currentDate])
  const currentMonthEnd = useMemo(() => getNextMonthStart(currentDate), [currentDate])
  const weekPeriodStart = useMemo(() => toISODate(currentWeekStart), [currentWeekStart])
  const weekDates = useMemo(() => getWeekDates(weekPeriodStart), [weekPeriodStart])
  const monthDates = useMemo(
    () => getDaysInRange(currentMonthStart, currentMonthEnd),
    [currentMonthStart, currentMonthEnd]
  )
  const weekEntries = useMemo(
    () => buildTimecardEntriesFromSchedule(schedule, weekPeriodStart),
    [schedule, weekPeriodStart]
  )
  const monthEntries = useMemo(
    () => buildTimecardEntriesForMonth(schedule, currentMonthStart),
    [schedule, currentMonthStart]
  )
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(currentDate),
    [currentDate]
  )

  const [mode, setMode] = useState<PeriodMode>('month')
  const [drafts, setDrafts] = useState<Record<PeriodMode, DraftState>>({
    month: createDraft(monthEntries, monthDates.find(date => getEntryForDate(monthEntries, date)) || monthDates[0]),
    week: createDraft(weekEntries, weekDates.find(date => getEntryForDate(weekEntries, date)) || weekDates[0]),
  })
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentPeriodRange = mode === 'month'
    ? {
        period_type: 'month' as const,
        period_start: toISODate(currentMonthStart),
        period_end: toISODate(currentMonthEnd),
      }
    : {
        period_type: 'week' as const,
        period_start: weekPeriodStart,
        period_end: toISODate(addDays(currentWeekStart, 7)),
      }

  const draft = drafts[mode]
  const periodEntries = draft.entries
  const totalMinutes = sumTimecardMinutes(periodEntries)
  const selectedEntry = getEntryForDate(periodEntries, draft.selectedDate)
  const scheduleSummary = hasSchedule ? summarizeWeeklySchedule(schedule) : 'Noch kein Standardschedule hinterlegt'
  const currentPeriodLabel = mode === 'month'
    ? monthLabel
    : `${formatShortDate(currentWeekStart)} bis ${formatShortDate(addDays(currentWeekStart, 4))}`

  const updateCurrentDraft = (updater: (current: DraftState) => DraftState) => {
    setDrafts(prev => ({
      ...prev,
      [mode]: updater(prev[mode]),
    }))
    setSyncMessage(null)
    setErrorMessage(null)
  }

  const rebuildCurrentDraft = () => {
    const nextEntries = mode === 'month' ? monthEntries : weekEntries
    const nextSelected = (mode === 'month' ? monthDates : weekDates).find(date => getEntryForDate(nextEntries, date)) || (mode === 'month' ? monthDates[0] : weekDates[0])
    updateCurrentDraft(current => ({
      ...current,
      entries: nextEntries,
      notes: '',
      status: TIMECARD_STATUSES.DRAFT,
      selectedDate: nextSelected,
    }))
  }

  const currentSavePayload: TimecardSaveInput = {
    period_type: currentPeriodRange.period_type,
    period_start: currentPeriodRange.period_start,
    period_end: currentPeriodRange.period_end,
    notes: draft.notes || null,
    entries: periodEntries,
  }

  const visibleDates = mode === 'month' ? monthDates : weekDates

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
        const loadedTimecard = result.data

        setDrafts(prev => ({
          ...prev,
          [mode]: toDraftState(loadedTimecard, visibleDates[0]),
        }))
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
  }, [mode, currentPeriodRange.period_end, currentPeriodRange.period_start, currentPeriodRange.period_type, visibleDates])

  const saveDraft = async () => {
    setIsSaving(true)
    setSyncMessage(null)
    setErrorMessage(null)
    try {
      const result = await apiFetch<Timecard>('/api/timecards', {
        method: 'PUT',
        body: currentSavePayload,
      })
      if (!result.success || !result.data) throw new Error(result.error || 'save_failed')
      const savedTimecard = result.data
      setDrafts(prev => ({
        ...prev,
        [mode]: toDraftState(savedTimecard, draft.selectedDate),
      }))
      setSyncMessage('Gespeichert')
    } catch {
      setErrorMessage('Zeitkarte konnte nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  const submitDraft = async () => {
    setIsSubmitting(true)
    setSyncMessage(null)
    setErrorMessage(null)
    try {
      const result = await apiFetch<Timecard>('/api/timecards', {
        method: 'POST',
        body: currentSavePayload,
      })
      if (!result.success || !result.data) throw new Error(result.error || 'submit_failed')
      const submittedTimecard = result.data
      setDrafts(prev => ({
        ...prev,
        [mode]: toDraftState(submittedTimecard, draft.selectedDate),
      }))
      setSyncMessage('Zur Prüfung gesendet')
    } catch {
      setErrorMessage('Zeitkarte konnte nicht eingereicht werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateSelectedEntry = (patch: Partial<TimecardEntryInput>) => {
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
      const shouldRecalculateDuration =
        patch.start_time !== undefined ||
        patch.end_time !== undefined ||
        patch.break_minutes !== undefined
      const nextEntry = shouldRecalculateDuration && mergedEntry.start_time && mergedEntry.end_time
        ? {
            ...mergedEntry,
            duration_minutes: calculateTimeRangeMinutes(
              mergedEntry.start_time,
              mergedEntry.end_time,
              mergedEntry.break_minutes ?? 0
            ),
          }
        : mergedEntry
      const nextEntries = existing
        ? current.entries.map(entry =>
            entry.work_date === selectedDate ? nextEntry : entry
          )
        : mergeEntries(current.entries, [nextEntry])

      return {
        ...current,
        entries: nextEntries,
        status: TIMECARD_STATUSES.DRAFT,
      }
    })
  }

  const removeSelectedEntry = () => {
    updateCurrentDraft(current => ({
      ...current,
      entries: current.entries.filter(entry => entry.work_date !== current.selectedDate),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }

  const markSelectedDateOff = (reason: string) => {
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
  }

  const restoreSelectedDateFromSchedule = () => {
    const templateEntries = mode === 'month' ? monthEntries : weekEntries
    const templateEntry = getEntryForDate(templateEntries, draft.selectedDate)
    updateCurrentDraft(current => ({
      ...current,
      entries: templateEntry
        ? mergeEntries(current.entries, [templateEntry])
        : current.entries.filter(entry => entry.work_date !== current.selectedDate),
      status: TIMECARD_STATUSES.DRAFT,
    }))
  }

  const handleAIFieldsFilled = (
    data: Partial<TimecardAIResult>,
    _metadata: Record<string, AIFieldMetadataEntry>
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
  }

  const helperText = hasSchedule
    ? 'Dein Monat ist aus dem offiziellen Schedule vorbereitet. Du musst nur bestätigen oder Ausnahmen eintragen.'
    : 'Lege zuerst deinen offiziellen Schedule im Team-Profil fest. Danach ist die Zeitkarte automatisch vorbereitet.'

  const currentData = {
    mode,
    period_label: currentPeriodLabel,
    schedule: scheduleSummary,
    summary: `${userName}: ${formatTimecardDuration(totalMinutes)} in diesem ${mode === 'month' ? 'Monat' : 'Woche'}. ${periodEntries.length} Einträge.`,
    entries: periodEntries,
    notes: draft.notes,
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-white/[0.06] dark:bg-neutral-900">
              {(['month', 'week'] as PeriodMode[]).map(candidate => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setMode(candidate)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === candidate
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {candidate === 'month' ? 'Monat' : 'Woche'}
                </button>
              ))}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {mode === 'month' ? `${monthLabel} ist vorbereitet` : 'Diese Woche ist vorbereitet'}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submitDraft}
              disabled={isSubmitting || periodEntries.length === 0 || isLoadingDraft}
              className="inline-flex items-center gap-2 rounded-lg bg-success-600 px-3 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sende…' : 'Bestätigen und einreichen'}
            </button>
            <button
              type="button"
              onClick={rebuildCurrentDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
              >
                <RotateCcw className="h-4 w-4" />
                Vorlage zurücksetzen
              </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={isSaving || isLoadingDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
            >
              <Check className="h-4 w-4" />
              {isSaving ? 'Speichere…' : 'Entwurf speichern'}
            </button>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-800 dark:border-error-800 dark:bg-error-900/20 dark:text-error-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {syncMessage && (
          <p className="mt-3 text-sm text-success-700 dark:text-success-300">{syncMessage}</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {mode === 'month' ? 'Diesen Monat' : 'Diese Woche'}
          </p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            {formatTimecardDuration(totalMinutes)}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {periodEntries.length} vorbereitete Tage aus Schedule und Ausnahmen.
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Status</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            {draft.status === TIMECARD_STATUSES.SUBMITTED ? <UserCheck className="h-5 w-5 text-success-600" /> : <Clock className="h-5 w-5 text-neutral-500" />}
            {draft.status === TIMECARD_STATUSES.SUBMITTED ? 'Bereit' : 'Entwurf'}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Einreichen heisst: von dir geprüft und bereit für Freigabe.</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Schedule</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{scheduleSummary}</p>
          {!hasSchedule && (
            <p className="mt-1 text-sm text-warning-600 dark:text-warning-400">Ohne Standardschedule kannst du nur manuell arbeiten.</p>
          )}
        </div>
      </div>

      {!hasSchedule && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-warning-900 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
          <p className="text-sm font-medium">Dein offizieller Schedule fehlt noch.</p>
          <p className="mt-1 text-sm text-warning-800 dark:text-warning-300">
            Lege ihn im Team-Profil fest. Danach werden Zeitkarten automatisch vorgefüllt und du musst nur noch Ausnahmen anfassen.
          </p>
          <Link
            href="/admin/team"
            className="mt-3 inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-warning-900 transition-colors hover:bg-warning-100 dark:bg-warning-950/40 dark:text-warning-100 dark:hover:bg-warning-900/40"
          >
            Team-Profil öffnen
          </Link>
        </div>
      )}

      <AIFormAssist<TimecardAIResult>
        formType="timecard"
        variant="section"
        defaultExpanded={false}
        currentData={currentData}
        placeholder={mode === 'month'
          ? 'z.B. 12. und 13. frei, sonst normal'
          : 'z.B. Freitag frei oder Mittwoch 10-14 Uhr'}
        onFieldsFilled={handleAIFieldsFilled}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {mode === 'month' ? monthLabel : 'Aktuelle Woche'}
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Normale Tage bleiben unverändert. Wähle nur einen Tag aus, wenn etwas anders war.
              </p>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {mode === 'month' ? 'Monatsübersicht' : `${weekDates[0]} bis ${weekDates[4]}`}
            </div>
          </div>

          <div className={`grid gap-2 ${mode === 'month' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7' : 'grid-cols-2 sm:grid-cols-5'}`}>
            {visibleDates.map((date) => {
              const entry = getEntryForDate(periodEntries, date)
              const active = draft.selectedDate === date
              const weekdayLabel = new Intl.DateTimeFormat('de-CH', { weekday: 'short' }).format(new Date(`${date}T00:00:00.000Z`))
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => updateCurrentDraft(current => ({ ...current, selectedDate: date }))}
                  className={`min-h-28 rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:border-primary-400 dark:bg-primary-900/20'
                      : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white dark:border-white/[0.06] dark:bg-neutral-900/40 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{weekdayLabel}</p>
                    {entry && <Check className="h-4 w-4 text-success-600" />}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{date.slice(5)}</p>
                  <p className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
                    {formatTimecardDuration(entry?.duration_minutes ?? 0)}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {entry ? TIMECARD_ENTRY_CATEGORY_LABELS[entry.category as TimecardEntryCategory] : 'Vorgefüllt aus Schedule'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Ausnahme</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{getDisplayDate(draft.selectedDate)}</p>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => markSelectedDateOff('frei')}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
              >
                Frei
              </button>
              <button
                type="button"
                onClick={() => markSelectedDateOff('krank')}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
              >
                Krank
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Start
                <input
                  type="time"
                  value={selectedEntry?.start_time ?? '09:00'}
                  onChange={(e) => updateSelectedEntry({ start_time: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Ende
                <input
                  type="time"
                  value={selectedEntry?.end_time ?? '17:00'}
                  onChange={(e) => updateSelectedEntry({ end_time: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Pause in Minuten
              <input
                type="number"
                min={0}
                max={240}
                step={15}
                value={selectedEntry?.break_minutes ?? 0}
                onChange={(e) => updateSelectedEntry({ break_minutes: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              />
            </label>

            <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-300">
              Berechnete Dauer: <span className="font-semibold text-neutral-900 dark:text-white">{formatTimecardDuration(selectedEntry?.duration_minutes ?? 0)}</span>
            </div>

            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Kategorie
              <select
                value={selectedEntry?.category ?? 'other'}
                onChange={(e) => updateSelectedEntry({ category: e.target.value as TimecardEntryCategory })}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              >
                {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(category => (
                  <option key={category} value={category}>
                    {TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notiz
              <textarea
                rows={3}
                value={selectedEntry?.description ?? ''}
                onChange={(e) => updateSelectedEntry({ description: e.target.value })}
                placeholder="Nur wenn dieser Tag anders war"
                className="mt-1 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={restoreSelectedDateFromSchedule}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-white/[0.06]"
              >
                Tag aus Vorlage wiederherstellen
              </button>
            </div>
          </div>
        </aside>
      </section>

      <label className="block rounded-lg border border-neutral-200 bg-white p-4 dark:border-white/[0.06] dark:bg-neutral-900">
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-primary-600" />
          Wochen- oder Monatskommentar
        </span>
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => updateCurrentDraft(current => ({ ...current, notes: e.target.value }))}
          placeholder="Optional, z.B. Ferien, Krankheit, Sondereinsatz oder Korrekturgrund"
          className="mt-2 w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
        />
      </label>
    </div>
  )
}
