/**
 * @vitest-environment node
 *
 * Tests for GET /api/marketplace/orders and POST /api/marketplace/orders
 *
 * Behaviors locked:
 *   GET /api/marketplace/orders
 *   - 401 when not authenticated
 *   - 200 with orders and pagination when orders exist
 *   - 200 with empty items when no orders
 *
 *   POST /api/marketplace/orders
 *   - 401 when not authenticated
 *   - 400 when body validation fails
 *   - 400 when listing not found (tx returns empty rows)
 *   - 403 when buyer tries to purchase own listing
 *   - 201 on success with orderId + paymentUrl
 */

// ---------------------------------------------------------------------------
// Auth mock
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<{ id: string }> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

// ---------------------------------------------------------------------------
// Schema + validation mocks
// ---------------------------------------------------------------------------

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  validateQuery: () => ({ success: true, data: { limit: 20, offset: 0, role: 'buyer' } }),
  CreateOrderSchema: {},
  OrdersQuerySchema: {},
}));

// ---------------------------------------------------------------------------
// Config mocks
// ---------------------------------------------------------------------------

vi.mock('@/config/marketplace', () => ({
  LISTING_STATUS: {
    ACTIVE: 'active',
    REMOVED: 'removed',
    SOLD: 'sold',
    DRAFT: 'draft',
    RESERVED: 'reserved',
  },
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },
  ORDER_STATUS_CONFIG: {
    pending_payment: { label: 'Zahlung ausstehend' },
    paid: { label: 'Bezahlt' },
    shipped: { label: 'Versendet' },
    delivered: { label: 'Geliefert' },
    completed: { label: 'Abgeschlossen' },
    cancelled: { label: 'Storniert' },
    refunded: { label: 'Erstattet' },
  },
  COMMISSION_RATE: 0.1,
}));

vi.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }));

// ---------------------------------------------------------------------------
// Helper mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/helpers', async () => {
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
  };
});

// ---------------------------------------------------------------------------
// Payment mocks
// ---------------------------------------------------------------------------

const mockCreateGateway = vi.fn();

vi.mock('@/lib/payments/payrexx-client', () => ({
  PAYREXX_SETUP_MESSAGE: 'Online-Zahlung wird gerade eingerichtet.',
  isPayrexxCheckoutUnavailable: vi.fn((..._args: unknown[]) => false),
  createGateway: (...args: unknown[]) => mockCreateGateway(...args),
  captureTransaction: vi.fn().mockResolvedValue({ success: true }),
  cancelTransaction: vi.fn().mockResolvedValue({ success: true }),
}));

// ---------------------------------------------------------------------------
// Email mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
  orderConfirmationBuyer: vi.fn().mockReturnValue({}),
  newOrderNotificationSeller: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/email/templates/marketplace', () => ({
  orderStatusUpdate: vi.fn().mockReturnValue({}),
  orderReceiptConfirmed: vi.fn().mockReturnValue({}),
  orderReviewPrompt: vi.fn().mockReturnValue({}),
  orderReviewReceived: vi.fn().mockReturnValue({}),
}));

// ---------------------------------------------------------------------------
// Logger mock
// ---------------------------------------------------------------------------

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// drizzle-orm mock
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  count: (a: unknown) => ({ __count: a }),
}));

// ---------------------------------------------------------------------------
// Schema mock
// ---------------------------------------------------------------------------

vi.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id',
    sellerId: 'l_sellerId',
    title: 'l_title',
    status: 'l_status',
    priceChf: 'l_priceChf',
    paymentMode: 'l_paymentMode',
    deliveryOptions: 'l_deliveryOptions',
    shippingCostChf: 'l_shippingCostChf',
  },
  listingImages: {
    id: 'li_id',
    listingId: 'li_listingId',
    url: 'li_url',
    isPrimary: 'li_isPrimary',
  },
  marketplaceOrders: {
    id: 'mo_id',
    buyerId: 'mo_buyerId',
    sellerId: 'mo_sellerId',
    listingId: 'mo_listingId',
    amountChf: 'mo_amountChf',
    commissionChf: 'mo_commissionChf',
    sellerPayoutChf: 'mo_sellerPayoutChf',
    status: 'mo_status',
    deliveryMethod: 'mo_deliveryMethod',
    shippingAddress: 'mo_shippingAddress',
    payrexxTransactionId: 'mo_payrexxTransactionId',
    paymentProvider: 'mo_paymentProvider',
    stripePaymentIntentId: 'mo_stripePaymentIntentId',
    reviewedAt: 'mo_reviewedAt',
    completedAt: 'mo_completedAt',
    deliveredAt: 'mo_deliveredAt',
    createdAt: 'mo_createdAt',
    updatedAt: 'mo_updatedAt',
  },
  marketplaceOrderItems: {
    id: 'moi_id',
    orderId: 'moi_orderId',
    listingId: 'moi_listingId',
  },
  sellerProfiles: {
    id: 'sp_id',
    userId: 'sp_userId',
    averageRating: 'sp_averageRating',
    totalReviews: 'sp_totalReviews',
    displayName: 'sp_displayName',
  },
  reviews: {
    id: 'rv_id',
    reviewerId: 'rv_reviewerId',
    targetType: 'rv_targetType',
    targetId: 'rv_targetId',
    status: 'rv_status',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

// ---------------------------------------------------------------------------
// Drizzle db mock
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockInsertReturning = vi.fn();
const mockTransactionFn = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
    // delete: factory cannot reference mockDeleteWhere (not yet initialized at hoist time);
    // wire the where chain in beforeEach via mockDelete.mockReturnValue instead
    delete: (...args: unknown[]) => mockDelete(...args),
    transaction: (...args: unknown[]) => mockTransactionFn(...args),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

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
};

const MOCK_ORDER = {
  id: 'order-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  listingId: 'listing-1',
  amountChf: '350',
  status: 'paid',
  deliveryMethod: 'shipping',
  shippingAddress: '{"street":"Main St","city":"Zürich"}',
  payrexxTransactionId: 'tx-123',
  paymentProvider: 'payrexx',
  reviewedAt: null,
  completedAt: null,
  listingTitle: 'Dell Laptop',
  createdAt: new Date(),
  updatedAt: new Date(),
  commissionChf: '35',
  sellerPayoutChf: '315',
  counterpartyName: 'Seller Name',
  counterpartyId: 'seller-1',
  thumbnail: null,
};

const MOCK_LISTING_ROW = {
  id: 'listing-1',
  seller_id: 'seller-1',
  title: 'Dell Laptop',
  price_chf: '350',
  payment_mode: 'escrow',
  delivery_options: 'both',
  shipping_cost_chf: null,
  status: 'active',
};

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/marketplace/orders');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/marketplace/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Helper: wire a full select chain
// ---------------------------------------------------------------------------

function setupSelectChain(result: unknown[]) {
  const offsetFn = vi.fn().mockResolvedValue(result);
  const limitFn = vi.fn().mockReturnValue({ offset: offsetFn });
  const orderByFn = vi.fn().mockReturnValue({ limit: limitFn });
  const whereFn = vi.fn().mockReturnValue({ orderBy: orderByFn, limit: limitFn });
  const innerJoinFn = vi.fn();
  const leftJoinFn = vi.fn();
  const fromFn = vi.fn().mockReturnValue({
    innerJoin: innerJoinFn,
    leftJoin: leftJoinFn,
    where: whereFn,
    orderBy: orderByFn,
  });
  innerJoinFn.mockReturnValue({
    innerJoin: innerJoinFn,
    leftJoin: leftJoinFn,
    where: whereFn,
    orderBy: orderByFn,
  });
  leftJoinFn.mockReturnValue({
    leftJoin: leftJoinFn,
    innerJoin: innerJoinFn,
    where: whereFn,
    orderBy: orderByFn,
  });
  return { from: fromFn, where: whereFn, orderBy: orderByFn, limit: limitFn, offset: offsetFn };
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // Default validate passes
  mockValidateBody.mockReturnValue({
    success: true,
    data: {
      listing_id: 'listing-1',
      delivery_method: 'pickup',
      shipping_address: null,
    },
  });

  // Default gateway success
  mockCreateGateway.mockResolvedValue({ id: 42, link: 'https://payrexx.com/pay/gw-42' });

  // Default update chain
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  // Default insert chain
  mockValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'order-1' }]);

  // Default delete chain (wired here not in factory to avoid hoisting issues)
  mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

  // Default transaction: success path
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue({ rows: [MOCK_LISTING_ROW] }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'order-1' }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      }),
    };
    return callback(mockTx);
  });

  // Re-wire fire-and-forget email mocks — resetAllMocks() wipes implementations,
  // so these must be restored or .catch() calls on undefined will throw inside the route
  const emailMod = (await import('@/lib/email')) as any;
  emailMod.sendCustomEmail.mockResolvedValue({ success: true });
  emailMod.orderConfirmationBuyer.mockReturnValue({});
  emailMod.newOrderNotificationSeller.mockReturnValue({});

  // Default select: simple chain (for POST fire-and-forget seller lookup).
  // GET tests override this with the count+orders two-call setup.
  const limitFn = vi.fn().mockResolvedValue([]);
  const sellerWhereFn = vi.fn().mockReturnValue({ limit: limitFn });
  const sellerFromFn = vi.fn().mockReturnValue({ where: sellerWhereFn });
  mockSelect.mockReturnValue({ from: sellerFromFn });
});

// ============================================================================
// GET /api/marketplace/orders
// ============================================================================

describe('GET /api/marketplace/orders — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('GET /api/marketplace/orders — with orders', () => {
  beforeEach(() => {
    // Override select: call 1 = count, call 2 = orders with one row
    let callIndex = 0;
    mockSelect.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        const whereFn = vi.fn().mockResolvedValue([{ total: 1 }]);
        const fromFn = vi.fn().mockReturnValue({ where: whereFn });
        return { from: fromFn };
      } else {
        const chain = setupSelectChain([MOCK_ORDER]);
        return { from: chain.from };
      }
    });
  });

  it('returns 200 with orders and pagination', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].id).toBe('order-1');
    expect(body.data.pagination).toMatchObject({ total: 1, limit: 20, offset: 0 });
  });
});

describe('GET /api/marketplace/orders — empty', () => {
  it('returns 200 with empty items and pagination total 0', async () => {
    let callIndex = 0;
    mockSelect.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        const whereFn = vi.fn().mockResolvedValue([{ total: 0 }]);
        const fromFn = vi.fn().mockReturnValue({ where: whereFn });
        return { from: fromFn };
      } else {
        const chain = setupSelectChain([]);
        return { from: chain.from };
      }
    });

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });
});

// ============================================================================
// POST /api/marketplace/orders
// ============================================================================

describe('POST /api/marketplace/orders — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('POST /api/marketplace/orders — validation', () => {
  it('returns 400 when body validation fails', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makePostRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('POST /api/marketplace/orders — listing not found', () => {
  it('returns 400 when listing not found in transaction', async () => {
    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue({ rows: [] }), // empty → throws OrderValidationError
        insert: vi.fn(),
        update: vi.fn(),
      };
      return callback(mockTx);
    });

    const response = await POST(
      makePostRequest({ listing_id: 'missing-1', delivery_method: 'pickup' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/nicht gefunden/i);
  });
});

describe('POST /api/marketplace/orders — self-purchase forbidden', () => {
  it('returns 403 when buyer is the seller', async () => {
    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue({
          rows: [{ ...MOCK_LISTING_ROW, seller_id: 'buyer-1' }], // buyer-1 is also the seller
        }),
        insert: vi.fn(),
        update: vi.fn(),
      };
      return callback(mockTx);
    });

    const response = await POST(
      makePostRequest({ listing_id: 'listing-1', delivery_method: 'pickup' }),
    );
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toMatch(/eigenes Inserat/i);
  });
});

describe('POST /api/marketplace/orders — success', () => {
  it('returns 201 with orderId and paymentUrl', async () => {
    const response = await POST(
      makePostRequest({
        listing_id: 'listing-1',
        delivery_method: 'pickup',
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.orderId).toBe('order-1');
    expect(body.data.paymentUrl).toBe('https://payrexx.com/pay/gw-42');
  });

  it('calls createGateway with CHF amount in Rappen', async () => {
    await POST(makePostRequest({ listing_id: 'listing-1', delivery_method: 'pickup' }));
    expect(mockCreateGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 35000, // CHF 350 × 100 Rappen
        currency: 'CHF',
      }),
    );
  });

  it('buyer + seller email orderUrl points to /dashboard/orders/<id> (not the previous /marketplace/orders/<id> which 404s)', async () => {
    const emailMod = (await import('@/lib/email')) as any;
    // Seller lookup returns a valid recipient so the fire-and-forget chain runs
    const limitFn = vi.fn().mockResolvedValue([{ email: 'seller@example.com', name: 'Seller' }]);
    const sellerWhereFn = vi.fn().mockReturnValue({ limit: limitFn });
    const sellerFromFn = vi.fn().mockReturnValue({ where: sellerWhereFn });
    mockSelect.mockReturnValue({ from: sellerFromFn });

    await POST(makePostRequest({ listing_id: 'listing-1', delivery_method: 'pickup' }));
    // Flush the fire-and-forget DB-lookup → sendCustomEmail chain for the seller
    await new Promise((resolve) => setImmediate(resolve));

    expect(emailMod.orderConfirmationBuyer).toHaveBeenCalledWith(
      expect.objectContaining({
        orderUrl: 'https://example.com/dashboard/orders/order-1',
      }),
    );
    expect(emailMod.newOrderNotificationSeller).toHaveBeenCalledWith(
      expect.objectContaining({
        orderUrl: 'https://example.com/dashboard/orders/order-1',
      }),
    );
  });
});
