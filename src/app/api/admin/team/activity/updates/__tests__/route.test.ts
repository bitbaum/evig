/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/team/activity/updates
 *
 * Behaviors locked:
 *   GET /api/admin/team/activity/updates
 *   - returns 401 when not authenticated
 *   - returns 400 when filter is invalid
 *   - returns 200 with items and total
 *
 *   POST /api/admin/team/activity/updates
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
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockSafeParse = jest.fn()
const mockValidateCreateActivityUpdate = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  activityUpdates: {
    id: 'au_id', userId: 'au_userId', updateType: 'au_updateType',
    title: 'au_title', description: 'au_description', category: 'au_category',
    visibility: 'au_visibility', occurredAt: 'au_occurredAt',
    createdAt: 'au_createdAt', updatedAt: 'au_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  lte: (a: unknown, b: unknown) => ({ __lte: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/schemas/activity', () => ({
  activityStreamFilterSchema: { safeParse: (...args: unknown[]) => mockSafeParse.apply(null, args) },
  validateCreateActivityUpdate: (...args: unknown[]) => mockValidateCreateActivityUpdate.apply(null, args),
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
  _total: 1, id: 'upd-1', user_id: 'u-1', user_name: 'Hans',
  user_email: 'hans@example.com', update_type: 'progress',
  title: 'Fixed a bug', description: null, category: null,
  visibility: 'team', occurred_at: '2026-01-01', created_at: '2026-01-01', updated_at: '2026-01-01',
}

const VALID_BODY = { update_type: 'progress', title: 'Fixed a bug', visibility: 'team' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/team/activity/updates', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockSafeParse.mockReturnValue({ success: true, data: { limit: 50, offset: 0 } })
  mockValidateCreateActivityUpdate.mockReturnValue({ success: true, data: VALID_BODY })

  // GET chain: from → innerJoin → where → orderBy → limit → offset
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue([MOCK_ROW])

  // POST insert chain
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'upd-new' }])
})

// ============================================================================
// GET /api/admin/team/activity/updates
// ============================================================================

describe('GET /api/admin/team/activity/updates — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/team/activity/updates — validation', () => {
  it('returns 400 when filter is invalid', async () => {
    mockSafeParse.mockReturnValueOnce({ success: false, error: { errors: [] } })
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/team/activity/updates — authenticated', () => {
  it('returns 200 with items and total', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })
})

// ============================================================================
// POST /api/admin/team/activity/updates
// ============================================================================

describe('POST /api/admin/team/activity/updates — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest('POST', VALID_BODY))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/team/activity/updates — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateCreateActivityUpdate.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await POST(makeRequest('POST', {}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when session user not found in DB', async () => {
    // GET chain setup interferes — reset for POST-specific flow
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([])   // user lookup: empty
    const response = await POST(makeRequest('POST', VALID_BODY))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/team/activity/updates — success', () => {
  it('returns 201 on success', async () => {
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([{ id: 'u-1' }])  // user lookup
    const response = await POST(makeRequest('POST', VALID_BODY))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.id).toBe('upd-new')
  })
})
