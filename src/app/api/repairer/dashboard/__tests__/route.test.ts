/**
 * @jest-environment node
 *
 * Tests for GET /api/repairer/dashboard (authenticated, role-checked)
 *
 * Behaviors locked:
 *   GET - 401 (no session), 401 (wrong role), 200 with dashboard data
 *
 * Note: This route calls auth() directly (not withAuth middleware).
 * It checks session.user.role === ROLES.REPAIRER || session.user.isStaff.
 */

const mockAuth = jest.fn()
const mockSelect = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  serviceAppointments: {
    id: 'sa_id',
    repairerId: 'sa_repairerId',
    userId: 'sa_userId',
    serviceTypeId: 'sa_serviceTypeId',
    status: 'sa_status',
    urgency: 'sa_urgency',
    preferredDate: 'sa_preferredDate',
    confirmedDate: 'sa_confirmedDate',
    description: 'sa_description',
    deviceInfo: 'sa_deviceInfo',
    priceChargedCents: 'sa_priceChargedCents',
    createdAt: 'sa_createdAt',
  },
  serviceTypes: {
    id: 'st_id',
    name: 'st_name',
  },
  users: {
    id: 'u_id',
    name: 'u_name',
    email: 'u_email',
  },
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
  },
  repairerReviews: {
    id: 'rr_id',
    repairerId: 'rr_repairerId',
    rating: 'rr_rating',
    isPublic: 'rr_isPublic',
  },
  repairerServices: {
    id: 'rs_id',
    repairerId: 'rs_repairerId',
    serviceName: 'rs_serviceName',
    description: 'rs_description',
    basePriceCents: 'rs_basePriceCents',
    hourlyRateCents: 'rs_hourlyRateCents',
    isActive: 'rs_isActive',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  or: (...args: unknown[]) => ({ __or: args }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  count: () => ({ __count: true }),
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email` }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/config/appointment-status', () => ({
  APPOINTMENT_STATUS: {
    COMPLETED: 'completed',
    REQUESTED: 'requested',
    IN_PROGRESS: 'in_progress',
    CONFIRMED: 'confirmed',
  },
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLIC: 'public', PRIVATE: 'private' },
}))

jest.mock('@/config/it-hilfe', () => ({
  URGENCY_DEFAULT: 'normal',
}))

jest.mock('@/lib/constants', () => ({
  ROLES: {
    REPAIRER: 'repairer',
    REVAMPIT_ADMIN: 'revampit_admin',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_REPAIRER_SESSION = {
  user: { id: 'user-1', email: 'repairer@example.com', name: 'Rep User', role: 'repairer', isStaff: false },
  expires: '2027-01-01',
}

const MOCK_STAFF_SESSION = {
  user: { id: 'staff-1', email: 'staff@revamp-it.ch', name: 'Staff User', role: 'revampit_admin', isStaff: true },
  expires: '2027-01-01',
}

const MOCK_STATS = {
  total_bookings: '5',
  completed_bookings: '3',
  pending_bookings: '1',
  confirmed_bookings: '1',
  total_revenue: '50000',
}

// Build a simple chain that resolves to a value for .from().where()?... etc.
function makeChainThat(result: unknown) {
  const mockLimit = jest.fn().mockResolvedValue(result)
  const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
  const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit })
  const mockInnerJoin2 = jest.fn().mockReturnValue({ where: mockWhere })
  const mockInnerJoin = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin2, where: mockWhere })
  const mockFrom = jest.fn().mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  return { from: mockFrom }
}

// Full select setup for a successful dashboard call
// Queries in order:
//   1. repairerProfiles.id (profile lookup)
//   2. bookings (serviceAppointments + joins + orderBy + limit)
//   3. stats (serviceAppointments aggregate)
//   4. repairer reviews (if repairerId found)
//   5. repairer services (if repairerId found)
function setupSuccessSelectMocks() {
  let callCount = 0
  mockSelect.mockImplementation(() => {
    callCount++
    switch (callCount) {
      case 1: {
        // repairerProfiles lookup
        const mockWhere = jest.fn().mockResolvedValue([{ id: 'rep-1' }])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 2: {
        // bookings query: .from().innerJoin().innerJoin().where().orderBy().limit()
        const mockLimit = jest.fn().mockResolvedValue([
          {
            id: 'booking-1',
            customer_name: 'Kunde',
            customer_email: 'kunde@example.com',
            service_name: 'Laptop Reparatur',
            status: 'completed',
            urgency: 'normal',
            preferred_date: new Date(),
            confirmed_date: null,
            description: 'Tastatur kaputt',
            device_info: null,
            price_charged_cents: 8000,
            created_at: new Date(),
          },
        ])
        const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit })
        const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockInnerJoin2 = jest.fn().mockReturnValue({ where: mockWhere })
        const mockInnerJoin = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin2, where: mockWhere })
        const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
        return { from: mockFrom }
      }
      case 3: {
        // stats query
        const mockWhere = jest.fn().mockResolvedValue([MOCK_STATS])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 4: {
        // reviews (rating info)
        const mockWhere = jest.fn().mockResolvedValue([{ average_rating: '4.5', review_count: '8' }])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      case 5: {
        // services
        const mockOrderBy = jest.fn().mockResolvedValue([])
        const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      default:
        return makeChainThat([])
    }
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_REPAIRER_SESSION)
})

// ============================================================================
// GET — auth checks
// ============================================================================

describe('GET /api/repairer/dashboard — authentication', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it('returns 401 when user has no session.user', async () => {
    mockAuth.mockResolvedValueOnce({ expires: '2027-01-01' })
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })

  it('returns 401 when user is a regular customer (not repairer, not staff)', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-2', email: 'customer@example.com', role: 'customer', isStaff: false },
      expires: '2027-01-01',
    })
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET — success cases
// ============================================================================

describe('GET /api/repairer/dashboard — success', () => {
  it('returns 200 with dashboard data for repairer role', async () => {
    setupSuccessSelectMocks()
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.stats).toBeDefined()
    expect(body.data.bookings).toBeDefined()
    expect(body.data.services).toBeDefined()
  })

  it('returns 200 for staff user', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    setupSuccessSelectMocks()
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(200)
  })

  it('returns correct stats shape', async () => {
    setupSuccessSelectMocks()
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    const body = await response.json()
    const { stats } = body.data
    expect(typeof stats.totalBookings).toBe('number')
    expect(typeof stats.completedBookings).toBe('number')
    expect(typeof stats.pendingBookings).toBe('number')
    expect(typeof stats.confirmedBookings).toBe('number')
    expect(typeof stats.totalRevenue).toBe('number')
    expect(typeof stats.averageRating).toBe('number')
    expect(typeof stats.reviewCount).toBe('number')
  })

  it('converts price_charged_cents to CHF in bookings', async () => {
    setupSuccessSelectMocks()
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    const body = await response.json()
    // 8000 cents = 80 CHF
    expect(body.data.bookings[0].price).toBe(80)
  })

  it('converts total_revenue cents to CHF in stats', async () => {
    setupSuccessSelectMocks()
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    const body = await response.json()
    // 50000 cents = 500 CHF
    expect(body.data.stats.totalRevenue).toBe(500)
  })

  it('returns 500 when DB throws', async () => {
    mockSelect.mockImplementation(() => { throw new Error('DB error') })
    const req = new NextRequest('http://localhost/api/repairer/dashboard')
    const response = await GET(req)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
