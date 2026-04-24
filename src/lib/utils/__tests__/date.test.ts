/**
 * Tests for formatDeadline in lib/utils/date.ts
 *
 * formatDeadline drives urgency display in task/request cards — wrong
 * output means users see incorrect time-remaining information.
 * Uses fake timers to pin "now" for reproducible assertions.
 */

jest.useFakeTimers()

import { formatDeadline } from '../date'

// Pin current time to 2026-01-15T12:00:00.000Z
const NOW = new Date('2026-01-15T12:00:00.000Z')

beforeAll(() => {
  jest.setSystemTime(NOW)
})

afterAll(() => {
  jest.useRealTimers()
})

// ============================================================================
// Null / missing input
// ============================================================================

describe('formatDeadline — null / missing', () => {
  it('returns em dash for null', () => {
    expect(formatDeadline(null)).toBe('–')
  })

  it('returns em dash for empty string', () => {
    expect(formatDeadline('')).toBe('–')
  })
})

// ============================================================================
// Expired deadlines
// ============================================================================

describe('formatDeadline — expired', () => {
  it('returns "Abgelaufen" for a deadline in the past', () => {
    const past = new Date(NOW.getTime() - 1000).toISOString()
    expect(formatDeadline(past)).toBe('Abgelaufen')
  })

  it('returns "Abgelaufen" for a date well in the past', () => {
    const pastDay = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(pastDay)).toBe('Abgelaufen')
  })
})

// ============================================================================
// Hours remaining (< 24h)
// ============================================================================

describe('formatDeadline — hours format', () => {
  it('returns "Xh" for a deadline less than 24 hours away', () => {
    const inThreeHours = new Date(NOW.getTime() + 3 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(inThreeHours)).toBe('3h')
  })

  it('returns "1h" for exactly 1 hour remaining', () => {
    const inOneHour = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString()
    expect(formatDeadline(inOneHour)).toBe('1h')
  })

  it('returns "0h" for a deadline within the hour (but not expired)', () => {
    const inFewMinutes = new Date(NOW.getTime() + 30 * 60 * 1000).toISOString()
    expect(formatDeadline(inFewMinutes)).toBe('0h')
  })

  it('returns "23h" for a deadline 23+ hours away', () => {
    const in23h = new Date(NOW.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000).toISOString()
    expect(formatDeadline(in23h)).toBe('23h')
  })
})

// ============================================================================
// Days remaining (≥ 24h)
// ============================================================================

describe('formatDeadline — days format', () => {
  it('returns "1d" for exactly 24 hours remaining', () => {
    const in24h = new Date(NOW.getTime() + 24 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(in24h)).toBe('1d')
  })

  it('returns "3d" for 3 days remaining', () => {
    const in3d = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(in3d)).toBe('3d')
  })

  it('returns "7d" for 7 days remaining', () => {
    const in7d = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(in7d)).toBe('7d')
  })

  it('returns "30d" for 30 days remaining', () => {
    const in30d = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatDeadline(in30d)).toBe('30d')
  })
})
