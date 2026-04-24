/**
 * Tests for lib/utils.ts
 *
 * cn: Tailwind class merging utility used pervasively in components.
 *     Wrong merge = conflicting/duplicate CSS classes silently reaching the DOM.
 * formatRelativeTime: Drives "ago" timestamps in the UI (German locale).
 *     Wrong output = users see incorrect recency information.
 */

jest.useFakeTimers()

import { cn, formatRelativeTime } from '../utils'

// Pin "now" to a fixed moment for reproducible relative-time assertions
const NOW = new Date('2026-05-15T10:00:00.000Z')
beforeAll(() => jest.setSystemTime(NOW))
afterAll(() => jest.useRealTimers())

// ============================================================================
// cn — Tailwind class merging
// ============================================================================

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('joins multiple classes with a space', () => {
    expect(cn('text-red-500', 'bg-white')).toBe('text-red-500 bg-white')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge resolves text-size conflicts: last one wins
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('deduplicates conflicting background classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('handles conditional classes (false/null/undefined filtered out)', () => {
    expect(cn('text-sm', false && 'hidden', null, undefined)).toBe('text-sm')
  })

  it('handles array of classes via clsx', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold')
  })

  it('handles object syntax (clsx: key = class, value = condition)', () => {
    expect(cn({ 'text-sm': true, 'font-bold': false })).toBe('text-sm')
  })

  it('returns empty string when no classes provided', () => {
    expect(cn()).toBe('')
  })

  it('returns empty string when all inputs are falsy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })

  it('merges padding conflicts correctly', () => {
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
  })

  it('handles complex real-world combination', () => {
    const result = cn(
      'rounded-lg border',
      true && 'bg-primary-600',
      false && 'bg-secondary-500',
      'text-white',
    )
    expect(result).toBe('rounded-lg border bg-primary-600 text-white')
  })
})

// ============================================================================
// formatRelativeTime — German relative timestamps
// ============================================================================

describe('formatRelativeTime — just now', () => {
  it('returns "Gerade eben" for the current moment', () => {
    expect(formatRelativeTime(NOW.toISOString())).toBe('Gerade eben')
  })

  it('returns "Gerade eben" for 30 seconds ago', () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30 * 1000).toISOString()
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('Gerade eben')
  })

  it('returns "Gerade eben" for 59 seconds ago', () => {
    const fiftyNineSecondsAgo = new Date(NOW.getTime() - 59 * 1000).toISOString()
    expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('Gerade eben')
  })
})

describe('formatRelativeTime — minutes', () => {
  it('returns "vor 1 Min." for 1 minute ago', () => {
    const oneMinAgo = new Date(NOW.getTime() - 60 * 1000).toISOString()
    expect(formatRelativeTime(oneMinAgo)).toBe('vor 1 Min.')
  })

  it('returns "vor 5 Min." for 5 minutes ago', () => {
    const fiveMinAgo = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe('vor 5 Min.')
  })

  it('returns "vor 59 Min." for 59 minutes ago', () => {
    const fiftyNineMinAgo = new Date(NOW.getTime() - 59 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiftyNineMinAgo)).toBe('vor 59 Min.')
  })
})

describe('formatRelativeTime — hours', () => {
  it('returns "vor 1 Std." for 1 hour ago', () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(oneHourAgo)).toBe('vor 1 Std.')
  })

  it('returns "vor 3 Std." for 3 hours ago', () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe('vor 3 Std.')
  })

  it('returns "vor 23 Std." for 23 hours ago', () => {
    const twentyThreeHoursAgo = new Date(NOW.getTime() - 23 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('vor 23 Std.')
  })
})

describe('formatRelativeTime — days', () => {
  it('returns "vor 1 Tag" (singular) for 1 day ago', () => {
    const oneDayAgo = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(oneDayAgo)).toBe('vor 1 Tag')
  })

  it('returns "vor 2 Tagen" (plural) for 2 days ago', () => {
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twoDaysAgo)).toBe('vor 2 Tagen')
  })

  it('returns "vor 6 Tagen" for 6 days ago', () => {
    const sixDaysAgo = new Date(NOW.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(sixDaysAgo)).toBe('vor 6 Tagen')
  })
})

describe('formatRelativeTime — beyond 7 days', () => {
  it('returns a localized date string for 7+ days ago', () => {
    const sevenDaysAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelativeTime(sevenDaysAgo)
    // Falls back to toLocaleDateString('de-CH') — contains the year
    expect(result).toContain('2026')
  })

  it('returns a string for 30 days ago', () => {
    const thirtyDaysAgo = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelativeTime(thirtyDaysAgo)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
