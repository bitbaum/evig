/**
 * @jest-environment node
 *
 * Tests for GET /api/user/workshop-registrations
 *
 * Mission-relevant: users check their workshop history and upcoming bookings
 * in the dashboard. If this route returns an error or wrong data, users can't
 * see their registrations and staff gets support requests.
 *
 * Behaviors locked:
 *   GET /api/user/workshop-registrations
 *   - returns 401 when not authenticated
 *   - returns 200 with registrations array for authenticated user
 *   - queries only the current user's registrations (userId filter)
 *   - returns empty array when user has no registrations
 *   - returns 500 error response when DB throws
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
const mockInnerJoin2 = jest.fn().mockReturnValue({ where: mockWhere })
const mockInnerJoin1 = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin2 })
const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin1 })
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshopRegistrations: { id: 'wr_id', userId: 'wr_userId', workshopInstanceId: 'wr_instanceId', status: 'wr_status', createdAt: 'wr_created', updatedAt: 'wr_updated' },
  workshopInstances: { id: 'wi_id', workshopId: 'wi_workshopId', startDate: 'wi_startDate', location: 'wi_location' },
  workshops: { id: 'w_id', title: 'w_title', slug: 'w_slug' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
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
  user: { id: 'user-1', email: 'hans@example.com', name: 'Hans' },
}

const MOCK_REGISTRATIONS = [
  {
    id: 'reg-1',
    workshop_title: 'Linux Grundkurs',
    workshop_slug: 'linux-grundkurs',
    start_date: '2026-06-01',
    location: 'Zürich',
    status: 'confirmed',
    created_at: '2026-05-01',
    updated_at: '2026-05-01',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin1 })
  mockInnerJoin1.mockReturnValue({ innerJoin: mockInnerJoin2 })
  mockInnerJoin2.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue(MOCK_REGISTRATIONS)
})

function makeRequest() {
  return new NextRequest('http://localhost/api/user/workshop-registrations')
}

// ============================================================================
// GET /api/user/workshop-registrations
// ============================================================================

describe('GET /api/user/workshop-registrations — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no user', async () => {
    mockAuth.mockResolvedValueOnce({ user: null })
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/user/workshop-registrations — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns success: true with registrations array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.registrations).toHaveLength(1)
    expect(body.data.registrations[0].workshop_title).toBe('Linux Grundkurs')
  })

  it('returns empty array when user has no registrations', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.registrations).toEqual([])
  })

  it('filters by session user id (queries only current user)', async () => {
    await GET(makeRequest())
    // Verify eq was called with the user's id
    const { eq } = await import('drizzle-orm')
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })
})

describe('GET /api/user/workshop-registrations — error', () => {
  it('returns 500 when DB throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('timeout'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
