import { focusFreshness, FOCUS_STALE_DAYS } from '../focus-freshness'

const NOW = new Date('2026-07-13T12:00:00.000Z')

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('focusFreshness', () => {
  it('returns null when no timestamp is given', () => {
    expect(focusFreshness(null, NOW)).toBeNull()
    expect(focusFreshness(undefined, NOW)).toBeNull()
  })

  it('returns null for an unparseable timestamp', () => {
    expect(focusFreshness('not-a-date', NOW)).toBeNull()
  })

  it('labels today and yesterday', () => {
    expect(focusFreshness(daysAgo(0), NOW)?.label).toBe('heute aktualisiert')
    expect(focusFreshness(daysAgo(1), NOW)?.label).toBe('gestern aktualisiert')
  })

  it('labels a few days and weeks', () => {
    expect(focusFreshness(daysAgo(3), NOW)?.label).toBe('vor 3 Tagen')
    expect(focusFreshness(daysAgo(9), NOW)?.label).toBe('vor einer Woche')
    expect(focusFreshness(daysAgo(21), NOW)?.label).toBe('vor 3 Wochen')
  })

  it('is not stale up to the threshold, stale beyond it', () => {
    expect(focusFreshness(daysAgo(FOCUS_STALE_DAYS), NOW)?.isStale).toBe(false)
    expect(focusFreshness(daysAgo(FOCUS_STALE_DAYS + 1), NOW)?.isStale).toBe(true)
  })

  it('clamps future timestamps to 0 days (never negative)', () => {
    const future = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(focusFreshness(future, NOW)?.days).toBe(0)
  })
})
