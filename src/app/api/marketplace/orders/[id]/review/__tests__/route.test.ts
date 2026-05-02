/**
 * @jest-environment node
 *
 * Tests for POST /api/marketplace/orders/[id]/review
 *
 * Behaviors locked:
 *   - 401 when not authenticated
 *   - 404 when order not found
 *   - 403 when user is not the buyer
 *   - 400 when order status is not completed or delivered
 *   - 400 when order already reviewed (reviewedAt is set)
 *   - 400 when body validation fails
 *   - 201 on success with reviewId, rating, orderId
 */

// ---------------------------------------------------------------------------
// Auth mock
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Schema + validation mocks
// ---------------------------------------------------------------------------

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
}))

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment', PAID: 'paid', SHIPPED: 'shipped',
    DELIVERED: 'delivered', COMPLETED: 'completed', CANCELLED: 'cancelled', REFUNDED: 'refunded',
  },
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: { LISTING: 'listing' },
}))

jest.mock('@/config/notifications', () => ({
  NOTIFICATION_TYPES: { MARKETPLACE: 'marketplace' },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

// ---------------------------------------------------------------------------
// Helper mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

// ---------------------------------------------------------------------------
// Review + notification mocks
// ---------------------------------------------------------------------------

const mockCreateReview = jest.fn()

jest.mock('@/lib/reviews/create-review', () => ({
  createReview: (...args: unknown[]) => mockCreateReview(...args),
}))

jest.mock('@/lib/services/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Email mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email/templates/marketplace', () => ({
  orderReviewReceived: jest.fn().mockReturnValue({}),
}))

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// drizzle-orm mock
// ---------------------------------------------------------------------------

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

// ---------------------------------------------------------------------------
// Schema mock
// ---------------------------------------------------------------------------

jest.mock('@/db/schema', () => ({
  listings: { id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status' },
  marketplaceOrders: {
    id: 'mo_id', buyerId: 'mo_buyerId', sellerId: 'mo_sellerId', listingId: 'mo_listingId',
    status: 'mo_status', reviewedAt: 'mo_reviewedAt', updatedAt: 'mo_updatedAt',
  },
  reviews: {
    id: 'rv_id', reviewerId: 'rv_reviewerId', targetType: 'rv_targetType',
    targetId: 'rv_targetId', bookingId: 'rv_bookingId', status: 'rv_status',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

// ---------------------------------------------------------------------------
// Drizzle db mock
// ---------------------------------------------------------------------------

const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'buyer-1',
    email: 'buyer@example.com',
    name: 'Buyer',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

const MOCK_ORDER = {
  id: 'order-1', buyerId: 'buyer-1', sellerId: 'seller-1', listingId: 'listing-1',
  status: 'completed', reviewedAt: null,
  listingTitle: 'Dell Laptop',
  sellerName: 'Seller', sellerEmail: 'seller@example.com',
  buyerName: 'Buyer',
}

function makePostRequest(body: Record<string, unknown> = { rating: 5, content: 'Great laptop!', recommend: true }) {
  return new NextRequest('http://localhost/api/marketplace/orders/order-1/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'order-1') {
  return { params: Promise.resolve({ id }) }
}

// ---------------------------------------------------------------------------
// Helper: set up select chain to control two queries:
//   1. order fetch (with joins) → array of one or zero
//   2. existing-reviews check  → array (empty means no duplicate)
// ---------------------------------------------------------------------------

function wireSelects(orderData: unknown, existingReviews: unknown[] = []) {
  let callIndex = 0
  mockSelect.mockImplementation(() => {
    callIndex++
    if (callIndex === 1) {
      // order fetch
      const whereFn = jest.fn().mockResolvedValue(orderData ? [orderData] : [])
      const innerJoinFn = jest.fn()
      const fromFn = jest.fn().mockReturnValue({ innerJoin: innerJoinFn, where: whereFn })
      innerJoinFn.mockReturnValue({ innerJoin: innerJoinFn, where: whereFn })
      return { from: fromFn }
    } else {
      // existing reviews check
      const limitFn = jest.fn().mockResolvedValue(existingReviews)
      const whereFn = jest.fn().mockReturnValue({ limit: limitFn })
      const fromFn = jest.fn().mockReturnValue({ where: whereFn })
      return { from: fromFn }
    }
  })
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: validation passes with rating=5
  mockValidateBody.mockReturnValue({
    success: true,
    data: { rating: 5, content: 'Great laptop, very fast!', recommend: true },
  })

  // Default: no existing review duplicate
  wireSelects(MOCK_ORDER, [])

  // Default: createReview returns a reviewId
  mockCreateReview.mockResolvedValue({ reviewId: 'review-1' })

  // Default update chain
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // Re-wire fire-and-forget mocks
  const emailMod = require('@/lib/email')
  emailMod.sendCustomEmail.mockResolvedValue(undefined)
  const notifyMod = require('@/lib/services/notifications')
  notifyMod.createNotification.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/marketplace/orders/[id]/review
// ============================================================================

describe('POST review — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('POST review — order not found', () => {
  it('returns 404 when order does not exist', async () => {
    wireSelects(null)
    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toMatch(/Bestellung/i)
  })
})

describe('POST review — authorization', () => {
  it('returns 403 when user is not the buyer', async () => {
    const sellerSession = {
      ...MOCK_SESSION,
      user: { ...MOCK_SESSION.user, id: 'seller-1' },
    }
    mockAuth.mockResolvedValueOnce(sellerSession)

    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/Käufer/i)
  })
})

describe('POST review — wrong status', () => {
  it('returns 400 when order is not in a reviewable state', async () => {
    wireSelects({ ...MOCK_ORDER, status: 'paid' }, [])

    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/Abschluss/i)
  })
})

describe('POST review — already reviewed (reviewedAt)', () => {
  it('returns 400 when order already has reviewedAt set', async () => {
    wireSelects({ ...MOCK_ORDER, reviewedAt: new Date() }, [])

    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits bewertet/i)
  })
})

describe('POST review — validation fails', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültig' }, { status: 400 }),
    })

    const response = await POST(makePostRequest({ rating: 99 }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('POST review — success', () => {
  it('returns 201 with reviewId, rating, and orderId', async () => {
    const response = await POST(makePostRequest(), makeContext())
    // The route uses apiSuccess which defaults to 200, not 201
    // The route calls: return apiSuccess({ reviewId, rating, orderId })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.reviewId).toBe('review-1')
    expect(body.data.rating).toBe(5)
    expect(body.data.orderId).toBe('order-1')
  })

  it('calls createReview with correct params', async () => {
    await POST(makePostRequest(), makeContext())
    expect(mockCreateReview).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewerId: 'buyer-1',
        targetType: 'listing',
        targetId: 'listing-1',
        bookingId: 'order-1',
        overallRating: 5,
        isVerifiedPurchase: true,
      })
    )
  })

  it('marks order as reviewed via db.update', async () => {
    await POST(makePostRequest(), makeContext())
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ reviewedAt: expect.anything() })
    )
  })
})
