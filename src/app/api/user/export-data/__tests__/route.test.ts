/**
 * @jest-environment node
 *
 * Tests for GET /api/user/export-data
 *
 * GDPR-compliant user data export using raw query() (not Drizzle ORM).
 * Rate limited to 3 exports per 24h.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockQuery = jest.fn()
jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiRateLimited: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 429 }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    USERS: 'users',
    AUTH_AUDIT_LOG: 'auth_audit_log',
    LISTINGS: 'listings',
    MARKETPLACE_ORDERS: 'marketplace_orders',
    REVIEWS: 'reviews',
    MESSAGES: 'messages',
    IT_HILFE_REQUESTS: 'it_hilfe_requests',
    IT_HILFE_OFFERS: 'it_hilfe_offers',
    WORKSHOP_REGISTRATIONS: 'workshop_registrations',
    DONATIONS: 'donations',
    POOL_MEMBERSHIPS: 'pool_memberships',
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest() {
  return new Request('http://localhost/api/user/export-data', {
    headers: { 'user-agent': 'jest-test', 'x-forwarded-for': '127.0.0.1' },
  })
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  // Default: rate limit check returns count=0 (no previous exports today)
  mockQuery.mockResolvedValue({ rows: [{ count: '0' }] })
})

describe('GET /api/user/export-data', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limit is exceeded (3 exports today)', async () => {
    // First call is rate limit check — return count=3
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] })
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it('returns 200 with JSON body and download headers on success', async () => {
    // Rate limit check → 0 exports
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] })
    // All safeQuery calls (profile, listings, orders×2, reviews, messages×2, ithilfe×2, workshops, donations) → empty rows
    mockQuery.mockResolvedValue({ rows: [] })

    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(200)
    // Verify download headers
    const contentDisposition = res.headers.get('content-disposition')
    expect(contentDisposition).toMatch(/attachment/)
    expect(contentDisposition).toMatch(/\.json/)
    // Verify JSON body contains meta field
    const body = await res.json()
    expect(body.meta).toBeDefined()
    expect(body.meta.userId).toBe('user-1')
    expect(body.meta.email).toBe('user@example.com')
  })

  it('returns 200 with complete data structure', async () => {
    // Rate limit check
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] })
    // All data queries → empty
    mockQuery.mockResolvedValue({ rows: [] })

    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    // Verify all top-level keys are present
    expect(body).toHaveProperty('meta')
    expect(body).toHaveProperty('listings')
    expect(body).toHaveProperty('orders')
    expect(body).toHaveProperty('reviews')
    expect(body).toHaveProperty('messages')
    expect(body).toHaveProperty('workshopRegistrations')
    expect(body).toHaveProperty('donations')
  })
})
