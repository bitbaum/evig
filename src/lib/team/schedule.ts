import {
  TIMECARD_ENTRY_CATEGORIES,
  type TimecardEntryCategory,
} from '@/config/timecards'
import type { TimecardEntryInput } from '@/lib/schemas/timecards'

export const WEEKDAY_IDS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type WeekdayId = typeof WEEKDAY_IDS[number]

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
  monday: 'Mo',
  tuesday: 'Di',
  wednesday: 'Mi',
  thursday: 'Do',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'So',
}

export interface WeeklyScheduleDay {
  enabled: boolean
  start: string
  end: string
  break_minutes: number
  category: TimecardEntryCategory
}

export interface WeeklySchedule {
  version: 1
  days: Record<WeekdayId, WeeklyScheduleDay>
}

const DEFAULT_DAY: WeeklyScheduleDay = {
  enabled: false,
  start: '09:00',
  end: '17:00',
  break_minutes: 60,
  category: TIMECARD_ENTRY_CATEGORIES.ADMIN,
}

export const EMPTY_WEEKLY_SCHEDULE: WeeklySchedule = {
  version: 1,
  days: Object.fromEntries(
    WEEKDAY_IDS.map(day => [day, { ...DEFAULT_DAY }])
  ) as Record<WeekdayId, WeeklyScheduleDay>,
}

export const STANDARD_WEEKLY_SCHEDULE: WeeklySchedule = {
  version: 1,
  days: Object.fromEntries(
    WEEKDAY_IDS.map(day => [
      day,
      {
        ...DEFAULT_DAY,
        enabled: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day),
      },
    ])
  ) as Record<WeekdayId, WeeklyScheduleDay>,
}

function cloneSchedule(schedule: WeeklySchedule): WeeklySchedule {
  return {
    version: 1,
    days: Object.fromEntries(
      WEEKDAY_IDS.map(day => [day, { ...schedule.days[day] }])
    ) as Record<WeekdayId, WeeklyScheduleDay>,
  }
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)
}

function normalizeDay(input: unknown): WeeklyScheduleDay {
  if (!input || typeof input !== 'object') return { ...DEFAULT_DAY }
  const day = input as Partial<WeeklyScheduleDay>
  const category = Object.values(TIMECARD_ENTRY_CATEGORIES).includes(day.category as TimecardEntryCategory)
    ? day.category as TimecardEntryCategory
    : DEFAULT_DAY.category

  return {
    enabled: day.enabled === true,
    start: isTime(day.start) ? day.start : DEFAULT_DAY.start,
    end: isTime(day.end) ? day.end : DEFAULT_DAY.end,
    break_minutes: Number.isInteger(day.break_minutes)
      ? Math.max(0, Math.min(240, day.break_minutes ?? 0))
      : DEFAULT_DAY.break_minutes,
    category,
  }
}

export function parseWeeklySchedule(value: string | null | undefined): WeeklySchedule {
  if (!value) return cloneSchedule(EMPTY_WEEKLY_SCHEDULE)

  try {
    const parsed = JSON.parse(value) as Partial<WeeklySchedule>
    if (parsed.version !== 1 || !parsed.days || typeof parsed.days !== 'object') {
      return cloneSchedule(EMPTY_WEEKLY_SCHEDULE)
    }

    return {
      version: 1,
      days: Object.fromEntries(
        WEEKDAY_IDS.map(day => [day, normalizeDay(parsed.days?.[day])])
      ) as Record<WeekdayId, WeeklyScheduleDay>,
    }
  } catch {
    return cloneSchedule(EMPTY_WEEKLY_SCHEDULE)
  }
}

export function serializeWeeklySchedule(schedule: WeeklySchedule): string {
  return JSON.stringify({
    version: 1,
    days: Object.fromEntries(
      WEEKDAY_IDS.map(day => [day, normalizeDay(schedule.days[day])])
    ),
  })
}

export function applyStandardSchedule(): string {
  return serializeWeeklySchedule(STANDARD_WEEKLY_SCHEDULE)
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function calculateTimeRangeMinutes(start: string, end: string, breakMinutes = 0): number {
  const duration = timeToMinutes(end) - timeToMinutes(start) - breakMinutes
  return Math.max(0, duration)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function getMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function getNextMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getScheduleDayMinutes(day: WeeklyScheduleDay): number {
  if (!day.enabled) return 0
  return calculateTimeRangeMinutes(day.start, day.end, day.break_minutes)
}

export function getScheduleWeeklyMinutes(schedule: WeeklySchedule): number {
  return WEEKDAY_IDS.reduce((total, day) => total + getScheduleDayMinutes(schedule.days[day]), 0)
}

export function summarizeWeeklySchedule(schedule: WeeklySchedule): string {
  const enabledDays = WEEKDAY_IDS.filter(day => schedule.days[day].enabled)
  if (enabledDays.length === 0) return 'Kein Standardschedule'

  const totalMinutes = getScheduleWeeklyMinutes(schedule)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const duration = minutes === 0 ? `${hours} Std./Woche` : `${hours} Std. ${minutes} Min./Woche`

  return `${enabledDays.map(day => WEEKDAY_LABELS[day]).join(', ')} · ${duration}`
}

export function buildTimecardEntriesFromSchedule(
  schedule: WeeklySchedule,
  periodStart: string
): TimecardEntryInput[] {
  const start = new Date(`${periodStart}T00:00:00.000Z`)
  return WEEKDAY_IDS.flatMap((day, index) => {
    const scheduleDay = schedule.days[day]
    const duration = getScheduleDayMinutes(scheduleDay)
    if (!scheduleDay.enabled || duration <= 0) return []

    return [{
      work_date: toISODate(addDays(start, index)),
      start_time: scheduleDay.start,
      end_time: scheduleDay.end,
      break_minutes: scheduleDay.break_minutes,
      duration_minutes: duration,
      category: scheduleDay.category,
      description: 'Aus offiziellem Standardschedule',
      source: 'template',
    }]
  })
}

export function buildTimecardEntriesForRange(
  schedule: WeeklySchedule,
  rangeStart: Date,
  rangeEnd: Date
): TimecardEntryInput[] {
  const entries: TimecardEntryInput[] = []
  const cursor = new Date(rangeStart)

  while (cursor < rangeEnd) {
    const weekday = WEEKDAY_IDS[cursor.getUTCDay() === 0 ? 6 : cursor.getUTCDay() - 1]
    const scheduleDay = schedule.days[weekday]
    const duration = getScheduleDayMinutes(scheduleDay)
    if (scheduleDay.enabled && duration > 0) {
      entries.push({
        work_date: toISODate(cursor),
        start_time: scheduleDay.start,
        end_time: scheduleDay.end,
        break_minutes: scheduleDay.break_minutes,
        duration_minutes: duration,
        category: scheduleDay.category,
        description: 'Aus offiziellem Standardschedule',
        source: 'template',
      })
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return entries
}

export function buildTimecardEntriesForMonth(
  schedule: WeeklySchedule,
  monthDate: Date
): TimecardEntryInput[] {
  const monthStart = getMonthStart(monthDate)
  const nextMonthStart = getNextMonthStart(monthDate)
  return buildTimecardEntriesForRange(schedule, monthStart, nextMonthStart)
}
