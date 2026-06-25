/**
 * Timecard utility functions — pure helpers extracted from TimecardsClient.
 * Import addDays and toISODate from schedule.ts (already exported there).
 */

import { addDays, toISODate } from '@/lib/team/schedule'
import { WEEKDAY_IDS } from '@/lib/team/schedule'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'

export function startOfWeek(date: Date): Date {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = next.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setUTCDate(next.getUTCDate() + diff)
  return next
}

export function getDaysInRange(start: Date, end: Date): string[] {
  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor < end) {
    dates.push(toISODate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}

export function getWeekDates(periodStart: string): string[] {
  const start = new Date(`${periodStart}T00:00:00.000Z`)
  return WEEKDAY_IDS.map((_, index) => toISODate(addDays(start, index)))
}

export function getDisplayDate(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatShortDateRange(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(date)
}

/** Postgres TIME columns may return HH:MM:SS — API/schema expect HH:MM. */
export function normalizeTimeToHHMM(value: string | null | undefined): string | null {
  if (!value) return null
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

export function normalizeEntry(entry: TimecardEntryInput): TimecardEntryInput {
  return {
    ...entry,
    start_time: normalizeTimeToHHMM(entry.start_time),
    end_time: normalizeTimeToHHMM(entry.end_time),
    break_minutes: entry.break_minutes ?? 0,
    category: entry.category ?? 'other',
    source: entry.source ?? 'manual',
  }
}

export function mergeEntries(
  current: TimecardEntryInput[],
  incoming: TimecardEntryInput[],
): TimecardEntryInput[] {
  const byDate = new Map(current.map(entry => [entry.work_date, normalizeEntry(entry)]))
  incoming.forEach(entry => byDate.set(entry.work_date, normalizeEntry(entry)))
  return Array.from(byDate.values()).sort((a, b) => a.work_date.localeCompare(b.work_date))
}

export function getEntryForDate(
  entries: TimecardEntryInput[],
  date: string,
): TimecardEntryInput | undefined {
  return entries.find(entry => entry.work_date === date)
}
