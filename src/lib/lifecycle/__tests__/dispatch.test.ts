/**
 * Tests for lifecycle/dispatch.ts — the single side-effect fan-out.
 *
 * Behaviors locked:
 *   - recipient shapes route correctly (userId / userIds / resolve / allStaff)
 *   - zero recipients: notify skipped, but dedupe delete STILL runs
 *     (timecard-resubmit contract)
 *   - never throws: each channel failing alone is logged and the others run
 *   - activity + audit channels fire when present
 */

const mockDelete = jest.fn()
jest.mock('@/db', () => ({
  db: {
    delete: jest.fn(() => ({ where: mockDelete })),
  },
}))

jest.mock('@/db/schema', () => ({
  notifications: { relatedId: { name: 'related_id' }, type: { name: 'type' } },
}))

jest.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, val: unknown) => ({ eq: [col, val] }),
}))

const mockNotifyUsers = jest.fn().mockResolvedValue(undefined)
const mockNotifyAllStaff = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: (ids: string[], payload: unknown) => mockNotifyUsers(ids, payload),
  notifyAllStaff: (payload: unknown, exclude?: string) => mockNotifyAllStaff(payload, exclude),
}))

const mockLogActivity = jest.fn()
jest.mock('@/lib/activity', () => ({
  logActivity: (params: unknown) => mockLogActivity(params),
}))

const mockLogContentDecision = jest.fn()
jest.mock('@/lib/auth/audit', () => ({
  logContentDecision: (...args: unknown[]) => mockLogContentDecision(...args),
}))

const mockWarn = jest.fn()
jest.mock('@/lib/logger', () => ({
  logger: { warn: (...args: unknown[]) => mockWarn(...args), error: jest.fn(), info: jest.fn() },
}))

import { dispatchWorkflowEvent } from '../dispatch'

const base = { type: 'test_event', title: 'T', content: 'C' }

describe('dispatchWorkflowEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDelete.mockResolvedValue(undefined)
    mockNotifyUsers.mockResolvedValue(undefined)
  })

  it('routes single userId through notifyUsers', async () => {
    await dispatchWorkflowEvent({ ...base, recipients: { userId: 'u1' } })
    expect(mockNotifyUsers).toHaveBeenCalledWith(['u1'], expect.objectContaining({ type: 'test_event' }))
  })

  it('routes resolve() recipients', async () => {
    await dispatchWorkflowEvent({ ...base, recipients: { resolve: async () => ['a', 'b'] } })
    expect(mockNotifyUsers).toHaveBeenCalledWith(['a', 'b'], expect.anything())
  })

  it('routes allStaff with exclusion through notifyAllStaff', async () => {
    await dispatchWorkflowEvent({ ...base, recipients: { allStaff: true, excludeUserId: 'me' } })
    expect(mockNotifyAllStaff).toHaveBeenCalledWith(expect.anything(), 'me')
    expect(mockNotifyUsers).not.toHaveBeenCalled()
  })

  it('zero recipients: skips notify but STILL runs the dedupe delete', async () => {
    await dispatchWorkflowEvent({
      ...base,
      recipients: { userIds: [] },
      dedupe: { relatedId: 'card-1', type: 'timecard_submitted' },
    })
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockNotifyUsers).not.toHaveBeenCalled()
  })

  it('allows activity-only events without inventing a notification recipient', async () => {
    await dispatchWorkflowEvent({
      type: 'timecard_reviewed',
      activity: { actorId: 'a1', action: 'reopened_timecard' },
    })
    expect(mockNotifyUsers).not.toHaveBeenCalled()
    expect(mockNotifyAllStaff).not.toHaveBeenCalled()
    expect(mockLogActivity).toHaveBeenCalledWith({ actorId: 'a1', action: 'reopened_timecard' })
  })

  it('a failing notify channel is logged and does not stop activity/audit', async () => {
    mockNotifyUsers.mockRejectedValue(new Error('smtp down'))
    await expect(dispatchWorkflowEvent({
      ...base,
      recipients: { userId: 'u1' },
      activity: { actorId: 'a1', action: 'approved_timecard' },
      audit: { kind: 'custom', log: mockLogContentDecision },
    })).resolves.toBeUndefined()
    expect(mockWarn).toHaveBeenCalledWith('workflow event channel failed', expect.objectContaining({ channel: 'notify' }))
    expect(mockLogActivity).toHaveBeenCalled()
    expect(mockLogContentDecision).toHaveBeenCalled()
  })

  it('a failing dedupe delete is logged and does not stop the notify', async () => {
    mockDelete.mockRejectedValue(new Error('db hiccup'))
    await dispatchWorkflowEvent({
      ...base,
      recipients: { userId: 'u1' },
      dedupe: { relatedId: 'x', type: 'y' },
    })
    expect(mockWarn).toHaveBeenCalledWith('workflow event channel failed', expect.objectContaining({ channel: 'dedupe' }))
    expect(mockNotifyUsers).toHaveBeenCalled()
  })

  it('content_decision audit calls logContentDecision with the route context', async () => {
    const ctx = { ipAddress: '1.2.3.4', userAgent: 'jest' }
    await dispatchWorkflowEvent({
      ...base,
      recipients: { userIds: [] },
      audit: { kind: 'content_decision', ctx, contentType: 'blog_post', contentId: 'c1', decision: 'approved' },
    })
    expect(mockLogContentDecision).toHaveBeenCalledWith(ctx, 'blog_post', 'c1', 'approved')
  })
})
