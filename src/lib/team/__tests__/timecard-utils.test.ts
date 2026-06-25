import { normalizeEntry, normalizeTimeToHHMM } from '@/lib/team/timecard-utils'

describe('normalizeTimeToHHMM', () => {
  it('strips seconds from Postgres TIME values', () => {
    expect(normalizeTimeToHHMM('13:25:00')).toBe('13:25')
    expect(normalizeTimeToHHMM('09:00')).toBe('09:00')
    expect(normalizeTimeToHHMM(null)).toBeNull()
  })
})

describe('normalizeEntry', () => {
  it('normalizes start/end times on entries', () => {
    const entry = normalizeEntry({
      work_date: '2026-06-18',
      start_time: '13:25:00',
      end_time: '13:25:00',
      break_minutes: 0,
      duration_minutes: 1,
      category: 'other',
      source: 'manual',
    })
    expect(entry.start_time).toBe('13:25')
    expect(entry.end_time).toBe('13:25')
  })
})
