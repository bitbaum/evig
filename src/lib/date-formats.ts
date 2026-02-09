/**
 * Date Formatting Utilities
 *
 * SSOT for date formatting across the application.
 * All date formatting should use these functions instead of inline toLocaleDateString.
 *
 * Locale: de-CH (Swiss German) — always use this, never de-DE.
 *
 * Available formats:
 *   formatDate()             → "1. Januar 2026"
 *   formatDateNumeric()      → "01.01.2026"
 *   formatDateShort()        → "1.1.2026" (compact, no zero-padding)
 *   formatDateTime()         → "1. Januar 2026, 14:30"
 *   formatDateTimeNumeric()  → "01.01.2026, 14:30"
 *   formatDateWithWeekday()      → "Montag, 1. Januar 2026"
 *   formatDateTimeWithWeekday()  → "Montag, 1. Januar 2026, 14:30"
 */

const LOCALE = 'de-CH'

function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date
}

/**
 * Format date with long month name: "1. Januar 2026"
 */
export function formatDate(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date compact (locale default): "1.1.2026"
 * Use for inline/table display where space is limited.
 */
export function formatDateShort(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE)
}

/**
 * Format date as numeric: "01.01.2026"
 */
export function formatDateNumeric(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format date with time (long month): "1. Januar 2026, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date with time (numeric): "01.01.2026, 14:30"
 */
export function formatDateTimeNumeric(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date with weekday: "Montag, 1. Januar 2026"
 */
export function formatDateWithWeekday(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date with weekday and time: "Montag, 1. Januar 2026, 14:30"
 */
export function formatDateTimeWithWeekday(date: Date | string): string {
  return toDate(date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
