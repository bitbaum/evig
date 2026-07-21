/**
 * Weekly schedule model + pure date/time math. No dependencies.
 *
 * A schedule says WHICH weekdays are worked and the clock hours per day. The
 * saldo engine reads the enabled weekdays to distribute the weekly target
 * (Soll) and to know a day's expected hours.
 */

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

export interface WeeklyScheduleDay {
  enabled: boolean
  /** 'HH:MM' */
  start: string
  /** 'HH:MM' */
  end: string
  break_minutes: number
  /** Free-form category of the work done on this day (e.g. 'admin'). */
  category: string
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
  category: 'work',
}

export const EMPTY_WEEKLY_SCHEDULE: WeeklySchedule = {
  version: 1,
  days: Object.fromEntries(
    WEEKDAY_IDS.map(day => [day, { ...DEFAULT_DAY }]),
  ) as Record<WeekdayId, WeeklyScheduleDay>,
}

const WEEKDAYS_MON_FRI: WeekdayId[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export const STANDARD_WEEKLY_SCHEDULE: WeeklySchedule = {
  version: 1,
  days: Object.fromEntries(
    WEEKDAY_IDS.map(day => [day, { ...DEFAULT_DAY, enabled: WEEKDAYS_MON_FRI.includes(day) }]),
  ) as Record<WeekdayId, WeeklyScheduleDay>,
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)
}

function normalizeDay(input: unknown): WeeklyScheduleDay {
  if (!input || typeof input !== 'object') return { ...DEFAULT_DAY }
  const day = input as Partial<WeeklyScheduleDay>
  return {
    enabled: day.enabled === true,
    start: isTime(day.start) ? day.start : DEFAULT_DAY.start,
    end: isTime(day.end) ? day.end : DEFAULT_DAY.end,
    break_minutes: Number.isInteger(day.break_minutes)
      ? Math.max(0, Math.min(240, day.break_minutes as number))
      : DEFAULT_DAY.break_minutes,
    category: typeof day.category === 'string' && day.category ? day.category : DEFAULT_DAY.category,
  }
}

/** Parse a stored JSON schedule (tolerant — bad input → empty schedule). */
export function parseWeeklySchedule(value: string | null | undefined): WeeklySchedule {
  if (!value) return structuredCloneSchedule(EMPTY_WEEKLY_SCHEDULE)
  try {
    const parsed = JSON.parse(value) as Partial<WeeklySchedule>
    if (parsed.version !== 1 || !parsed.days || typeof parsed.days !== 'object') {
      return structuredCloneSchedule(EMPTY_WEEKLY_SCHEDULE)
    }
    return {
      version: 1,
      days: Object.fromEntries(
        WEEKDAY_IDS.map(day => [day, normalizeDay(parsed.days?.[day])]),
      ) as Record<WeekdayId, WeeklyScheduleDay>,
    }
  } catch {
    return structuredCloneSchedule(EMPTY_WEEKLY_SCHEDULE)
  }
}

export function serializeWeeklySchedule(schedule: WeeklySchedule): string {
  return JSON.stringify({
    version: 1,
    days: Object.fromEntries(WEEKDAY_IDS.map(day => [day, normalizeDay(schedule.days[day])])),
  })
}

function structuredCloneSchedule(schedule: WeeklySchedule): WeeklySchedule {
  return {
    version: 1,
    days: Object.fromEntries(
      WEEKDAY_IDS.map(day => [day, { ...schedule.days[day] }]),
    ) as Record<WeekdayId, WeeklyScheduleDay>,
  }
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

/** Worked minutes for a time range minus the break (never negative). */
export function calculateTimeRangeMinutes(start: string, end: string, breakMinutes = 0): number {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start) - breakMinutes)
}

/** Scheduled minutes for one weekday (0 when disabled). */
export function getScheduleDayMinutes(day: WeeklyScheduleDay): number {
  if (!day.enabled) return 0
  return calculateTimeRangeMinutes(day.start, day.end, day.break_minutes)
}

/** Total scheduled minutes across the week. */
export function getScheduleWeeklyMinutes(schedule: WeeklySchedule): number {
  return WEEKDAY_IDS.reduce((total, day) => total + getScheduleDayMinutes(schedule.days[day]), 0)
}

/** ISO date (or Date) → weekday id (Monday-first). */
export function weekdayIdFromDate(date: Date | string): WeekdayId {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00.000Z`) : date
  const wd = d.getUTCDay() // 0 = Sunday
  return WEEKDAY_IDS[wd === 0 ? 6 : wd - 1]
}
