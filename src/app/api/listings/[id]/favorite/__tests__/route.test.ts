/**
 * @jest-environment node
 *
 * Tests for POST /api/listings/[id]/favorite
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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
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
  listings: { id: 'l_id', sellerId: 'l_sellerId', status: 'l_status', favoriteCount: 'l_favoriteCount' },
  listingFavorites: { id: 'lf_id', userId: 'lf_userId', listingId: 'lf_listingId' },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init as never)
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([])
  mockValues.mockResolvedValue(undefined)
  mockDeleteWhere.mockResolvedValue(undefined)
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/listings/[id]/favorite', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/favorite', { method: 'POST' }),
      makeContext('listing-1')
    )
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 404 when listing does not exist or is not active', async () => {
    // First where call (listing check) returns empty
    mockWhere.mockResolvedValueOnce([])

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/favorite', { method: 'POST' }),
      makeContext('listing-1')
    )
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('adds favorite and returns favorited: true when not already favorited', async () => {
    // Query 1: listing exists
    // Query 2: no existing favorite
    // Query 3: updated count row
    mockWhere
      .mockResolvedValueOnce([{ id: 'listing-1' }])   // listing check
      .mockResolvedValueOnce([])                        // no existing favorite
      .mockResolvedValueOnce([{ favoriteCount: 6 }])   // updated count

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/favorite', { method: 'POST' }),
      makeContext('listing-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.favorited).toBe(true)
    expect(body.data.favorite_count).toBe(6)
    expect(mockInsert).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('removes favorite and returns favorited: false when already favorited', async () => {
    // Query 1: listing exists
    // Query 2: existing favorite found
    // Query 3: updated count row
    mockWhere
      .mockResolvedValueOnce([{ id: 'listing-1' }])        // listing check
      .mockResolvedValueOnce([{ id: 'fav-1' }])            // existing favorite
      .mockResolvedValueOnce([{ favoriteCount: 4 }])        // updated count

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/favorite', { method: 'POST' }),
      makeContext('listing-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.favorited).toBe(false)
    expect(body.data.favorite_count).toBe(4)
    expect(mockDelete).toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('returns favorite_count of 0 when count row is missing after toggle', async () => {
    mockWhere
      .mockResolvedValueOnce([{ id: 'listing-1' }])   // listing check
      .mockResolvedValueOnce([])                        // no existing favorite
      .mockResolvedValueOnce([])                        // count row missing

    const res = await POST(
      makeRequest('http://localhost:3000/api/listings/listing-1/favorite', { method: 'POST' }),
      makeContext('listing-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.favorite_count).toBe(0)
  })
})
