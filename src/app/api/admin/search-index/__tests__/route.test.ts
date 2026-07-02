/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/search-index
 *
 * Behaviors locked:
 *   GET /api/admin/search-index
 *   - returns 401 when not authenticated
 *   - returns 200 with sections, recentUsers, recentDecisions, recentListings
 *   - returns empty arrays when any DB query fails (Promise.allSettled)
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

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users', DECISIONS: 'decisions', MARKETPLACE_LISTINGS: 'marketplace_listings' },
}))

jest.mock('@/config/sections', () => ({
  getAdminSections: () => [
    { id: 'dashboard', path: '/admin', ui: { label: 'Dashboard', description: 'Overview' } },
  ],
}))

// The route scopes results by the caller's permissions — grant everything here;
// the scoping logic itself is covered by src/lib/__tests__/permissions.test.ts.
jest.mock('@/lib/permissions', () => ({
  canAccessSection: () => true,
  toStaffUser: (u: unknown) => u,
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/search-index', { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Three parallel db.execute calls via Promise.allSettled
  mockDbExecute
    .mockResolvedValueOnce({ rows: [{ id: 'u-1', name: 'Hans', email: 'hans@example.com' }] })
    .mockResolvedValueOnce({ rows: [{ id: 'd-1', title: 'Decision 1', status: 'pending' }] })
    .mockResolvedValueOnce({ rows: [{ id: 'l-1', title: 'Laptop', status: 'active' }] })
})

// ============================================================================
// GET /api/admin/search-index
// ============================================================================

describe('GET /api/admin/search-index — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/search-index — authenticated', () => {
  it('returns 200 with sections and recent data', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.sections).toHaveLength(1)
    expect(body.data.sections[0].id).toBe('dashboard')
    expect(body.data.recentUsers).toHaveLength(1)
    expect(body.data.recentUsers[0].name).toBe('Hans')
    expect(body.data.recentDecisions).toHaveLength(1)
    expect(body.data.recentListings).toHaveLength(1)
  })

  it('returns empty arrays when DB queries fail', async () => {
    mockDbExecute.mockReset()
    mockDbExecute
      .mockRejectedValueOnce(new Error('DB error'))
      .mockRejectedValueOnce(new Error('DB error'))
      .mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.recentUsers).toHaveLength(0)
    expect(body.data.recentDecisions).toHaveLength(0)
    expect(body.data.recentListings).toHaveLength(0)
  })
})
