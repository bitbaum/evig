/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/team/activity
 *
 * Behaviors locked:
 *   GET /api/admin/team/activity
 *   - returns 401 when not authenticated
 *   - returns 400 when filter is invalid
 *   - returns 200 with items and total
 *   - returns 500 when DB throws
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

const mockDbExecute = jest.fn()
const mockValidateActivityStreamFilter = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema/misc', () => ({
  taskCompletions: {},
  tasks: {},
}))

jest.mock('@/db/schema/team', () => ({
  activityUpdates: {},
  helpRequests: {},
}))

jest.mock('@/db/schema/auth', () => ({
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (...args: unknown[]) => ({ __sql: true }),
    {
      raw: (s: string) => ({ __raw: s }),
      join: (parts: unknown[], _sep: unknown) => ({ __join: parts }),
    }
  ),
  getTableName: (_table: unknown) => 'mock_table',
}))

jest.mock('@/config/activity', () => ({
  HELP_REQUEST_STATUSES: { RESOLVED: 'resolved' },
}))

jest.mock('@/lib/schemas/activity', () => ({
  validateActivityStreamFilter: (...args: unknown[]) => mockValidateActivityStreamFilter.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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

const MOCK_FILTERS = {
  source_type: undefined,
  user_id: undefined,
  category: undefined,
  since: undefined,
  until: undefined,
  limit: 50,
  offset: 0,
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/team/activity')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateActivityStreamFilter.mockReturnValue({ success: true, data: MOCK_FILTERS })
  mockDbExecute
    .mockResolvedValueOnce({ rows: [{ id: 'act-1', source_type: 'activity_update', title: 'Did something' }] })
    .mockResolvedValueOnce({ rows: [{ count: '1' }] })
})

// ============================================================================
// GET /api/admin/team/activity
// ============================================================================

describe('GET /api/admin/team/activity — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/team/activity — validation', () => {
  it('returns 400 when filter is invalid', async () => {
    mockValidateActivityStreamFilter.mockReturnValueOnce({ success: false })
    const response = await GET(makeRequest({ limit: 'bad' }))
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/team/activity — authenticated', () => {
  it('returns 200 with items and total', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.total).toBe(1)
    expect(body.data.limit).toBe(50)
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
