import {
  formatSnapshotDate,
  isUpcyclingSubNavActive,
  pickNextDeadline,
} from '@/lib/domain/upcycling-status-helpers'
import type { MilestoneKey } from '@/data/upcycling-status'

const ITEMS = [
  { key: 'lca-final' as MilestoneKey, label: 'LCA report' },
  { key: 'swico' as MilestoneKey, label: 'Swico presentation' },
]

describe('pickNextDeadline', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-06-10T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the soonest future deadline', () => {
    const result = pickNextDeadline(
      { 'lca-final': '2026-06-18', swico: '2026-07-03' } as Record<MilestoneKey, string | null>,
      ITEMS,
    )
    expect(result?.key).toBe('lca-final')
    expect(result?.daysLeft).toBe(8)
  })

  it('returns null when no milestones are dated', () => {
    expect(
      pickNextDeadline(
        { 'lca-final': null, swico: null } as Record<MilestoneKey, string | null>,
        ITEMS,
      ),
    ).toBeNull()
  })
})

describe('formatSnapshotDate', () => {
  it('formats using the requested locale', () => {
    expect(formatSnapshotDate('2026-06-08', 'de-CH')).toMatch(/8/)
    expect(formatSnapshotDate('2026-06-08', 'en-US')).toMatch(/8/)
  })
})

describe('isUpcyclingSubNavActive', () => {
  it('highlights build-your-own for guide routes', () => {
    expect(isUpcyclingSubNavActive(
      '/projects/upcycling/lenovo-l2251pwd',
      '/projects/upcycling/build-your-own',
    )).toBe(true)
  })

  it('only highlights overview on exact landing path', () => {
    expect(isUpcyclingSubNavActive(
      '/projects/upcycling/applications',
      '/projects/upcycling',
    )).toBe(false)
  })
})
