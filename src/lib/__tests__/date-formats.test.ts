/**
 * Tests for date formatting utilities (lib/date-formats.ts)
 *
 * date-formats.ts is the SSOT for all date display across the platform.
 * Bugs here affect every date shown to users in every locale.
 * The locale is fixed at 'de-CH' (Swiss German) — tests verify the exact
 * output rather than "contains year" to catch locale regressions.
 *
 * Reference date: Friday, 15 May 2026 at 14:30 local time.
 * Using noon avoids timezone-boundary issues (new Date(2026, 4, 15, 14, 30)).
 *
 * Covers: formatDate, formatDateShort, formatDateNumeric, formatDateTime,
 *         formatDateTimeNumeric, formatDateWithWeekday, formatDateTimeWithWeekday,
 *         formatTime, formatDateMonth, formatWeekdayShort, formatDateLong.
 */

import {
  formatDate,
  formatDateShort,
  formatDateNumeric,
  formatDateTime,
  formatDateTimeNumeric,
  formatDateWithWeekday,
  formatDateTimeWithWeekday,
  formatTime,
  formatDateMonth,
  formatWeekdayShort,
  formatDateLong,
} from '../date-formats'

// Reference date: Friday 15 May 2026 at 14:30 local time
const REF_DATE = new Date(2026, 4, 15, 14, 30, 0)
const REF_STRING = REF_DATE.toISOString()

// Second reference: 1 January 2026 (Wednesday) for month boundary tests
const JAN_DATE = new Date(2026, 0, 1, 12, 0, 0)

// ============================================================================
// formatDate — "15. Mai 2026"
// ============================================================================

describe('formatDate', () => {
  it('formats Date object to "15. Mai 2026"', () => {
    expect(formatDate(REF_DATE)).toBe('15. Mai 2026')
  })

  it('accepts ISO string input', () => {
    expect(formatDate(REF_STRING)).toBe('15. Mai 2026')
  })

  it('formats January correctly', () => {
    expect(formatDate(JAN_DATE)).toBe('1. Januar 2026')
  })

  it('returns a string', () => {
    expect(typeof formatDate(REF_DATE)).toBe('string')
  })

  it('contains the year', () => {
    expect(formatDate(REF_DATE)).toContain('2026')
  })
})

// ============================================================================
// formatDateShort — "15.5.2026" (compact, no zero-padding)
// ============================================================================

describe('formatDateShort', () => {
  it('formats Date object to "15.5.2026"', () => {
    expect(formatDateShort(REF_DATE)).toBe('15.5.2026')
  })

  it('accepts string input', () => {
    expect(formatDateShort(REF_STRING)).toBe('15.5.2026')
  })

  it('formats 1 January without zero-padding', () => {
    expect(formatDateShort(JAN_DATE)).toBe('1.1.2026')
  })

  it('uses dot separators (not slashes)', () => {
    expect(formatDateShort(REF_DATE)).toContain('.')
    expect(formatDateShort(REF_DATE)).not.toContain('/')
  })
})

// ============================================================================
// formatDateNumeric — "15.05.2026" (zero-padded)
// ============================================================================

describe('formatDateNumeric', () => {
  it('formats to "15.05.2026" with zero-padding', () => {
    expect(formatDateNumeric(REF_DATE)).toBe('15.05.2026')
  })

  it('accepts string input', () => {
    expect(formatDateNumeric(REF_STRING)).toBe('15.05.2026')
  })

  it('zero-pads month for January', () => {
    expect(formatDateNumeric(JAN_DATE)).toBe('01.01.2026')
  })

  it('uses dot separators', () => {
    expect(formatDateNumeric(REF_DATE)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })
})

// ============================================================================
// formatDateTime — "15. Mai 2026 um 14:30"
// ============================================================================

describe('formatDateTime', () => {
  it('includes date and time', () => {
    const result = formatDateTime(REF_DATE)
    expect(result).toContain('15. Mai 2026')
    expect(result).toContain('14:30')
  })

  it('accepts string input', () => {
    const result = formatDateTime(REF_STRING)
    expect(result).toContain('2026')
  })

  it('returns a string', () => {
    expect(typeof formatDateTime(REF_DATE)).toBe('string')
  })
})

// ============================================================================
// formatDateTimeNumeric — "15.05.2026, 14:30"
// ============================================================================

describe('formatDateTimeNumeric', () => {
  it('includes numeric date and time', () => {
    const result = formatDateTimeNumeric(REF_DATE)
    expect(result).toContain('15.05.2026')
    expect(result).toContain('14:30')
  })

  it('accepts string input', () => {
    const result = formatDateTimeNumeric(REF_STRING)
    expect(result).toContain('2026')
  })
})

// ============================================================================
// formatDateWithWeekday — "Freitag, 15. Mai 2026"
// ============================================================================

describe('formatDateWithWeekday', () => {
  it('formats to "Freitag, 15. Mai 2026"', () => {
    expect(formatDateWithWeekday(REF_DATE)).toBe('Freitag, 15. Mai 2026')
  })

  it('accepts string input', () => {
    expect(formatDateWithWeekday(REF_STRING)).toBe('Freitag, 15. Mai 2026')
  })

  it('formats Wednesday January 1', () => {
    expect(formatDateWithWeekday(JAN_DATE)).toBe('Donnerstag, 1. Januar 2026')
  })

  it('starts with German weekday name', () => {
    const germanWeekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
    const result = formatDateWithWeekday(REF_DATE)
    expect(germanWeekdays.some(day => result.startsWith(day))).toBe(true)
  })
})

// ============================================================================
// formatDateTimeWithWeekday — "Freitag, 15. Mai 2026 um 14:30"
// ============================================================================

describe('formatDateTimeWithWeekday', () => {
  it('includes weekday, date, and time', () => {
    const result = formatDateTimeWithWeekday(REF_DATE)
    expect(result).toContain('Freitag')
    expect(result).toContain('15. Mai 2026')
    expect(result).toContain('14:30')
  })

  it('accepts string input', () => {
    const result = formatDateTimeWithWeekday(REF_STRING)
    expect(result).toContain('2026')
  })
})

// ============================================================================
// formatTime — "14:30"
// ============================================================================

describe('formatTime', () => {
  it('formats to "14:30"', () => {
    expect(formatTime(REF_DATE)).toBe('14:30')
  })

  it('accepts string input', () => {
    expect(formatTime(REF_STRING)).toBe('14:30')
  })

  it('uses colon separator', () => {
    expect(formatTime(REF_DATE)).toMatch(/^\d{2}:\d{2}$/)
  })

  it('zero-pads hours and minutes', () => {
    const earlyMorning = new Date(2026, 4, 15, 9, 5, 0)
    expect(formatTime(earlyMorning)).toBe('09:05')
  })
})

// ============================================================================
// formatDateMonth — "Mai 2026"
// ============================================================================

describe('formatDateMonth', () => {
  it('formats to "Mai 2026"', () => {
    expect(formatDateMonth(REF_DATE)).toBe('Mai 2026')
  })

  it('accepts string input', () => {
    expect(formatDateMonth(REF_STRING)).toBe('Mai 2026')
  })

  it('formats January correctly', () => {
    expect(formatDateMonth(JAN_DATE)).toBe('Januar 2026')
  })

  it('contains the year', () => {
    expect(formatDateMonth(REF_DATE)).toContain('2026')
  })

  it('does not include day', () => {
    // Should not contain "15" (the day)
    expect(formatDateMonth(REF_DATE)).not.toContain('15')
  })
})

// ============================================================================
// formatWeekdayShort — "Fr"
// ============================================================================

describe('formatWeekdayShort', () => {
  it('formats Friday as "Fr"', () => {
    expect(formatWeekdayShort(REF_DATE)).toBe('Fr')
  })

  it('accepts string input', () => {
    expect(formatWeekdayShort(REF_STRING)).toBe('Fr')
  })

  it('formats Thursday as "Do" (Donnerstag)', () => {
    expect(formatWeekdayShort(JAN_DATE)).toBe('Do')
  })

  it('returns a short string (2-3 chars)', () => {
    const result = formatWeekdayShort(REF_DATE)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result.length).toBeLessThanOrEqual(3)
  })
})

// ============================================================================
// formatDateLong — "Freitag, 15. Mai" (no year)
// ============================================================================

describe('formatDateLong', () => {
  it('formats to "Freitag, 15. Mai" without year', () => {
    expect(formatDateLong(REF_DATE)).toBe('Freitag, 15. Mai')
  })

  it('accepts string input', () => {
    expect(formatDateLong(REF_STRING)).toBe('Freitag, 15. Mai')
  })

  it('does not include the year', () => {
    expect(formatDateLong(REF_DATE)).not.toContain('2026')
  })

  it('includes the weekday', () => {
    expect(formatDateLong(REF_DATE)).toContain('Freitag')
  })

  it('includes the month name', () => {
    expect(formatDateLong(REF_DATE)).toContain('Mai')
  })
})

// ============================================================================
// String input acceptance (all functions)
// ============================================================================

describe('string input acceptance', () => {
  const iso = new Date(2026, 4, 15, 14, 30, 0).toISOString()

  const formatters = [
    { name: 'formatDate', fn: formatDate },
    { name: 'formatDateShort', fn: formatDateShort },
    { name: 'formatDateNumeric', fn: formatDateNumeric },
    { name: 'formatDateMonth', fn: formatDateMonth },
    { name: 'formatWeekdayShort', fn: formatWeekdayShort },
  ]

  for (const { name, fn } of formatters) {
    it(`${name} returns same result for Date and ISO string`, () => {
      expect(fn(new Date(2026, 4, 15, 14, 30, 0))).toBe(fn(iso))
    })
  }
})
