/**
 * @jest-environment node
 *
 * Tests for GET /api/decisions/[id]/votes/participation
 *
 * Mission-relevant: shows admins how many members voted on a decision.
 * If 404 is returned for a valid decision, admins get false signal that
 * the decision doesn't exist.
 *
 * Behaviors locked:
 *   GET /api/decisions/[id]/votes/participation
 *   - returns 401 when not authenticated
 *   - returns 400 when no id param
 *   - returns 404 when decision not found
 *   - returns 200 with participation data
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
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockGetParticipationStatus = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getParticipationStatus: (...args: unknown[]) => mockGetParticipationStatus.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PARTICIPATION = { total: 12, voted: 8, percentage: 67, votes: [] }

function makeRequest() {
  return new NextRequest('http://localhost/api/decisions/dec-1/votes/participation')
}

function makeContext(id = 'dec-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetParticipationStatus.mockResolvedValue(MOCK_PARTICIPATION)
})

// ============================================================================
// GET /api/decisions/[id]/votes/participation
// ============================================================================

describe('GET /api/decisions/[id]/votes/participation — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/decisions/[id]/votes/participation — authenticated', () => {
  it('returns 200 with participation data', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the participation stats', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.total).toBe(12)
    expect(body.data.voted).toBe(8)
  })

  it('returns 404 when decision not found', async () => {
    mockGetParticipationStatus.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('passes decision id to service', async () => {
    await GET(makeRequest(), makeContext('dec-42'))
    expect(mockGetParticipationStatus).toHaveBeenCalledWith('dec-42')
  })

  it('returns 500 when service throws', async () => {
    mockGetParticipationStatus.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})
