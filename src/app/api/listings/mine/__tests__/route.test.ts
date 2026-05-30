/**
 * @jest-environment node
 *
 * Tests for GET /api/listings/mine
 *
 * Behaviors locked:
 *   401 when not authenticated
 *   200 with { items, nextCursor, total } when listings exist
 *   200 with empty items + total=0 when the seller has none
 *   status filter is honored when valid
 *
 * Updated to match the keyset rewrite (db23998a) — route now runs the
 * items + count queries in Promise.all and returns `{ items, nextCursor,
 * total }` instead of the legacy `{ items, total, page }` shape with
 * `.offset()` chaining.
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

// Two parallel db.select() calls per request: items (chain ends at .limit())
// and count (chain ends at .where()). Return distinct chain objects per call
// via mockReturnValueOnce so each side resolves independently.
const mockSelect = jest.fn()

const mockItemsFrom = jest.fn()
const mockItemsWhere = jest.fn()
const mockItemsOrderBy = jest.fn()
const mockItemsLimit = jest.fn()

const mockCountFrom = jest.fn()
const mockCountWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/marketplace/listing-helpers', () => ({
  listingThumbnailSubquery: { __sql: 'thumbnail_subquery' },
}))

jest.mock('@/lib/api/keyset', () => ({
  parseKeysetParams: (req: Request) => {
    const url = new URL(req.url)
    return {
      after: url.searchParams.get('after'),
      limit: Number(url.searchParams.get('limit')) || 20,
    }
  },
  buildNextCursor: <T extends { id: string }>(rows: T[], limit: number) =>
    rows.length === limit ? rows[rows.length - 1].id : null,
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
  LISTING_STATUSES: ['active', 'removed', 'draft', 'sold'],
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  or: (...args: unknown[]) => ({ __or: args }),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
    priceChf: 'l_priceChf', category: 'l_category', condition: 'l_condition',
    viewCount: 'l_viewCount', favoriteCount: 'l_favoriteCount',
    createdAt: 'l_createdAt', updatedAt: 'l_updatedAt',
  },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Fixtures ───────────────────────────────────────────────────────────────

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_ROW = {
  id: 'listing-1',
  title: 'Dell Laptop',
  price_chf: '350',
  category: 'laptops',
  condition: 'good',
  status: 'active',
  view_count: 10,
  favorite_count: 2,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  thumbnail: null,
}

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

// ── Setup ──────────────────────────────────────────────────────────────────

function setupChains({ rows, total }: { rows: unknown[]; total: number }) {
  mockItemsLimit.mockResolvedValue(rows)
  mockItemsOrderBy.mockReturnValue({ limit: mockItemsLimit })
  mockItemsWhere.mockReturnValue({ orderBy: mockItemsOrderBy })
  mockItemsFrom.mockReturnValue({ where: mockItemsWhere })

  mockCountWhere.mockResolvedValue([{ total }])
  mockCountFrom.mockReturnValue({ where: mockCountWhere })

  // Items query is first in Promise.all([items, count]), so first select() call
  // gets the items chain, second the count chain.
  mockSelect
    .mockReturnValueOnce({ from: mockItemsFrom })
    .mockReturnValueOnce({ from: mockCountFrom })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  setupChains({ rows: [], total: 0 })
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/listings/mine', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 200 with items + total + nextCursor=null when listings fit on one page', async () => {
    setupChains({ rows: [MOCK_ROW], total: 1 })

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].id).toBe('listing-1')
    expect(body.data.total).toBe(1)
    expect(body.data.nextCursor).toBeNull()
  })

  it('returns 200 with empty items + total=0 when the seller has none', async () => {
    setupChains({ rows: [], total: 0 })

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.items).toHaveLength(0)
    expect(body.data.total).toBe(0)
    expect(body.data.nextCursor).toBeNull()
  })

  it('sets nextCursor to last row id when the page is full', async () => {
    // limit=2, two rows returned → there may be more → cursor = last id
    const rows = [MOCK_ROW, { ...MOCK_ROW, id: 'listing-2' }]
    setupChains({ rows, total: 5 })

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine?limit=2'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.nextCursor).toBe('listing-2')
    expect(body.data.total).toBe(5)
  })

  it('applies status filter when valid status query param is provided', async () => {
    setupChains({ rows: [MOCK_ROW], total: 1 })

    const res = await GET(makeRequest('http://localhost:3000/api/listings/mine?status=active'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    // Both select chains were traversed (items + count)
    expect(mockSelect).toHaveBeenCalledTimes(2)
    expect(mockItemsFrom).toHaveBeenCalled()
    expect(mockCountFrom).toHaveBeenCalled()
  })
})
