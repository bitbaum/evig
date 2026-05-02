/**
 * @jest-environment node
 *
 * Tests for GET /api/user/donations
 *
 * Mission-relevant: users review their donation history in the dashboard.
 * If this returns rows for the wrong user or a broken error response, donors
 * see incorrect histories or get unhelpful error messages.
 *
 * Behaviors locked:
 *   GET /api/user/donations
 *   - returns 401 when not authenticated
 *   - returns 200 with donation rows for the authenticated user
 *   - returns empty array when user has no donations
 *   - queries only the current user's donations (userId filter)
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockOrderBy = jest.fn()
const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  donations: {
    id: 'd_id', userId: 'd_userId', donationType: 'd_type',
    amountCents: 'd_amount', currency: 'd_currency',
    paymentMethod: 'd_payment', deviceCategory: 'd_category',
    deviceDescription: 'd_desc', deviceBrand: 'd_brand',
    deviceModel: 'd_model', deviceCondition: 'd_condition',
    estimatedValueCents: 'd_value', status: 'd_status',
    receiptRequested: 'd_receipt_req', receiptSent: 'd_receipt_sent',
    createdAt: 'd_created',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown, status = 200) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data }, { status })
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

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
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
  user: { id: 'user-55', email: 'donor@example.com', name: 'Donor', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

const MOCK_DONATIONS = [
  {
    id: 'don-1', donation_type: 'device', amount_cents: null, currency: 'CHF',
    payment_method: null, device_category: 'laptop', device_description: 'ThinkPad T14',
    device_brand: 'Lenovo', device_model: 'T14', device_condition: 'good',
    estimated_value_cents: 30000, status: 'received', receipt_requested: false,
    receipt_sent: false, created_at: '2026-04-01',
  },
]

function makeRequest() {
  return new NextRequest('http://localhost/api/user/donations')
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue(MOCK_DONATIONS)
})

// ============================================================================
// GET /api/user/donations
// ============================================================================

describe('GET /api/user/donations — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/user/donations — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns donation rows array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].device_category).toBe('laptop')
  })

  it('returns empty array when user has no donations', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data).toEqual([])
  })

  it('filters by session user id', async () => {
    await GET(makeRequest())
    const { eq } = await import('drizzle-orm')
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-55')
  })

  it('returns 500 when DB throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
