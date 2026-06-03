/**
 * Tests for timecard Zod schemas (lib/schemas/timecards.ts)
 *
 * Timecards track staff work and approval state. Validation keeps the future
 * manual UI, AI assist flow, and admin review API on one contract.
 */

import {
  reviewTimecardSchema,
  timecardAssistSchema,
  timecardDraftSchema,
  timecardEntrySchema,
  timecardFilterSchema,
} from '../timecards'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  TIMECARD_ENTRY_SOURCE_OPTIONS,
  TIMECARD_LIMITS,
  TIMECARD_STATUSES,
} from '@/config/timecards'

describe('timecardEntrySchema', () => {
  const baseEntry = {
    work_date: '2026-05-11',
    duration_minutes: 480,
  }

  it('accepts a minimal valid entry', () => {
    const result = timecardEntrySchema.safeParse(baseEntry)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('other')
      expect(result.data.source).toBe('manual')
      expect(result.data.break_minutes).toBe(0)
    }
  })

  it('accepts every configured category', () => {
    for (const category of TIMECARD_ENTRY_CATEGORY_OPTIONS) {
      expect(timecardEntrySchema.safeParse({ ...baseEntry, category }).success).toBe(true)
    }
  })

  it('accepts every configured source', () => {
    for (const source of TIMECARD_ENTRY_SOURCE_OPTIONS) {
      expect(timecardEntrySchema.safeParse({ ...baseEntry, source }).success).toBe(true)
    }
  })

  it('rejects invalid time format', () => {
    const result = timecardEntrySchema.safeParse({ ...baseEntry, start_time: '9:00' })
    expect(result.success).toBe(false)
  })

  it('rejects duration above the entry limit', () => {
    const result = timecardEntrySchema.safeParse({
      ...baseEntry,
      duration_minutes: TIMECARD_LIMITS.MAX_ENTRY_MINUTES + 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID task links', () => {
    const result = timecardEntrySchema.safeParse({ ...baseEntry, task_id: 'task-1' })
    expect(result.success).toBe(false)
  })
})

describe('timecardDraftSchema', () => {
  it('accepts a weekly draft with entries', () => {
    const result = timecardDraftSchema.safeParse({
      period_start: '2026-05-11',
      period_end: '2026-05-17',
      entries: [{ work_date: '2026-05-11', duration_minutes: 420, category: 'repair' }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.period_type).toBe('week')
      expect(result.data.status).toBe(TIMECARD_STATUSES.DRAFT)
    }
  })

  it('rejects too many entries', () => {
    const entries = Array.from({ length: TIMECARD_LIMITS.MAX_PERIOD_ENTRIES + 1 }, () => ({
      work_date: '2026-05-11',
      duration_minutes: 60,
    }))
    const result = timecardDraftSchema.safeParse({
      period_start: '2026-05-11',
      period_end: '2026-05-17',
      entries,
    })
    expect(result.success).toBe(false)
  })
})

describe('reviewTimecardSchema', () => {
  it('accepts approve and reject statuses only', () => {
    expect(reviewTimecardSchema.safeParse({ status: TIMECARD_STATUSES.APPROVED }).success).toBe(true)
    expect(reviewTimecardSchema.safeParse({ status: TIMECARD_STATUSES.REJECTED }).success).toBe(true)
    expect(reviewTimecardSchema.safeParse({ status: TIMECARD_STATUSES.SUBMITTED }).success).toBe(false)
  })
})

describe('timecardAssistSchema', () => {
  it('requires a prompt and period bounds', () => {
    const result = timecardAssistSchema.safeParse({
      prompt: 'Normale Woche ausfüllen',
      period_start: '2026-05-11',
      period_end: '2026-05-17',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty prompt', () => {
    const result = timecardAssistSchema.safeParse({
      prompt: '',
      period_start: '2026-05-11',
      period_end: '2026-05-17',
    })
    expect(result.success).toBe(false)
  })
})

describe('timecardFilterSchema', () => {
  it('defaults status to all', () => {
    const result = timecardFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('all')
  })

  it('rejects invalid status filters', () => {
    const result = timecardFilterSchema.safeParse({ status: 'done' })
    expect(result.success).toBe(false)
  })
})
