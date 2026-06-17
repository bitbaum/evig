/**
 * Date Formatting Utilities
 *
 * SSOT for date formatting across the application.
 * All date formatting should use these functions instead of inline toLocaleDateString.
 *
 * Locale: de-CH (Swiss German) — always use this, never de-DE.
 *
 * Null-safe: every formatter accepts null/undefined/invalid input and returns
 * an empty string rather than throwing. A single bad/missing date (e.g. a
 * conversation with no messages yet → last_message_at = null) must never crash
 * a whole page render.
 *
 * Available formats:
 *   formatDate()             → "1. Januar 2026"
 *   formatDateNumeric()      → "01.01.2026"
 *   formatDateShort()        → "1.1.2026" (compact, no zero-padding)
 *   formatDateTime()         → "1. Januar 2026, 14:30"
 *   formatDateTimeNumeric()  → "01.01.2026, 14:30"
 *   formatDateWithWeekday()      → "Montag, 1. Januar 2026"
 *   formatDateTimeWithWeekday()  → "Montag, 1. Januar 2026, 14:30"
 *   formatTime()                → "14:30"
 *   formatDateMonth()           → "Januar 2026"
 *   formatWeekdayShort()        → "Mo"
 */

const LOCALE = 'de-CH'

/** Value returned for missing or invalid dates. */
const EMPTY = ''

export type DateInput = Date | string | null | undefined

/** Coerce input to a valid Date, or null for missing/invalid values. */
function toValidDate(date: DateInput): Date | null {
  if (date == null) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return Number.isNaN(d.getTime()) ? null : d
}

/** Null-safe core: format a valid date with the given options, else EMPTY. */
function formatWith(
  date: DateInput,
  options: Intl.DateTimeFormatOptions | undefined,
  kind: 'date' | 'time' = 'date',
): string {
  const d = toValidDate(date)
  if (!d) return EMPTY
  return kind === 'time'
    ? d.toLocaleTimeString(LOCALE, options)
    : d.toLocaleDateString(LOCALE, options)
}

/** Format date with long month name: "1. Januar 2026" */
export function formatDate(date: DateInput): string {
  return formatWith(date, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Format date compact (locale default): "1.1.2026"
 * Use for inline/table display where space is limited.
 */
export function formatDateShort(date: DateInput): string {
  return formatWith(date, undefined)
}

/** Format date as numeric: "01.01.2026" */
export function formatDateNumeric(date: DateInput): string {
  return formatWith(date, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Format date with time (long month): "1. Januar 2026, 14:30" */
export function formatDateTime(date: DateInput): string {
  return formatWith(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format date with time (numeric): "01.01.2026, 14:30" */
export function formatDateTimeNumeric(date: DateInput): string {
  return formatWith(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format date with weekday: "Montag, 1. Januar 2026" */
export function formatDateWithWeekday(date: DateInput): string {
  return formatWith(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Format date with weekday and time: "Montag, 1. Januar 2026, 14:30" */
export function formatDateTimeWithWeekday(date: DateInput): string {
  return formatWith(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format time only: "14:30" */
export function formatTime(date: DateInput): string {
  return formatWith(date, { hour: '2-digit', minute: '2-digit' }, 'time')
}

/** Format month and year: "Januar 2026" */
export function formatDateMonth(date: DateInput): string {
  return formatWith(date, { year: 'numeric', month: 'long' })
}

/** Format short weekday: "Mo" */
export function formatWeekdayShort(date: DateInput): string {
  return formatWith(date, { weekday: 'short' })
}

/** Format date with long weekday, day, and month (no year): "Montag, 1. Januar" */
export function formatDateLong(date: DateInput): string {
  return formatWith(date, { weekday: 'long', day: 'numeric', month: 'long' })
}
