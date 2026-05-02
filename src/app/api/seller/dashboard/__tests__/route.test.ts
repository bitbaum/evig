/**
 * @jest-environment node
 *
 * Tests for GET /api/seller/dashboard
 *
 * Mission-relevant: the seller dashboard is gated to users with the seller
 * role (or staff). If the role check is bypassed, regular users see seller
 * data; if it over-restricts, sellers can't access their own dashboard.
 *
 * Behaviors locked:
 *   GET /api/seller/dashboard
 *   - returns 401 when not authenticated
 *   - returns 401 when user does not have seller role (and is not staff)
 *   - returns 200 for users with seller role
 *   - returns 200 for staff users regardless of role
 *   - delegates to getSellerDashboard service
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockGetSellerDashboard = jest.fn()

jest.mock('@/lib/services/seller-service', () => ({
  getSellerDashboard: (...args: unknown[]) => mockGetSellerDashboard.apply(null, args),
}))

jest.mock('@/lib/constants', () => ({
  ROLES: { SELLER: 'seller', REPAIRER: 'repairer', CUSTOMER: 'customer' },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
  apiUnauthorized: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 401 })
  },
}))

jest.mock('@/lib/api/middleware', () => {
  const actual = jest.requireActual('@/lib/api/middleware')
  return {
    ...actual,
    withAuth: (handler: (req: Request, session: unknown) => unknown) =>
      (req: Request) => mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
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

function makeSession(role: string, isStaff = false) {
  return {
    user: { id: 'user-s', email: 'seller@example.com', name: 'Seller', role, isStaff, staffPermissions: [] as string[], isSuperAdmin: false },
    expires: '2027-01-01',
  }
}

function makeRequest() {
  return new NextRequest('http://localhost/api/seller/dashboard')
}

const MOCK_DASHBOARD = { listings: 5, revenue: 12000, orders: 3 }

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(makeSession('seller'))
  mockGetSellerDashboard.mockResolvedValue(MOCK_DASHBOARD)
})

// ============================================================================
// GET /api/seller/dashboard
// ============================================================================

describe('GET /api/seller/dashboard — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/seller/dashboard — insufficient role', () => {
  it('returns 401 when user has customer role (not seller)', async () => {
    mockAuth.mockResolvedValueOnce(makeSession('customer'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })

  it('returns 401 when user has no role set', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(''))
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/seller/dashboard — authorized', () => {
  it('returns 200 for seller role', async () => {
    mockAuth.mockResolvedValueOnce(makeSession('seller'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns 200 for staff regardless of role', async () => {
    mockAuth.mockResolvedValueOnce(makeSession('customer', true))
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns dashboard data from service', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.listings).toBe(5)
  })

  it('calls getSellerDashboard with the user id', async () => {
    await GET(makeRequest())
    expect(mockGetSellerDashboard).toHaveBeenCalledWith('user-s')
  })
})

describe('GET /api/seller/dashboard — service error', () => {
  it('returns 500 when getSellerDashboard throws', async () => {
    mockGetSellerDashboard.mockRejectedValueOnce(new Error('service down'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
