/**
 * Tests for time-off review — pilot A of the shared review-workflow core.
 *
 * The core's lock/UPDATE/dispatch behavior is covered by
 * src/lib/lifecycle/__tests__/review-workflow.test.ts. THESE tests lock the
 * service's wiring: transition table + action mapping, reason pass-through,
 * the null-on-any-failure route contract, and the requester notification
 * event shape.
 */

const mockRunReviewTransition = jest.fn()
jest.mock('@/lib/lifecycle/review-workflow', () => ({
  runReviewTransition: (opts: unknown) => mockRunReviewTransition(opts),
}))

const mockQuery = jest.fn()
jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: jest.fn(),
}))

jest.mock('@/lib/team/timecard-approvers', () => ({
  getTimecardApproverIds: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}))

import { reviewTimeOffRequest } from '../time-off'
import { TIME_OFF_STATUSES } from '@/config/time-off'

const FULL_ROW = {
  id: 'req-1', user_id: 'u1', kind: 'ferien', status: 'approved',
  starts_on: '2026-07-10', ends_on: '2026-07-14',
  user_name: 'Mira', user_email: 'mira@example.ch',
}

describe('reviewTimeOffRequest (pilot A wiring)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQuery.mockResolvedValue({ rows: [FULL_ROW] })
  })

  it('maps approved-status input to the approve action with the reviewer as actor', async () => {
    mockRunReviewTransition.mockResolvedValue({ ok: true, row: { user_id: 'u1' }, from: 'pending', to: 'approved' })
    await reviewTimeOffRequest('admin-1', 'req-1', {
      status: TIME_OFF_STATUSES.APPROVED, review_notes: 'ok',
    } as never)

    const opts = mockRunReviewTransition.mock.calls[0][0]
    expect(opts.action).toBe('approve')
    expect(opts.actor).toEqual({ id: 'admin-1' })
    expect(opts.reason).toBe('ok')
    expect(opts.id).toBe('req-1')
    expect(opts.transitions).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'approve', from: 'pending', to: 'approved' }),
      expect.objectContaining({ action: 'reject', from: 'pending', to: 'rejected' }),
    ]))
  })

  it('returns the re-fetched joined row on success', async () => {
    mockRunReviewTransition.mockResolvedValue({ ok: true, row: { user_id: 'u1' }, from: 'pending', to: 'approved' })
    const result = await reviewTimeOffRequest('admin-1', 'req-1', {
      status: TIME_OFF_STATUSES.APPROVED,
    } as never)
    expect(result).toEqual(FULL_ROW)
  })

  it('returns null on EVERY failure code (the route 404 contract)', async () => {
    for (const failure of [
      { ok: false, code: 'not_found' },
      { ok: false, code: 'invalid_transition', reason: 'wrong_state', from: 'approved' },
      { ok: false, code: 'conflict' },
    ]) {
      mockRunReviewTransition.mockResolvedValueOnce(failure)
      const result = await reviewTimeOffRequest('admin-1', 'req-1', {
        status: TIME_OFF_STATUSES.REJECTED,
      } as never)
      expect(result).toBeNull()
    }
  })

  it('emit builds the requester notification from the joined row', async () => {
    mockRunReviewTransition.mockResolvedValue({ ok: true, row: { user_id: 'u1' }, from: 'pending', to: 'rejected' })
    await reviewTimeOffRequest('admin-1', 'req-1', {
      status: TIME_OFF_STATUSES.REJECTED, review_notes: 'zu kurzfristig',
    } as never)

    const opts = mockRunReviewTransition.mock.calls[0][0]
    const event = await opts.emit({ user_id: 'u1', status: 'rejected' }, { from: 'pending', to: 'rejected', action: 'reject' })
    expect(event).toEqual(expect.objectContaining({
      type: 'time_off_reviewed',
      recipients: { userId: 'u1' },
      title: 'Abwesenheit abgelehnt',
      related: { type: 'time_off', id: 'req-1' },
    }))
    expect(event.content).toContain('zu kurzfristig')
  })
})
