/**
 * @jest-environment node
 *
 * Tests for GET /api/protocols/[id]/decisions
 *
 * Mission-relevant: the decisions endpoint exposes vote tallies and outcomes
 * to all authenticated members, not just admins. Wrong auth guard would either
 * block legitimate access or leak governance data to unauthenticated callers.
 *
 * Behaviors locked:
 *   GET /api/protocols/[id]/decisions
 *   - returns 401 when not authenticated
 *   - returns 200 with decision data for any authenticated user
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// Both withAuth and withAdmin are mocked so the module import does not fail if
// the route ever imports both — only withAuth is used by this route.
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

const mockGetDecisionData = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getDecisionData: (...args: unknown[]) => mockGetDecisionData.apply(null, args),
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
import { GET } from '../route'

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

const MOCK_DECISION_DATA = {
  action_items: [
    {
      id: 'ai-1',
      title: 'Budget genehmigen',
      votes: { up: 3, down: 1 },
      outcome: null,
      closed: false,
    },
  ],
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/protocols/proto-1/decisions')
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MEMBER_SESSION)
  mockGetDecisionData.mockResolvedValue(MOCK_DECISION_DATA)
})

// ============================================================================
// GET /api/protocols/[id]/decisions — unauthenticated
// ============================================================================

describe('GET /api/protocols/[id]/decisions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// GET /api/protocols/[id]/decisions — authenticated
// ============================================================================

describe('GET /api/protocols/[id]/decisions — authenticated', () => {
  it('returns 200 with decision data', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_DECISION_DATA)
  })

  it('calls getDecisionData with the protocol id', async () => {
    await GET(makeGetRequest(), makeContext('proto-42'))
    expect(mockGetDecisionData).toHaveBeenCalledWith('proto-42')
  })

  it('returns 500 when service throws', async () => {
    mockGetDecisionData.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('is accessible to non-admin (member) users', async () => {
    // MEMBER_SESSION has isStaff: false — withAuth (not withAdmin) guards this route
    mockAuth.mockResolvedValueOnce(MEMBER_SESSION)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
  })
})
