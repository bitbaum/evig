/**
 * @jest-environment node
 *
 * Tests for GET /api/cron/close-decisions
 *
 * Behaviors locked:
 *   GET - 401 (wrong/missing secret), 200 (decisions closed)
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  decisions: {
    id: 'd_id',
    title: 'd_title',
    createdBy: 'd_createdBy',
    status: 'd_status',
    votingDeadline: 'd_votingDeadline',
    participantScope: 'd_participantScope',
    invitedParticipants: 'd_invitedParticipants',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
}))

const mockTransitionDecision = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  transitionDecision: (...args: unknown[]) => mockTransitionDecision(...args),
}))

const mockNotifyAllStaff = jest.fn()
const mockNotifyUsers = jest.fn()

jest.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff(...args),
  notifyUsers: (...args: unknown[]) => mockNotifyUsers(...args),
}))

const mockResolveEligibleUserIds = jest.fn()

jest.mock('@/lib/services/decisions-voting', () => ({
  resolveEligibleUserIds: (...args: unknown[]) => mockResolveEligibleUserIds(...args),
}))

jest.mock('@/lib/services/decisions-crud', () => ({
  asArray: <T>(value: unknown, fallback: T[]) => (Array.isArray(value) ? value : fallback),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/decisions', () => ({
  DECISION_STATUS: { VOTING: 'voting', CLOSED: 'closed' },
  PARTICIPANT_SCOPE_DEFAULT: 'all_staff',
}))

jest.mock('@/config/notifications', () => ({
  NOTIFICATION_TYPES: {
    DECISION_CLOSED: 'decision_closed',
    DECISION_DEADLINE: 'decision_deadline',
  },
  RELATED_TYPES: { DECISION: 'decision' },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { DECISION_VOTES: 'decision_votes' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_EXPIRED_DECISION = {
  id: 'decision-1',
  title: 'Upgrade Server',
  createdBy: 'admin-1',
}

const MOCK_UPCOMING_DECISION = {
  id: 'decision-2',
  title: 'Buy Equipment',
  votingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  participantScope: 'all_staff',
  invitedParticipants: [],
}

function makeRequest(authHeader?: string): NextRequest {
  return new NextRequest('http://localhost/api/cron/close-decisions', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  delete process.env.CRON_SECRET
  mockTransitionDecision.mockResolvedValue({ id: 'decision-1', status: 'closed' })
  mockNotifyAllStaff.mockResolvedValue(undefined)
  mockNotifyUsers.mockResolvedValue(undefined)
  mockResolveEligibleUserIds.mockResolvedValue(['user-1', 'user-2'])
  mockExecute.mockResolvedValue({ rows: [] })

  // Default: no upcoming decisions, no expired decisions
  mockSelect.mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  })
})

describe('GET /api/cron/close-decisions — auth', () => {
  it('returns 401 when CRON_SECRET is set and authorization header is missing', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when CRON_SECRET is set and authorization header is wrong', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    const res = await GET(makeRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('runs without auth when CRON_SECRET is not set', async () => {
    // No CRON_SECRET — no auth check
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
  })

  it('runs with correct Bearer token', async () => {
    process.env.CRON_SECRET = 'secret-abc'
    const res = await GET(makeRequest('Bearer secret-abc'))
    expect(res.status).toBe(200)
  })
})

describe('GET /api/cron/close-decisions — behavior', () => {
  it('returns 200 with found=0 and closed=0 when no expired decisions', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.found).toBe(0)
    expect(body.closed).toBe(0)
  })

  it('closes expired decisions and returns correct counts', async () => {
    // First select: upcoming decisions (for deadline reminders)
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    // Second select: expired decisions
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_EXPIRED_DECISION]),
      }),
    })
    mockTransitionDecision.mockResolvedValueOnce({ id: 'decision-1', status: 'closed' })

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.found).toBe(1)
    expect(body.closed).toBe(1)
    expect(mockTransitionDecision).toHaveBeenCalledWith(
      'decision-1',
      'closed',
      'admin-1',
      expect.objectContaining({ outcomeSummary: expect.any(String) })
    )
  })

  it('records errors when transition fails', async () => {
    // First select: no upcoming
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    // Second select: one expired decision
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_EXPIRED_DECISION]),
      }),
    })
    // Transition returns an error shape
    mockTransitionDecision.mockResolvedValueOnce({ error: 'Transition failed' })

    const res = await GET(makeRequest())
    const body = await res.json()
    expect(body.closed).toBe(0)
    expect(body.errors).toBeDefined()
    expect(body.errors).toHaveLength(1)
  })

  it('sends deadline reminders for decisions expiring in ~24h', async () => {
    // First select: upcoming decision for reminder
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([MOCK_UPCOMING_DECISION]),
      }),
    })
    // db.execute for vote check
    mockExecute.mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] })
    // Second select: no expired decisions
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    expect(mockNotifyUsers).toHaveBeenCalled()
  })
})
