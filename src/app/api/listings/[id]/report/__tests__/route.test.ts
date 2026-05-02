/**
 * @jest-environment node
 *
 * Tests for POST /api/listings/[id]/report
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  ReportListingSchema: {},
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
}))

jest.mock('@/db/schema', () => ({
  listings: { id: 'l_id', sellerId: 'l_sellerId', status: 'l_status' },
  listingReports: { id: 'lr_id', listingId: 'lr_listingId', reporterId: 'lr_reporterId', reason: 'lr_reason' },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const SELLER_SESSION = {
  user: { id: 'seller-1', email: 'seller@example.com', name: 'Seller', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const VALID_BODY = { reason: 'spam', details: 'This is spam' }

function makeRequest(url: string, body: unknown = VALID_BODY) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  } as never)
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: validation passes
  mockValidateBody.mockReturnValue({ success: true, data: { reason: 'spam', details: 'details' } })

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([{ sellerId: 'seller-1' }])
  mockValues.mockResolvedValue(undefined)
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/listings/[id]/report', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report'), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 400 when validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server') as typeof import('next/server')
    mockValidateBody.mockReturnValue({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })

    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report', {}), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 404 when listing does not exist or is not active', async () => {
    mockWhere.mockResolvedValue([])

    const res = await POST(makeRequest('http://localhost:3000/api/listings/unknown/report'), makeContext('unknown'))
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 400 when user tries to report their own listing', async () => {
    mockAuth.mockResolvedValue(SELLER_SESSION)
    // Listing sellerId matches session user id
    mockWhere.mockResolvedValue([{ sellerId: 'seller-1' }])

    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report'), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/eigenes Inserat/)
  })

  it('returns 400 when user has already reported the listing (unique constraint violation)', async () => {
    mockValues.mockRejectedValue({ code: '23505' })

    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report'), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/bereits gemeldet/)
  })

  it('returns 200 with reported: true on successful report', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report'), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.reported).toBe(true)
    expect(mockInsert).toHaveBeenCalled()
    expect(mockValues).toHaveBeenCalled()
  })

  it('rethrows non-unique-constraint errors as 500', async () => {
    mockValues.mockRejectedValue(new Error('db connection failed'))

    const res = await POST(makeRequest('http://localhost:3000/api/listings/listing-1/report'), makeContext('listing-1'))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
