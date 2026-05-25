/**
 * @jest-environment node
 *
 * Tests for POST /api/decisions/[id]/send-invitations
 *
 * Behaviors locked:
 *   - 401 when not authenticated
 *   - 404 when decision not found
 *   - 403 when decision is not in VOTING status
 *   - 200 { sent: 0, skipped: 0 } when no eligible voters
 *   - 200 { sent: 0, skipped: N } when all eligible voters have already voted
 *   - 200 { sent: N, skipped: M } when emails sent to non-voters
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = (typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler) as (...args: unknown[]) => unknown
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        if (!(session as { user: { isStaff?: boolean } }).user.isStaff) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return handler(req, session, resolvedContext)
      })
  },
}))

const mockDbExecute = jest.fn()
const mockDbSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    select: (...args: unknown[]) => mockDbSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  decisions: { id: 'd_id' },
  decisionVotes: { id: 'dv_id' },
  users: { id: 'u_id', email: 'u_email' },
  userProfiles: { userId: 'up_userId', emailNotifications: 'up_email_notifications' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: (_table: unknown) => 'decisions',
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/email/templates/decisions', () => ({
  decisionVotingOpened: jest.fn().mockReturnValue({
    subject: 'Test',
    html: '<p>Test</p>',
    text: 'Test',
  }),
}))

jest.mock('@/lib/services/decisions-voting', () => ({
  resolveEligibleUserIds: jest.fn(),
}))

jest.mock('@/lib/services/decisions-crud', () => ({
  asArray: (_val: unknown, def: unknown) => def,
}))

jest.mock('@/config/decisions', () => ({
  DECISION_STATUS: { VOTING: 'voting', DISCUSSION: 'discussion', DRAFT: 'draft' },
  PARTICIPANT_SCOPE_DEFAULT: 'all_staff',
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 500 }),
    apiNotFound: (resource: string) =>
      NextResponse.json({ success: false, error: `${resource} not found` }, { status: 404 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { resolveEligibleUserIds } from '@/lib/services/decisions-voting'
import { sendCustomEmail } from '@/lib/email'

const mockResolveEligibleUserIds = resolveEligibleUserIds as jest.Mock
const mockSendCustomEmail = sendCustomEmail as jest.Mock

const ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', isStaff: true },
  expires: '2099-01-01',
}

const VOTING_DECISION = {
  id: 'decision-1',
  title: 'Test Decision',
  status: 'voting',
  voting_deadline: null,
  participant_scope: 'all_staff',
  invited_participants: [],
  allow_public_voting: false,
}

function makeRequest() {
  return new NextRequest('http://localhost/api/decisions/decision-1/send-invitations', {
    method: 'POST',
  })
}

function makeSelectChain(result: unknown[]) {
  const leftJoin = jest.fn()
  const where = jest.fn().mockResolvedValue(result)
  leftJoin.mockReturnValue({ where })
  const from = jest.fn().mockReturnValue({ leftJoin })
  return { from, leftJoin, where }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(ADMIN_SESSION)
})

// ---------------------------------------------------------------------------
// 401 — unauthenticated
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// 404 — decision not found
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — not found', () => {
  it('returns 404 when decision does not exist', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] })
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// 403 — wrong status
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — wrong status', () => {
  it('returns 403 when decision is not in voting status', async () => {
    mockDbExecute.mockResolvedValue({ rows: [{ ...VOTING_DECISION, status: 'discussion' }] })
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// 200 — no eligible voters
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — no eligible voters', () => {
  it('returns sent:0 skipped:0 when no eligible voters', async () => {
    mockDbExecute.mockResolvedValue({ rows: [VOTING_DECISION] })
    mockResolveEligibleUserIds.mockResolvedValue([])
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.sent).toBe(0)
    expect(body.data.skipped).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 200 — all already voted
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — all voted', () => {
  it('returns sent:0 skipped:2 when all eligible voters have already voted', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [VOTING_DECISION] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }] })

    mockResolveEligibleUserIds.mockResolvedValue(['user-1', 'user-2'])

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.sent).toBe(0)
    expect(body.data.skipped).toBe(2)
    expect(mockSendCustomEmail).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// 200 — emails sent to non-voters
// ---------------------------------------------------------------------------

describe('POST /api/decisions/[id]/send-invitations — sends emails', () => {
  it('sends emails only to non-voters and returns correct counts', async () => {
    // Decision fetch
    mockDbExecute
      .mockResolvedValueOnce({ rows: [VOTING_DECISION] })
      // Voted users: only user-1 has voted
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] })

    mockResolveEligibleUserIds.mockResolvedValue(['user-1', 'user-2', 'user-3'])

    // User email query: user-2 and user-3 are non-voters
    const chain = makeSelectChain([
      { id: 'user-2', email: 'user2@example.com', emailNotifications: true },
      { id: 'user-3', email: 'user3@example.com', emailNotifications: null },
    ])
    mockDbSelect.mockReturnValue(chain)

    mockSendCustomEmail.mockResolvedValue({ success: true })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.sent).toBe(2)
    expect(body.data.skipped).toBe(1)
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(2)
  })

  it('respects email_notifications=false preference', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [VOTING_DECISION] })
      .mockResolvedValueOnce({ rows: [] })

    mockResolveEligibleUserIds.mockResolvedValue(['user-1', 'user-2'])

    const chain = makeSelectChain([
      { id: 'user-1', email: 'user1@example.com', emailNotifications: false },
      { id: 'user-2', email: 'user2@example.com', emailNotifications: true },
    ])
    mockDbSelect.mockReturnValue(chain)

    mockSendCustomEmail.mockResolvedValue({ success: true })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.sent).toBe(1)
    expect(mockSendCustomEmail).toHaveBeenCalledTimes(1)
    expect(mockSendCustomEmail).toHaveBeenCalledWith('user2@example.com', expect.any(Object))
  })

  it('counts resolved {success:false} as failed (was miscounted as sent before this fix)', async () => {
    // Promise.allSettled's `fulfilled` only means "promise resolved", not
    // "email sent" — sendCustomEmail RESOLVES with {success:false} on
    // realistic failures (SMTP rejection, Listmonk disabled, API non-2xx).
    // The prior `if (status === 'fulfilled') sent++` counted those as
    // sent. This test locks in the settled.value.success check.
    mockDbExecute
      .mockResolvedValueOnce({ rows: [VOTING_DECISION] })
      .mockResolvedValueOnce({ rows: [] })
    mockResolveEligibleUserIds.mockResolvedValue(['user-1', 'user-2'])
    const chain = makeSelectChain([
      { id: 'user-1', email: 'user1@example.com', emailNotifications: true },
      { id: 'user-2', email: 'user2@example.com', emailNotifications: true },
    ])
    mockDbSelect.mockReturnValue(chain)
    mockSendCustomEmail
      .mockResolvedValueOnce({ success: false, error: 'SMTP rejected' })
      .mockResolvedValueOnce({ success: false, error: 'Listmonk disabled' })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'decision-1' }) })
    const body = await res.json()
    expect(body.data.sent).toBe(0)
  })
})
