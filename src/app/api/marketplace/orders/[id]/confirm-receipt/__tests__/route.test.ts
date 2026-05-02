/**
 * @jest-environment node
 *
 * Tests for POST /api/marketplace/orders/[id]/confirm-receipt
 *
 * Behaviors locked:
 *   - 401 when not authenticated
 *   - 404 when order not found
 *   - 403 when user is not the buyer
 *   - 400 when order status is not shipped or delivered
 *   - 200 on success — order completed, listing sold
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
// Config mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace', () => ({
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment', PAID: 'paid', SHIPPED: 'shipped',
    DELIVERED: 'delivered', COMPLETED: 'completed', CANCELLED: 'cancelled', REFUNDED: 'refunded',
  },
  LISTING_STATUS: { ACTIVE: 'active', SOLD: 'sold', RESERVED: 'reserved', DRAFT: 'draft', REMOVED: 'removed' },
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
// Payment mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/payments/payrexx-client', () => ({
  captureTransaction: jest.fn().mockResolvedValue({ success: true }),
  cancelTransaction: jest.fn().mockResolvedValue({ success: true }),
}))

// ---------------------------------------------------------------------------
// Email mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email/templates/marketplace', () => ({
  orderReceiptConfirmed: jest.fn().mockReturnValue({}),
  orderReviewPrompt: jest.fn().mockReturnValue({}),
}))

// ---------------------------------------------------------------------------
// Notification mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/services/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
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
  listings: {
    id: 'l_id', sellerId: 'l_sellerId', title: 'l_title', status: 'l_status',
  },
  marketplaceOrders: {
    id: 'mo_id', buyerId: 'mo_buyerId', sellerId: 'mo_sellerId', listingId: 'mo_listingId',
    amountChf: 'mo_amountChf', status: 'mo_status',
    payrexxTransactionId: 'mo_payrexxTransactionId',
    completedAt: 'mo_completedAt', deliveredAt: 'mo_deliveredAt', updatedAt: 'mo_updatedAt',
  },
  sellerProfiles: {
    id: 'sp_id', userId: 'sp_userId', totalSold: 'sp_totalSold',
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
  amountChf: '350', status: 'shipped',
  payrexxTransactionId: 'tx-123',
  listingTitle: 'Dell Laptop',
  buyerName: 'Buyer', buyerEmail: 'buyer@example.com',
  sellerName: 'Seller', sellerEmail: 'seller@example.com',
}

function makePostRequest() {
  return new NextRequest('http://localhost/api/marketplace/orders/order-1/confirm-receipt', {
    method: 'POST',
  })
}

function makeContext(id = 'order-1') {
  return { params: Promise.resolve({ id }) }
}

// ---------------------------------------------------------------------------
// Helper: wire select chain
// ---------------------------------------------------------------------------

function wireSelectReturning(orderData: unknown) {
  const whereFn = jest.fn().mockResolvedValue(orderData ? [orderData] : [])
  const innerJoinFn = jest.fn()
  const fromFn = jest.fn().mockReturnValue({ innerJoin: innerJoinFn, where: whereFn })
  innerJoinFn.mockReturnValue({ innerJoin: innerJoinFn, where: whereFn })
  mockSelect.mockReturnValue({ from: fromFn })
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  wireSelectReturning(MOCK_ORDER)

  // Default update chain — returns itself for multiple parallel updates
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  // Re-wire fire-and-forget mocks
  const emailMod = require('@/lib/email')
  emailMod.sendCustomEmail.mockResolvedValue(undefined)
  const notifyMod = require('@/lib/services/notifications')
  notifyMod.createNotification.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/marketplace/orders/[id]/confirm-receipt
// ============================================================================

describe('POST confirm-receipt — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('POST confirm-receipt — order not found', () => {
  it('returns 404 when order does not exist', async () => {
    wireSelectReturning(null)
    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toMatch(/Bestellung/i)
  })
})

describe('POST confirm-receipt — authorization', () => {
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

describe('POST confirm-receipt — wrong status', () => {
  it('returns 400 when order status is not shipped or delivered', async () => {
    wireSelectReturning({ ...MOCK_ORDER, status: 'paid' })

    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/versend|geliefert/i)
  })
})

describe('POST confirm-receipt — success', () => {
  it('returns 200 with completed status', async () => {
    const response = await POST(makePostRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.orderId).toBe('order-1')
    expect(body.data.status).toBe('completed')
  })

  it('calls db.update to mark order completed and listing sold', async () => {
    await POST(makePostRequest(), makeContext())
    // Should call update for order, listing, and sellerProfiles (3 parallel updates)
    expect(mockUpdate).toHaveBeenCalledTimes(3)
  })
})
