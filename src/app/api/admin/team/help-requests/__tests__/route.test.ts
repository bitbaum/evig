/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/team/help-requests
 *
 * Behaviors locked:
 *   GET /api/admin/team/help-requests
 *   - returns 401 when not authenticated
 *   - returns 400 when filter is invalid
 *   - returns 200 with items and total
 *
 *   POST /api/admin/team/help-requests
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when session user not found in DB
 *   - returns 201 on success
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
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockValidateHelpRequestFilter = jest.fn()
const mockValidateCreateHelpRequest = jest.fn()

// alias is called at module init — mock drizzle-orm/pg-core before the module loads
jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  helpRequests: {
    id: 'hr_id', requesterId: 'hr_requesterId', title: 'hr_title',
    description: 'hr_description', category: 'hr_category', urgency: 'hr_urgency',
    requestedUserId: 'hr_requestedUserId', isBroadcast: 'hr_isBroadcast',
    status: 'hr_status', resolvedBy: 'hr_resolvedBy', resolvedAt: 'hr_resolvedAt',
    resolutionNotes: 'hr_resolutionNotes', createdAt: 'hr_createdAt', updatedAt: 'hr_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    {
      raw: (s: string) => ({ __raw: s }),
      join: (parts: unknown[], _sep: unknown) => ({ __join: parts }),
    }
  ),
}))

jest.mock('@/lib/schemas/activity', () => ({
  validateHelpRequestFilter: (...args: unknown[]) => mockValidateHelpRequestFilter.apply(null, args),
  validateCreateHelpRequest: (...args: unknown[]) => mockValidateCreateHelpRequest.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROW = {
  _total: 1, id: 'hr-1', requester_id: 'u-1', requester_name: 'Hans',
  requester_email: 'hans@example.com', title: 'Need help', description: null,
  category: null, urgency: 'normal', requested_user_id: null,
  requested_user_name: null, requested_user_email: null,
  is_broadcast: true, status: 'open', resolved_by: null,
  resolved_by_name: null, resolved_at: null, resolution_notes: null,
  created_at: '2026-01-01', updated_at: '2026-01-01',
}

const VALID_POST_BODY = { title: 'Need help with deployment', urgency: 'normal', visibility: 'team' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/team/help-requests', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateHelpRequestFilter.mockReturnValue({ success: true, data: { limit: 50, offset: 0 } })
  mockValidateCreateHelpRequest.mockReturnValue({ success: true, data: VALID_POST_BODY })

  // GET chain: from → innerJoin → leftJoin(x2) → where → orderBy → limit → offset
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue([MOCK_ROW])

  // POST insert chain
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'hr-new' }])
})

// ============================================================================
// GET /api/admin/team/help-requests
// ============================================================================

describe('GET /api/admin/team/help-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/team/help-requests — validation', () => {
  it('returns 400 when filter is invalid', async () => {
    mockValidateHelpRequestFilter.mockReturnValueOnce({ success: false })
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/team/help-requests — authenticated', () => {
  it('returns 200 with items and total', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })
})

// ============================================================================
// POST /api/admin/team/help-requests
// ============================================================================

describe('POST /api/admin/team/help-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest('POST', VALID_POST_BODY))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/team/help-requests — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateCreateHelpRequest.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await POST(makeRequest('POST', {}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when session user not found in DB', async () => {
    // Override the GET chain to support .where() returning empty for user lookup
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([])
    const response = await POST(makeRequest('POST', VALID_POST_BODY))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/team/help-requests — success', () => {
  it('returns 201 on success', async () => {
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([{ id: 'u-1' }])
    const response = await POST(makeRequest('POST', VALID_POST_BODY))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.id).toBe('hr-new')
  })
})
