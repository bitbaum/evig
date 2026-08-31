/**
 * Date Formatting Utilities
 *
 * SSOT for date formatting across the application.
 * All date formatting should use these functions instead of inline toLocaleDateString.
 *
 * Locale: de-CH (Swiss German) by default — never de-DE. Reader-facing i18n
 * surfaces (blog) pass the active app locale to formatDate().
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

/**
 * App locale → BCP-47 date locale. Swiss variants where they exist; de-CH is
 * the default (admin + all non-blog surfaces stay Swiss German).
 */
const DATE_LOCALES: Record<string, string> = {
  de: 'de-CH',
  fr: 'fr-CH',
  it: 'it-CH',
  en: 'en-GB',
  es: 'es-ES',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
};

const LOCALE = DATE_LOCALES.de;

/** Resolve an app locale ('en', 'fr', …) to a date locale; default de-CH. */
function resolveDateLocale(locale?: string): string {
  return (locale && DATE_LOCALES[locale]) || LOCALE;
}

/**
 * Always render in Swiss time. The prod box runs UTC — without an explicit
 * timeZone every server-rendered timestamp is 1-2h off (a 15:00 workshop
 * displayed as 13:00, "today" flipping at 02:00 Swiss time).
 */
const TIME_ZONE = 'Europe/Zurich';

/** Value returned for missing or invalid dates. */
const EMPTY = '';

export type DateInput = Date | string | null | undefined;

/** Coerce input to a valid Date, or null for missing/invalid values. */
function toValidDate(date: DateInput): Date | null {
  if (date == null) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Null-safe core: format a valid date with the given options, else EMPTY. */
function formatWith(
  date: DateInput,
  options: Intl.DateTimeFormatOptions | undefined,
  kind: 'date' | 'time' = 'date',
  locale?: string,
): string {
  const d = toValidDate(date);
  if (!d) return EMPTY;
  const opts = { timeZone: TIME_ZONE, ...options };
  const dateLocale = resolveDateLocale(locale);
  return kind === 'time'
    ? d.toLocaleTimeString(dateLocale, opts)
    : d.toLocaleDateString(dateLocale, opts);
}

/**
 * Format date with long month name: "1. Januar 2026".
 * Pass the active app locale on reader-facing i18n surfaces (blog) so dates
 * follow the page language; without it, dates render Swiss German.
 */
export function formatDate(date: DateInput, locale?: string): string {
  return formatWith(date, { year: 'numeric', month: 'long', day: 'numeric' }, 'date', locale);
}

/**
 * Format date compact (locale default): "1.1.2026"
 * Use for inline/table display where space is limited.
 */
export function formatDateShort(date: DateInput): string {
  return formatWith(date, undefined);
}

/** Format date as numeric: "01.01.2026" */
export function formatDateNumeric(date: DateInput): string {
  return formatWith(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Format date with time (long month): "1. Januar 2026, 14:30" */
export function formatDateTime(date: DateInput): string {
  return formatWith(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format date with time (numeric): "01.01.2026, 14:30" */
export function formatDateTimeNumeric(date: DateInput): string {
  return formatWith(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format date with weekday: "Montag, 1. Januar 2026" */
export function formatDateWithWeekday(date: DateInput): string {
  return formatWith(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
  });
}

/** Format time only: "14:30" */
export function formatTime(date: DateInput): string {
  return formatWith(date, { hour: '2-digit', minute: '2-digit' }, 'time');
}

/** Format month and year: "Januar 2026" */
export function formatDateMonth(date: DateInput): string {
  return formatWith(date, { year: 'numeric', month: 'long' });
}

/** Format short weekday: "Mo" */
export function formatWeekdayShort(date: DateInput): string {
  return formatWith(date, { weekday: 'short' });
}

/** Format date with long weekday, day, and month (no year): "Montag, 1. Januar" */
export function formatDateLong(date: DateInput): string {
  return formatWith(date, { weekday: 'long', day: 'numeric', month: 'long' });
}
