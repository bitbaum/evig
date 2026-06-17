/**
 * @jest-environment node
 *
 * Tests for POST /api/marketplace/cart/checkout — multi-item RevampIT cart checkout.
 *
 * Behaviours locked:
 *   - 401 when not authenticated
 *   - 400 on invalid body (empty / malformed listing_ids)
 *   - 400 when Payrexx is not configured
 *   - 400 when an item is no longer available / not RevampIT / own listing
 *   - 201 success: one order + N items + all listings reserved + one gateway
 *   - rollback when the Payrexx gateway fails (order deleted, listings restored)
 */

// ---------------------------------------------------------------------------
// Auth middleware mock
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (...a: unknown[]) => unknown)(req, session)
      }),
}))

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', SOLD: 'sold', RESERVED: 'reserved' },
  ORDER_STATUS: { PENDING_PAYMENT: 'pending_payment' },
}))

jest.mock('@/config/org', () => ({ ORG: { name: 'Revamp-IT' } }))
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
  }
})

// ---------------------------------------------------------------------------
// Payrexx mock
// ---------------------------------------------------------------------------

const mockCreateGateway = jest.fn()
const mockUnavailable = jest.fn()

jest.mock('@/lib/payments/payrexx-client', () => ({
  PAYREXX_SETUP_MESSAGE: 'Zahlung ist nicht konfiguriert',
  isPayrexxCheckoutUnavailable: (...a: unknown[]) => mockUnavailable(...a),
  createGateway: (...a: unknown[]) => mockCreateGateway(...a),
}))

// ---------------------------------------------------------------------------
// RevampIT seller id mock
// ---------------------------------------------------------------------------

jest.mock('@/lib/marketplace/publish-revampit-listing', () => ({
  getRevampitSellerId: jest.fn().mockResolvedValue('revampit-seller'),
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
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }), join: (arr: unknown[], _sep: unknown) => ({ __join: arr }) },
  ),
}))

// ---------------------------------------------------------------------------
// Schema mock
// ---------------------------------------------------------------------------

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', priceChf: 'l_priceChf',
    status: 'l_status', isRevampit: 'l_isRevampit',
  },
  marketplaceOrders: { id: 'mo_id' },
  marketplaceOrderItems: { orderId: 'moi_orderId' },
}))

// ---------------------------------------------------------------------------
// db mock — transaction + execute + insert + update + delete
// ---------------------------------------------------------------------------

const mockExecute = jest.fn()
const mockInsertValues = jest.fn()
const mockTxUpdateWhere = jest.fn()
const mockOuterUpdateWhere = jest.fn()
const mockDeleteWhere = jest.fn()

// One tx object reused across transaction calls.
function makeTx() {
  const insertReturning = jest.fn().mockResolvedValue([{ id: 'order-new' }])
  return {
    execute: (...a: unknown[]) => mockExecute(...a),
    insert: () => ({
      values: (...a: unknown[]) => {
        mockInsertValues(...a)
        return { returning: insertReturning, then: (r: (v: unknown) => unknown) => Promise.resolve().then(r) }
      },
    }),
    update: () => ({ set: () => ({ where: (...a: unknown[]) => mockTxUpdateWhere(...a) }) }),
    delete: () => ({ where: (...a: unknown[]) => mockDeleteWhere(...a) }),
  }
}

const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    transaction: (...a: unknown[]) => mockTransaction(...a),
    update: () => ({ set: () => ({ where: (...a: unknown[]) => mockOuterUpdateWhere(...a) }) }),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'buyer-1', email: 'buyer@example.com', name: 'Buyer', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

function lockedRow(id: string, over: Record<string, unknown> = {}) {
  return { id, seller_id: 'revampit-seller', title: `Item ${id.slice(0, 2)}`, price_chf: '100', status: 'active', is_revampit: true, ...over }
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/marketplace/cart/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockUnavailable.mockReturnValue(false)
  mockCreateGateway.mockResolvedValue({ id: 9001, link: 'https://pay.example/abc' })
  mockOuterUpdateWhere.mockResolvedValue(undefined)
  mockTxUpdateWhere.mockResolvedValue(undefined)
  // Default: two available RevampIT items locked.
  mockExecute.mockResolvedValue({ rows: [lockedRow(A), lockedRow(B)] })
  // transaction(cb) runs cb with a fresh tx and returns its result.
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(makeTx()))
})

describe('cart checkout — auth + validation', () => {
  it('401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ listing_ids: [A] }))
    expect(res.status).toBe(401)
  })

  it('400 on empty listing_ids', async () => {
    const res = await POST(makeRequest({ listing_ids: [] }))
    expect(res.status).toBe(400)
  })

  it('400 on malformed body', async () => {
    const res = await POST(makeRequest({ listing_ids: ['not-a-uuid'] }))
    expect(res.status).toBe(400)
  })

  it('400 when Payrexx is unavailable', async () => {
    mockUnavailable.mockReturnValue(true)
    const res = await POST(makeRequest({ listing_ids: [A] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/konfiguriert/i)
  })
})

describe('cart checkout — listing guards', () => {
  it('400 when an item is no longer active', async () => {
    mockExecute.mockResolvedValue({ rows: [lockedRow(A, { status: 'reserved' })] })
    const res = await POST(makeRequest({ listing_ids: [A] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/verfügbar/i)
  })

  it('400 when a listing has vanished (row count mismatch)', async () => {
    mockExecute.mockResolvedValue({ rows: [lockedRow(A)] }) // asked for two, got one
    const res = await POST(makeRequest({ listing_ids: [A, B] }))
    expect(res.status).toBe(400)
  })

  it('400 when a non-RevampIT listing is in the cart', async () => {
    mockExecute.mockResolvedValue({ rows: [lockedRow(A, { is_revampit: false })] })
    const res = await POST(makeRequest({ listing_ids: [A] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Revamp-IT/i)
  })

  it('400 when buying your own listing', async () => {
    mockExecute.mockResolvedValue({ rows: [lockedRow(A, { seller_id: 'buyer-1' })] })
    const res = await POST(makeRequest({ listing_ids: [A] }))
    expect(res.status).toBe(400)
  })
})

describe('cart checkout — success', () => {
  it('201 with order id + payment url; reserves items and opens one gateway', async () => {
    const res = await POST(makeRequest({ listing_ids: [A, B] }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.orderId).toBe('order-new')
    expect(body.data.paymentUrl).toBe('https://pay.example/abc')

    // One gateway for the CHF 200 total (2 × 100), in Rappen.
    expect(mockCreateGateway).toHaveBeenCalledTimes(1)
    expect(mockCreateGateway.mock.calls[0][0]).toMatchObject({ amount: 20000, currency: 'CHF' })
    // Gateway id persisted on the order afterwards.
    expect(mockOuterUpdateWhere).toHaveBeenCalledTimes(1)
  })

  it('dedupes repeated listing ids before checkout', async () => {
    mockExecute.mockResolvedValue({ rows: [lockedRow(A)] })
    const res = await POST(makeRequest({ listing_ids: [A, A] }))
    expect(res.status).toBe(201)
  })
})

describe('cart checkout — gateway failure rollback', () => {
  it('rolls back the order + restores listings when the gateway throws', async () => {
    mockCreateGateway.mockRejectedValueOnce(new Error('payrexx down'))
    const res = await POST(makeRequest({ listing_ids: [A, B] }))
    expect(res.status).toBe(500)
    // Rollback transaction ran: order deleted + listings restored.
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1)
    // gateway id was never persisted.
    expect(mockOuterUpdateWhere).not.toHaveBeenCalled()
  })
})
