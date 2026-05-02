/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/decisions/vote
 *
 * Mission-relevant: voting is the core democratic interaction in the governance
 * module. The DECISION_ALREADY_CLOSED guard prevents phantom votes after a
 * decision has been finalised — incorrect behavior here corrupts governance
 * records.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/decisions/vote
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing action_item_id or vote_type)
 *   - returns 400 with DECISION_ALREADY_CLOSED when that error is thrown
 *   - returns 200 with vote result on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
  withAdmin: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

jest.mock('@/lib/schemas/protocols', () => ({
  decisionVoteSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.action_item_id || !body?.vote_type) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { action_item_id: body.action_item_id, vote_type: body.vote_type } }
    },
  },
}))

const mockCastDecisionVote = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  castDecisionVote: (...args: unknown[]) => mockCastDecisionVote.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    DECISION_ALREADY_CLOSED: 'Abstimmung bereits geschlossen',
    VOTE_FAILED: 'Abstimmung fehlgeschlagen',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MEMBER_SESSION = {
  user: {
    id: 'user-1',
    email: 'member@revamp-it.ch',
    name: 'Member',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
}

const MOCK_VOTE_RESULT = {
  action_item_id: 'ai-1',
  vote_type: 'up',
  votes: { up: 4, down: 1 },
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/protocols/proto-1/decisions/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { action_item_id: 'ai-1', vote_type: 'up' }

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MEMBER_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockCastDecisionVote.mockResolvedValue(MOCK_VOTE_RESULT)
})

// ============================================================================
// POST /api/protocols/[id]/decisions/vote — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/decisions/vote — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/vote — validation
// ============================================================================

describe('POST /api/protocols/[id]/decisions/vote — validation', () => {
  it('returns 400 when action_item_id is missing', async () => {
    const response = await POST(makePostRequest({ vote_type: 'up' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when vote_type is missing', async () => {
    const response = await POST(makePostRequest({ action_item_id: 'ai-1' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when body is empty', async () => {
    const response = await POST(makePostRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/vote — DECISION_ALREADY_CLOSED
// ============================================================================

describe('POST /api/protocols/[id]/decisions/vote — closed decision', () => {
  it('returns 400 with DECISION_ALREADY_CLOSED message when that error is thrown', async () => {
    mockCastDecisionVote.mockRejectedValueOnce(new Error('DECISION_ALREADY_CLOSED'))
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Abstimmung bereits geschlossen')
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/vote — success
// ============================================================================

describe('POST /api/protocols/[id]/decisions/vote — success', () => {
  it('returns 200 with vote result', async () => {
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_VOTE_RESULT)
  })

  it('calls castDecisionVote with correct arguments', async () => {
    await POST(makePostRequest(VALID_BODY), makeContext('proto-1'))
    expect(mockCastDecisionVote).toHaveBeenCalledWith(
      'proto-1',
      'ai-1',
      'db-user-1',
      'up',
    )
  })

  it('returns 500 when service throws unexpected error', async () => {
    mockCastDecisionVote.mockRejectedValueOnce(new Error('DB connection lost'))
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Abstimmung fehlgeschlagen')
  })
})
