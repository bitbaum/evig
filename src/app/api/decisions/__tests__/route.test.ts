/**
 * @jest-environment node
 *
 * Tests for GET /api/decisions and POST /api/decisions
 *
 * Mission-relevant: the decisions list is the entry point for the governance
 * module. GET is member-accessible; POST is staff-only. Auth guards and
 * service delegation are the core correctness targets.
 *
 * Behaviors locked:
 *   GET /api/decisions
 *   - returns 401 when not authenticated
 *   - returns 200 with decisions list
 *   - passes pagination params to service
 *   - returns 500 when service throws
 *
 *   POST /api/decisions
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 with created decision
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown) => unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
  withAdmin: (handler: (req: Request, session: unknown) => unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockGetDecisions = jest.fn()
const mockCreateDecision = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getDecisions: (...args: unknown[]) => mockGetDecisions.apply(null, args),
  createDecision: (...args: unknown[]) => mockCreateDecision.apply(null, args),
}))

jest.mock('@/lib/schemas/decisions', () => ({
  // Static so it survives jest.resetAllMocks()
  createDecisionSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.title) return { success: false, error: { issues: [{ message: 'Titel ist erforderlich' }] } }
      return { success: true, data: { title: b.title, description: b.description, decisionType: b.decisionType || 'simple' } }
    },
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: jest.fn().mockReturnValue({ page: 1, limit: 20, offset: 0 }),
  }
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALL_FIELDS_REQUIRED: 'All fields required',
    DECISION_CREATE_FAILED: 'Entscheidung konnte nicht erstellt werden',
  },
  SUCCESS_MESSAGES: { DECISION_CREATED: 'Entscheidung erstellt' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(isStaff = false) {
  return {
    user: { id: 'user-1', email: 'member@revamp-it.ch', name: 'Member', isStaff, staffPermissions: [] as string[], isSuperAdmin: false },
    expires: '2027-01-01',
  }
}

const MOCK_DECISIONS = {
  decisions: [{ id: 'dec-1', title: 'Budget 2026', status: 'voting' }],
  total: 1, page: 1, limit: 20,
}

const MOCK_CREATED = { id: 'dec-new', title: 'Neue Entscheidung', status: 'draft' }

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/decisions')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/decisions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(makeSession())
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockGetDecisions.mockResolvedValue(MOCK_DECISIONS)
  mockCreateDecision.mockResolvedValue(MOCK_CREATED)

  // Re-set parsePagination mock after resetAllMocks
  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ page: 1, limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/decisions
// ============================================================================

describe('GET /api/decisions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/decisions — authenticated', () => {
  it('returns 200 with decisions', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns decisions array in response', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.decisions).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })

  it('returns 500 when service throws', async () => {
    mockGetDecisions.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/decisions
// ============================================================================

describe('POST /api/decisions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ title: 'Test' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/decisions — validation', () => {
  it('returns 400 when title is missing', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/decisions — success', () => {
  it('returns 201 with created decision', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    const response = await POST(makePostRequest({ title: 'Neue Entscheidung' }))
    expect(response.status).toBe(201)
  })

  it('returns the created decision', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    const response = await POST(makePostRequest({ title: 'Neue Entscheidung' }))
    const body = await response.json()
    expect(body.data.id).toBe('dec-new')
  })

  it('returns 500 when service throws', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    mockCreateDecision.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest({ title: 'Neue Entscheidung' }))
    expect(response.status).toBe(500)
  })
})
