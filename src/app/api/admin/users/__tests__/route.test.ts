/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/users
 *
 * Behaviors locked:
 *   GET /api/admin/users
 *   - returns 401 when not authenticated
 *   - returns 200 with items and pagination
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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
  },
}))

jest.mock('@/db/schema', () => ({
  users: {
    id: 'u_id', name: 'u_name', email: 'u_email', isStaff: 'u_isStaff',
    isSuperAdmin: 'u_isSuperAdmin', staffPermissions: 'u_staffPerms',
    createdAt: 'u_createdAt', emailVerified: 'u_emailVerified',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  isNull: (col: unknown) => ({ __isNull: col }),
  isNotNull: (col: unknown) => ({ __isNotNull: col }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: jest.fn().mockReturnValue(false),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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

const MOCK_ROWS = [
  { _total: 2, id: 'u-1', name: 'Anna', email: 'anna@example.com', is_staff: false },
  { _total: 2, id: 'u-2', name: 'Bob', email: 'bob@example.com', is_staff: true },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/users')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  const permissions = require('@/lib/permissions')
  permissions.isSuperAdmin.mockReturnValue(false)
})

// ============================================================================
// GET /api/admin/users
// ============================================================================

describe('GET /api/admin/users — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/users — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(2)
    expect(body.data.pagination.total).toBe(2)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
