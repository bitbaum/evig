/**
 * Tests for timecard review/reopen wiring onto lifecycle/review-workflow.
 *
 * The lifecycle core owns locking, SQL UPDATE construction and post-commit
 * dispatch. These tests lock the timecard-specific contract: transition
 * tables, guards, stable thrown error codes for routes/bulk review, and event
 * shapes for owner notifications/activity.
 */

const mockRunReviewTransition = jest.fn()

jest.mock('@/lib/lifecycle/review-workflow', () => ({
  runReviewTransition: (opts: unknown) => mockRunReviewTransition(opts),
}))

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
}))

jest.mock('@/db/schema', () => ({
  notifications: {},
  teamProfiles: {},
  timecards: {},
  timecardEntries: {},
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(),
  asc: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  sql: Object.assign(jest.fn(), { raw: jest.fn(), join: jest.fn() }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}))

jest.mock('@/lib/services/notifications', () => ({
  createNotification: jest.fn(),
  notifyUsers: jest.fn(),
}))

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
}))

import { TIMECARD_STATUSES } from '@/config/timecards'
import { reopenTimecard, reviewTimecard } from '../timecards'

const row = {
  status: TIMECARD_STATUSES.SUBMITTED,
  user_id: 'owner-1',
  period_type: 'month',
  period_start: '2026-07-01',
  period_end: '2026-08-01',
  payroll_batch_id: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRunReviewTransition.mockResolvedValue({ ok: false, code: 'not_found' })
})

describe('reviewTimecard workflow wiring', () => {
  it('passes review transitions, guards and notification/activity event builder to the core', async () => {
    await expect(reviewTimecard('reviewer-1', 'card-1', {
      status: TIMECARD_STATUSES.REJECTED,
      review_notes: 'Bitte korrigieren',
    })).rejects.toThrow('timecard_not_found')

    const opts = mockRunReviewTransition.mock.calls[0][0]
    expect(opts.target).toEqual(expect.objectContaining({
      table: 'timecards',
      select: ['user_id', 'period_type', 'period_start', 'period_end', 'payroll_batch_id'],
    }))
    expect(opts.action).toBe(TIMECARD_STATUSES.REJECTED)
    expect(opts.reason).toBe('Bitte korrigieren')
    expect(opts.transitions).toEqual(expect.arrayContaining([
      { action: TIMECARD_STATUSES.APPROVED, from: TIMECARD_STATUSES.SUBMITTED, to: TIMECARD_STATUSES.APPROVED },
      { action: TIMECARD_STATUSES.REJECTED, from: TIMECARD_STATUSES.SUBMITTED, to: TIMECARD_STATUSES.REJECTED },
    ]))
    expect(opts.guards.map((guard: { code: string }) => guard.code)).toEqual(['self_review', 'payroll_locked'])

    const event = opts.emit(row)
    expect(event).toEqual(expect.objectContaining({
      type: 'timecard_reviewed',
      recipients: { userId: 'owner-1' },
      title: 'Zeitkarte benötigt Anpassung',
      related: { type: 'timecard', id: 'card-1' },
      activity: expect.objectContaining({
        actorId: 'reviewer-1',
        action: 'rejected_timecard',
        subjectId: 'card-1',
      }),
    }))
    expect(event.content).toContain('Bitte korrigieren')
  })

  it('maps core failures to the stable thrown error codes used by routes and bulk review', async () => {
    await expect(reviewTimecard('reviewer-1', 'missing', { status: TIMECARD_STATUSES.APPROVED }))
      .rejects.toThrow('timecard_not_found')

    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'guard_failed', guard: 'self_review' })
    await expect(reviewTimecard('owner-1', 'card-1', { status: TIMECARD_STATUSES.APPROVED }))
      .rejects.toThrow('timecard_self_review')

    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'guard_failed', guard: 'payroll_locked' })
    await expect(reviewTimecard('reviewer-1', 'card-1', { status: TIMECARD_STATUSES.APPROVED }))
      .rejects.toThrow('timecard_payroll_locked')

    mockRunReviewTransition.mockResolvedValueOnce({ ok: false, code: 'conflict' })
    await expect(reviewTimecard('reviewer-1', 'card-1', { status: TIMECARD_STATUSES.APPROVED }))
      .rejects.toThrow('timecard_not_submitted')
  })
})

describe('reopenTimecard workflow wiring', () => {
  it('clears review/submission metadata and emits notification plus activity for non-owner reopen', async () => {
    await expect(reopenTimecard('card-1', 'reviewer-1')).rejects.toThrow('timecard_not_found')

    const opts = mockRunReviewTransition.mock.calls[0][0]
    expect(opts.action).toBe('reopen')
    expect(opts.guards.map((guard: { code: string }) => guard.code)).toEqual(['payroll_locked'])
    expect(opts.write.reopen).toEqual(expect.objectContaining({
      reviewer: 'clear',
      reason: 'clear',
    }))
    expect(opts.write.reopen.extra()).toEqual({ submitted_at: null })

    const event = opts.emit(row)
    expect(event).toEqual(expect.objectContaining({
      type: 'timecard_reviewed',
      recipients: { userId: 'owner-1' },
      title: 'Zeitkarte wieder geöffnet',
      related: { type: 'timecard', id: 'card-1' },
      activity: expect.objectContaining({
        actorId: 'reviewer-1',
        action: 'reopened_timecard',
      }),
    }))
  })

  it('emits activity-only when the owner reopens their own card', async () => {
    await expect(reopenTimecard('card-1', 'owner-1')).rejects.toThrow('timecard_not_found')
    const opts = mockRunReviewTransition.mock.calls[0][0]
    const event = opts.emit(row)
    expect(event.recipients).toBeUndefined()
    expect(event.title).toBeUndefined()
    expect(event.activity).toEqual(expect.objectContaining({
      actorId: 'owner-1',
      action: 'reopened_timecard',
    }))
  })
})
