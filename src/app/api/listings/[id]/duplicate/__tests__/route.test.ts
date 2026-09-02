/**
 * @vitest-environment node
 *
 * Tests for POST /api/listings/[id]/duplicate
 *
 * Behaviors locked:
 *   - 401 when not authenticated
 *   - 404 when listing not found
 *   - 403 when not owner
 *   - 200 on success — new listing has " (Kopie)" suffix in title
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
// Config mocks
// ---------------------------------------------------------------------------

vi.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', REMOVED: 'removed', DRAFT: 'draft', SOLD: 'sold' },
}));

vi.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { DRAFT: 'draft' },
}));

// ---------------------------------------------------------------------------
// Helper mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
  };
});

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
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
}));

// ---------------------------------------------------------------------------
// DB Schema mock
// ---------------------------------------------------------------------------

vi.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id',
    sellerId: 'l_sellerId',
    title: 'l_title',
    status: 'l_status',
    priceChf: 'l_priceChf',
    category: 'l_category',
    condition: 'l_condition',
    brand: 'l_brand',
    model: 'l_model',
    deliveryOptions: 'l_deliveryOptions',
    shippingCostChf: 'l_shippingCostChf',
    pickupLocation: 'l_pickupLocation',
    paymentMode: 'l_paymentMode',
    conditionChecks: 'l_conditionChecks',
    description: 'l_description',
  },
  listingSpecs: {
    id: 'ls_id',
    listingId: 'ls_listingId',
    specKey: 'ls_specKey',
    specValue: 'ls_specValue',
    specUnit: 'ls_specUnit',
    normalizedValue: 'ls_normalizedValue',
  },
}));

// ---------------------------------------------------------------------------
// Drizzle chain mocks (declared here, wired in beforeEach)
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockTransactionFn = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    transaction: (...args: unknown[]) => mockTransactionFn(...args),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after all mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

const MOCK_LISTING = {
  sellerId: 'user-1',
  title: 'Dell Laptop',
  description: 'A nice laptop',
  priceChf: '350',
  category: 'laptops',
  condition: 'good',
  brand: 'Dell',
  model: 'XPS',
  deliveryOptions: 'pickup',
  shippingCostChf: null,
  pickupLocation: 'Zürich',
  paymentMode: 'cash',
  conditionChecks: null,
};

function makePostRequest(id = 'listing-1') {
  return new NextRequest(`http://localhost/api/listings/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

function makeContext(id = 'listing-1') {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // Default: listing found, owned by current user
  mockWhere.mockResolvedValue([MOCK_LISTING]);
  mockFrom.mockReturnValue({ where: mockWhere });

  // Default transaction: success — returns new-listing-id
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const mockTxInsertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'new-listing-id' }]),
    });
    const mockTxInsert = vi.fn().mockReturnValue({ values: mockTxInsertValues });

    // specs select inside transaction
    const mockTxSpecsWhere = vi.fn().mockResolvedValue([]); // no specs by default
    const mockTxSpecsFrom = vi.fn().mockReturnValue({ where: mockTxSpecsWhere });
    const mockTxSelect = vi.fn().mockReturnValue({ from: mockTxSpecsFrom });

    const tx = {
      insert: mockTxInsert,
      select: mockTxSelect,
    };
    return callback(tx);
  });
});

// ============================================================================
// POST /api/listings/[id]/duplicate
// ============================================================================

describe('POST /api/listings/[id]/duplicate — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest(), makeContext());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('POST /api/listings/[id]/duplicate — listing checks', () => {
  it('returns 404 when listing not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(makePostRequest(), makeContext());
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 403 when not owner', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_LISTING, sellerId: 'other-user' }]);
    const response = await POST(makePostRequest(), makeContext());
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('POST /api/listings/[id]/duplicate — success', () => {
  it('returns 200 with new listing id', async () => {
    const response = await POST(makePostRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('new-listing-id');
  });

  it('inserts new listing with " (Kopie)" suffix in title', async () => {
    let capturedInsertValues: unknown = null;

    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const mockTxReturning = vi.fn().mockResolvedValue([{ id: 'new-listing-id' }]);
      const mockTxValues = vi.fn().mockImplementation((vals: unknown) => {
        capturedInsertValues = vals;
        return { returning: mockTxReturning };
      });
      const mockTxInsert = vi.fn().mockReturnValue({ values: mockTxValues });

      const mockTxSpecsWhere = vi.fn().mockResolvedValue([]);
      const mockTxSpecsFrom = vi.fn().mockReturnValue({ where: mockTxSpecsWhere });
      const mockTxSelect = vi.fn().mockReturnValue({ from: mockTxSpecsFrom });

      const tx = { insert: mockTxInsert, select: mockTxSelect };
      return callback(tx);
    });

    await POST(makePostRequest(), makeContext());

    expect(capturedInsertValues).not.toBeNull();
    const vals = capturedInsertValues as Record<string, unknown>;
    expect(vals.title).toBe('Dell Laptop (Kopie)');
  });

  it('copies specs when original listing has specs', async () => {
    const mockSpecs = [
      { specKey: 'RAM', specValue: '16GB', specUnit: null, normalizedValue: '16' },
      { specKey: 'Speicher', specValue: '512GB', specUnit: null, normalizedValue: '512' },
    ];

    let specsInserted = false;

    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const mockTxReturning = vi.fn().mockResolvedValue([{ id: 'new-listing-id' }]);
      const mockTxValues = vi.fn().mockReturnValue({ returning: mockTxReturning });
      const mockTxInsert = vi.fn().mockReturnValue({ values: mockTxValues });

      // Track when insert is called a second time (for specs)
      let insertCallCount = 0;
      const trackingInsert = vi.fn().mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 2) specsInserted = true;
        return { values: mockTxValues };
      });

      const mockTxSpecsWhere = vi.fn().mockResolvedValue(mockSpecs); // has specs
      const mockTxSpecsFrom = vi.fn().mockReturnValue({ where: mockTxSpecsWhere });
      const mockTxSelect = vi.fn().mockReturnValue({ from: mockTxSpecsFrom });

      const tx = { insert: trackingInsert, select: mockTxSelect };
      return callback(tx);
    });

    await POST(makePostRequest(), makeContext());
    expect(specsInserted).toBe(true);
  });
});
