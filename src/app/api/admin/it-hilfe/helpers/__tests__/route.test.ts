/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/it-hilfe/helpers
 *
 * Behaviors locked:
 *   GET /api/admin/it-hilfe/helpers
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
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockCountLeftJoin = jest.fn()
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
  repairerProfiles: {
    id: 'rp_id', userId: 'rp_userId', description: 'rp_description', hourlyRateCents: 'rp_rate',
    acceptsGratis: 'rp_gratis', acceptsKulturlegi: 'rp_kulturlegi', serviceDeliveryTypes: 'rp_services',
    city: 'rp_city', canton: 'rp_canton', isActive: 'rp_isActive', profileTier: 'rp_profileTier',
    isVerified: 'rp_isVerified', verificationDate: 'rp_verifiedAt', status: 'rp_status',
    updatedAt: 'rp_updatedAt', totalJobsCompleted: 'rp_totalHelps',
    averageRating: 'rp_avgRating', createdAt: 'rp_createdAt',
  },
  userProfiles: {
    userId: 'up_userId', isVerified: 'up_isVerified', verificationDate: 'up_verifiedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  userSkills: { userId: 'us_userId', skillId: 'us_skillId' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USER_SKILLS: 'user_skills' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/helper-status', () => ({
  HELPER_STATUS: { ACTIVE: 'active', VERIFIED: 'verified', SUSPENDED: 'suspended' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: jest.fn().mockReturnValue({ limit: 20, offset: 0 }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
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
  { id: 'hp-1', user_id: 'u-1', helper_name: 'Hans', helper_email: 'hans@example.com' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/it-hilfe/helpers')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Items query: from().innerJoin().leftJoin(userProfiles).where().orderBy().limit().offset()
  // Count query: from().leftJoin(userProfiles).where()  (sequential, after items)
  mockFrom
    .mockReturnValueOnce({ innerJoin: mockInnerJoin })       // items query
    .mockReturnValueOnce({ leftJoin: mockCountLeftJoin })    // count query
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockCountLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere
    .mockReturnValueOnce({ orderBy: mockOrderBy })      // items query
    .mockResolvedValueOnce([{ total: '1' }])            // count query
  mockOrderBy.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOffset.mockResolvedValue(MOCK_ROWS)

  const helpers = require('@/lib/api/helpers')
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 })
})

// ============================================================================
// GET /api/admin/it-hilfe/helpers
// ============================================================================

describe('GET /api/admin/it-hilfe/helpers — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/it-hilfe/helpers — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.pagination.total).toBe(1)
  })

  it('returns 500 when DB throws', async () => {
    mockOffset.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
