/**
 * @jest-environment node
 *
 * Tests for GET /api/marketplace/orders/[id] and PATCH /api/marketplace/orders/[id]
 *
 * Behaviors locked:
 *   GET /api/marketplace/orders/[id]
 *   - 401 when not authenticated
 *   - 403 when user is neither buyer nor seller
 *   - 200 with order data and role for buyer
 *
 *   PATCH /api/marketplace/orders/[id]
 *   - 401 when not authenticated
 *   - 400 when status validation fails
 *   - 403 when user has no role (not buyer or seller)
 *   - 400 when status transition is not allowed
 *   - 200 when buyer cancels a paid order
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
  validateQuery: () => ({ success: true, data: {} }),
  UpdateOrderStatusSchema: {},
}))

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', SOLD: 'sold', DRAFT: 'draft', RESERVED: 'reserved' },
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment', PAID: 'paid', SHIPPED: 'shipped',
    DELIVERED: 'delivered', COMPLETED: 'completed', CANCELLED: 'cancelled', REFUNDED: 'refunded',
  },
  ORDER_STATUS_CONFIG: {
    pending_payment: { label: 'Zahlung ausstehend' }, paid: { label: 'Bezahlt' },
    shipped: { label: 'Versendet' }, delivered: { label: 'Geliefert' },
    completed: { label: 'Abgeschlossen' }, cancelled: { label: 'Storniert' },
    refunded: { label: 'Erstattet' },
  },
  // Mirror of the real ORDER_TRANSITIONS SSOT (resolveTransition reads this).
  ORDER_TRANSITIONS: [
    { action: 'shipped', from: 'paid', role: 'seller', to: 'shipped' },
    { action: 'delivered', from: 'shipped', role: 'seller', to: 'delivered' },
    { action: 'completed', from: 'delivered', role: 'buyer', to: 'completed' },
    { action: 'cancelled', from: 'paid', role: 'buyer', to: 'cancelled' },
    { action: 'cancelled', from: 'pending_payment', role: ['buyer', 'seller'], to: 'cancelled' },
  ],
  COMMISSION_RATE: 0.1,
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
    parsePagination: () => ({ limit: 20, offset: 0 }),
  }
})

// ---------------------------------------------------------------------------
// Payment mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/payments/payrexx-client', () => ({
  createGateway: jest.fn().mockResolvedValue({ id: 'gw-1', link: 'https://payrexx.com/pay/gw-1' }),
  captureTransaction: jest.fn().mockResolvedValue({ success: true }),
  cancelTransaction: jest.fn().mockResolvedValue({ success: true }),
}))

// ---------------------------------------------------------------------------
// Email mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/email/templates/marketplace', () => ({
  orderStatusUpdate: jest.fn().mockReturnValue({}),
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
  or: (...args: unknown[]) => ({ __or: args }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  count: (a: unknown) => ({ __count: a }),
}))

// ---------------------------------------------------------------------------
// Schema mock
// ---------------------------------------------------------------------------

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
    priceChf: 'l_priceChf', paymentMode: 'l_paymentMode', deliveryOptions: 'l_deliveryOptions',
    shippingCostChf: 'l_shippingCostChf',
  },
  listingImages: { id: 'li_id', listingId: 'li_listingId', url: 'li_url', isPrimary: 'li_isPrimary' },
  marketplaceOrders: {
    id: 'mo_id', buyerId: 'mo_buyerId', sellerId: 'mo_sellerId', listingId: 'mo_listingId',
    amountChf: 'mo_amountChf', commissionChf: 'mo_commissionChf', sellerPayoutChf: 'mo_sellerPayoutChf',
    status: 'mo_status', deliveryMethod: 'mo_deliveryMethod', shippingAddress: 'mo_shippingAddress',
    payrexxTransactionId: 'mo_payrexxTransactionId', paymentProvider: 'mo_paymentProvider',
    stripePaymentIntentId: 'mo_stripePaymentIntentId', reviewedAt: 'mo_reviewedAt',
    completedAt: 'mo_completedAt', deliveredAt: 'mo_deliveredAt',
    createdAt: 'mo_createdAt', updatedAt: 'mo_updatedAt',
  },
  marketplaceOrderItems: {
    id: 'moi_id', orderId: 'moi_orderId', listingId: 'moi_listingId',
    title: 'moi_title', unitPriceChf: 'moi_unitPriceChf', quantity: 'moi_quantity',
    createdAt: 'moi_createdAt',
  },
  sellerProfiles: {
    id: 'sp_id', userId: 'sp_userId', totalSold: 'sp_totalSold',
    averageRating: 'sp_averageRating', totalReviews: 'sp_totalReviews', displayName: 'sp_displayName',
  },
  reviews: {
    id: 'rv_id', reviewerId: 'rv_reviewerId', targetType: 'rv_targetType',
    targetId: 'rv_targetId', status: 'rv_status',
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
// The FOR UPDATE lock select inside guardedTransition. Returns the row the
// re-check sees under the lock; set per-test to simulate a race-loser (status
// changed between the pre-lock fetch and acquiring the lock).
const mockTxExecute = jest.fn()

jest.mock('@/db', () => {
  const mkUpdate = (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } }
  return {
    db: {
      select: (...args: unknown[]) => mockSelect(...args),
      update: mkUpdate,
      insert: jest.fn(),
      // guardedTransition runs `db.transaction(cb)`; invoke cb with a fake tx
      // exposing execute (the FOR UPDATE select) + update/select.
      transaction: (cb: (tx: unknown) => unknown) => cb({
        execute: (...a: unknown[]) => mockTxExecute(...a),
        update: mkUpdate,
        select: (...args: unknown[]) => mockSelect(...args),
      }),
    },
  }
})

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

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
  amountChf: '350', commissionChf: '35', sellerPayoutChf: '315',
  status: 'paid', deliveryMethod: 'shipping',
  shippingAddress: '{"street":"Main St","city":"Zürich"}',
  payrexxTransactionId: 'tx-123', paymentProvider: 'payrexx',
  stripePaymentIntentId: null, reviewedAt: null, completedAt: null, deliveredAt: null,
  listingTitle: 'Dell Laptop', thumbnail: null,
  buyerName: 'Buyer', buyerEmail: 'buyer@example.com',
  sellerName: 'Seller', sellerEmail: 'seller@example.com',
  createdAt: new Date(), updatedAt: new Date(),
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/marketplace/orders/order-1')
}

function makePatchRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/marketplace/orders/order-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'order-1') {
  return { params: Promise.resolve({ id }) }
}

// ---------------------------------------------------------------------------
// Helper: wire select chain to return given order data
// ---------------------------------------------------------------------------

function wireSelectReturning(orderData: unknown) {
  // fetchOrderWithDetails: from → leftJoin(listings) → innerJoin → innerJoin → where
  const whereFn = jest.fn().mockResolvedValue(orderData ? [orderData] : [])
  const chain: { leftJoin: jest.Mock; innerJoin: jest.Mock; where: jest.Mock } = {
    leftJoin: jest.fn(),
    innerJoin: jest.fn(),
    where: whereFn,
  }
  chain.leftJoin.mockReturnValue(chain)
  chain.innerJoin.mockReturnValue(chain)
  const fromFn = jest.fn().mockReturnValue(chain)
  mockSelect.mockReturnValue({ from: fromFn })
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: validateBody succeeds with status: 'cancelled'
  mockValidateBody.mockReturnValue({
    success: true,
    data: { status: 'cancelled', tracking_number: undefined, tracking_url: undefined },
  })

  // Default select returns the mock order
  wireSelectReturning(MOCK_ORDER)

  // Default update chain
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // Default: the FOR UPDATE lock sees the same status as the pre-lock fetch
  // (no race). Tests override this to simulate a concurrent transition.
  mockTxExecute.mockResolvedValue({ rows: [{ status: MOCK_ORDER.status }] })

  // Re-wire fire-and-forget email mocks — resetAllMocks() clears implementations,
  // and .catch() on undefined would throw inside the route handler
  const emailMod = require('@/lib/email')
  emailMod.sendCustomEmail.mockResolvedValue({ success: true })
  const templatesMod = require('@/lib/email/templates/marketplace')
  templatesMod.orderStatusUpdate.mockReturnValue({})

  // Re-wire payment mocks (resetAllMocks clears these too)
  const payrexxMod = require('@/lib/payments/payrexx-client')
  payrexxMod.cancelTransaction.mockResolvedValue({ success: true })
  payrexxMod.captureTransaction.mockResolvedValue({ success: true })
})

// ============================================================================
// GET /api/marketplace/orders/[id]
// ============================================================================

describe('GET /api/marketplace/orders/[id] — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('GET /api/marketplace/orders/[id] — authorization', () => {
  it('returns 403 when user is neither buyer nor seller', async () => {
    const otherSession = {
      ...MOCK_SESSION,
      user: { ...MOCK_SESSION.user, id: 'stranger-1' },
    }
    mockAuth.mockResolvedValueOnce(otherSession)

    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/kein Zugriff/i)
  })
})

describe('GET /api/marketplace/orders/[id] — success', () => {
  it('returns 200 with order data and buyer role', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('order-1')
    expect(body.data.role).toBe('buyer')
    expect(body.data.counterpartyName).toBe('Seller')
  })
})

// ============================================================================
// PATCH /api/marketplace/orders/[id]
// ============================================================================

describe('PATCH /api/marketplace/orders/[id] — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest(), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('PATCH /api/marketplace/orders/[id] — validation', () => {
  it('returns 400 when status validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültig' }, { status: 400 }),
    })
    const response = await PATCH(makePatchRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/marketplace/orders/[id] — authorization', () => {
  it('returns 403 when user has no role in the order', async () => {
    const otherSession = {
      ...MOCK_SESSION,
      user: { ...MOCK_SESSION.user, id: 'stranger-1' },
    }
    mockAuth.mockResolvedValueOnce(otherSession)

    const response = await PATCH(makePatchRequest({ status: 'cancelled' }), makeContext())
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/kein Zugriff/i)
  })
})

describe('PATCH /api/marketplace/orders/[id] — invalid transition', () => {
  it('returns 400 when status transition is not allowed', async () => {
    // buyer cannot transition paid → shipped (only seller can)
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'shipped', tracking_number: undefined, tracking_url: undefined },
    })

    const response = await PATCH(makePatchRequest({ status: 'shipped' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht erlaubt/i)
  })
})

describe('PATCH /api/marketplace/orders/[id] — success (buyer cancels)', () => {
  it('returns 200 when buyer cancels a paid order', async () => {
    // cancelTransaction mock is already set up via payrexx-client mock
    const response = await PATCH(makePatchRequest({ status: 'cancelled' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.orderId).toBe('order-1')
    expect(body.data.status).toBe('cancelled')
  })

  it('calls db.update to set cancelled status', async () => {
    await PATCH(makePatchRequest({ status: 'cancelled' }), makeContext())
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalled()
  })
})

// ============================================================================
// PATCH /api/marketplace/orders/[id] — race safety (guardedTransition)
//
// The transition is now applied under a `SELECT ... FOR UPDATE` lock with a
// re-check, so a caller whose pre-lock fetch saw a still-valid state but who
// then loses the race (the row changed before it acquired the lock) aborts
// WITHOUT writing or capturing payment. True FOR UPDATE serialization is a
// Postgres guarantee (exercised in integration/E2E, not this mock); here we
// verify the route's re-check wiring rejects a now-stale transition.
// ============================================================================

describe('PATCH /api/marketplace/orders/[id] — race-loser aborts cleanly', () => {
  it('does not write or capture when the order changed under the lock', async () => {
    const payrexx = require('@/lib/payments/payrexx-client')
    // Pre-lock fetch sees a paid order (buyer cancel is valid)...
    wireSelectReturning({ ...MOCK_ORDER, status: 'paid' })
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'cancelled', tracking_number: undefined, tracking_url: undefined },
    })
    // ...but under the lock the order is already 'cancelled' (a concurrent
    // caller won). The re-check fails → apply is skipped.
    mockTxExecute.mockResolvedValueOnce({ rows: [{ status: 'cancelled' }] })

    const response = await PATCH(makePatchRequest({ status: 'cancelled' }), makeContext())

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/geändert/i)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(payrexx.cancelTransaction).not.toHaveBeenCalled()
    expect(payrexx.captureTransaction).not.toHaveBeenCalled()
  })
})

// ============================================================================
// PATCH /api/marketplace/orders/[id] — security boundaries (regression locks)
//
// The route's STATUS_TRANSITIONS state machine is the SOLE protection against
// a buyer or seller bypassing the Payrexx payment flow. These tests lock in
// the boundaries — any future "simplification" of the transition table or
// role check that regresses one of these cases would be caught here. Same
// shape as the audits that produced the listings (35f1f997) and invoices
// (b740abca) fixes — except those routes HAD the bug; this route does NOT,
// and these regressions ensure it stays that way.
// ============================================================================

describe('PATCH /api/marketplace/orders/[id] — buyer cannot bypass payment flow', () => {
  it('returns 400 when buyer tries to skip PAID → COMPLETED (would short-circuit Payrexx capture)', async () => {
    // Without the transition gate, a buyer could PATCH { status: completed }
    // against their own paid order, which triggers the captureTransaction()
    // call at route.ts:160-168. The buyer would effectively self-confirm
    // delivery and release funds to the seller without the seller ever
    // marking SHIPPED or the buyer marking DELIVERED — bypassing the
    // tracking/handoff trail. The state machine only allows the buyer to
    // move PAID → CANCELLED, not PAID → COMPLETED.
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'completed', tracking_number: undefined, tracking_url: undefined },
    })
    const response = await PATCH(makePatchRequest({ status: 'completed' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht erlaubt/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 when buyer tries to set PAID directly (system-managed by webhook)', async () => {
    // PAID is set by handleMarketplacePayment.RESERVED in the Payrexx
    // webhook. Neither buyer nor seller appears as a target in any
    // STATUS_TRANSITIONS row, so any PATCH targeting PAID is rejected.
    // Buyer is on a PAID order trying to "reaffirm" — blocked.
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'paid', tracking_number: undefined, tracking_url: undefined },
    })
    const response = await PATCH(makePatchRequest({ status: 'paid' }), makeContext())
    expect(response.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/marketplace/orders/[id] — seller cannot self-release escrow', () => {
  beforeEach(() => {
    // Switch session to seller for this block
    mockAuth.mockResolvedValue({
      user: {
        id: 'seller-1',
        email: 'seller@example.com',
        name: 'Seller',
        isStaff: false,
        staffPermissions: [],
      },
      expires: '2027-01-01',
    })
  })

  it('returns 400 when seller tries DELIVERED → COMPLETED (only buyer can complete)', async () => {
    // The DELIVERED → COMPLETED transition is buyer-only — it triggers
    // Payrexx capture, releasing funds to the seller. Letting the seller
    // self-complete would let them grab their own funds without buyer
    // acceptance of the goods.
    wireSelectReturning({ ...MOCK_ORDER, status: 'delivered' })
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'completed', tracking_number: undefined, tracking_url: undefined },
    })
    const response = await PATCH(makePatchRequest({ status: 'completed' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht erlaubt/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 when seller tries to skip PAID → DELIVERED (must mark SHIPPED first)', async () => {
    // The order must transit PAID → SHIPPED → DELIVERED. The intermediate
    // SHIPPED step is what tracks handoff to the carrier; skipping it
    // would let a seller mark "delivered" with no shipping evidence.
    wireSelectReturning({ ...MOCK_ORDER, status: 'paid' })
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { status: 'delivered', tracking_number: undefined, tracking_url: undefined },
    })
    const response = await PATCH(makePatchRequest({ status: 'delivered' }), makeContext())
    expect(response.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
