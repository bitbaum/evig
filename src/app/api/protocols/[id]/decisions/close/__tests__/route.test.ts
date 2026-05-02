/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/decisions/close
 *
 * Mission-relevant: closing a decision is a one-way admin operation that
 * finalises the vote tally and prevents further changes. The DECISION_ALREADY_CLOSED
 * guard must fire correctly — a double-close would be silently wrong without it.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/decisions/close
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing action_item_id)
 *   - returns 400 with DECISION_ALREADY_CLOSED when that error is thrown
 *   - returns 200 with outcome on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
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
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

jest.mock('@/lib/schemas/protocols', () => ({
  closeDecisionSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.action_item_id) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { action_item_id: body.action_item_id } }
    },
  },
}))

const mockCloseDecision = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  closeDecision: (...args: unknown[]) => mockCloseDecision.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    DECISION_ALREADY_CLOSED: 'Abstimmung bereits geschlossen',
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

const ADMIN_SESSION = {
  user: {
    id: 'user-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_OUTCOME = {
  action_item_id: 'ai-1',
  closed: true,
  final_votes: { up: 5, down: 2 },
  result: 'approved',
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/protocols/proto-1/decisions/close', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { action_item_id: 'ai-1' }

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(ADMIN_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockCloseDecision.mockResolvedValue(MOCK_OUTCOME)
})

// ============================================================================
// POST /api/protocols/[id]/decisions/close — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/decisions/close — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/close — validation
// ============================================================================

describe('POST /api/protocols/[id]/decisions/close — validation', () => {
  it('returns 400 when action_item_id is missing', async () => {
    const response = await POST(makePostRequest({}), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/close — DECISION_ALREADY_CLOSED
// ============================================================================

describe('POST /api/protocols/[id]/decisions/close — closed decision', () => {
  it('returns 400 with DECISION_ALREADY_CLOSED message when that error is thrown', async () => {
    mockCloseDecision.mockRejectedValueOnce(new Error('DECISION_ALREADY_CLOSED'))
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Abstimmung bereits geschlossen')
  })
})

// ============================================================================
// POST /api/protocols/[id]/decisions/close — success
// ============================================================================

describe('POST /api/protocols/[id]/decisions/close — success', () => {
  it('returns 200 with outcome', async () => {
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_OUTCOME)
  })

  it('calls closeDecision with protocol id, action_item_id, and db user id', async () => {
    await POST(makePostRequest(VALID_BODY), makeContext('proto-1'))
    expect(mockCloseDecision).toHaveBeenCalledWith(
      'proto-1',
      'ai-1',
      'db-user-1',
    )
  })

  it('returns 500 when service throws unexpected error', async () => {
    mockCloseDecision.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await POST(makePostRequest(VALID_BODY), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
