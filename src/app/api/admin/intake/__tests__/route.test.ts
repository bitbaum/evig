/**
 * @vitest-environment node
 *
 * Tests for POST/GET /api/admin/intake
 *
 * Behaviors locked:
 *   POST /api/admin/intake
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 with item_uuid, product_id, inventory_id
 *   - returns 500 when db.transaction throws
 *
 *   GET /api/admin/intake
 *   - returns 401 when not authenticated
 *   - returns 400 when query is invalid
 *   - returns 200 with items, pagination, statusCounts
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler;
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session);
      });
  },
}));

const mockDbExecute = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema/inventory', () => ({
  aiExtractedProducts: {},
  inventoryItems: {},
  productImages: {},
}));

vi.mock('@/db/schema/misc', () => ({
  donations: {},
}));

vi.mock('@/db/schema/auth', () => ({
  users: {},
}));

vi.mock('drizzle-orm', () => ({
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
    join: (arr: unknown[], _sep: unknown) => ({ __join: arr }),
  }),
  getTableName: (_table: unknown) => 'mock_table',
  SQL: class {},
}));

const mockCreateErfassungProduct = vi.fn();
const mockSyncProductToKivvi = vi.fn();

vi.mock('@/lib/kivvi/sync-product', () => ({
  syncProductToKivvi: (...args: unknown[]) => mockSyncProductToKivvi(...args),
}));

vi.mock('@/lib/erfassung/create-product', () => ({
  createErfassungProduct: (...args: unknown[]) => mockCreateErfassungProduct(...args),
}));

const mockAppendIntakeEvent = vi.fn();

vi.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent(...args),
}));

const mockValidateBody = vi.fn();
const mockValidateQuery = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  validateQuery: (...args: unknown[]) => mockValidateQuery(...args),
}));

vi.mock('@/lib/schemas/intake', () => ({
  IntakeCreateSchema: {},
  IntakeQuerySchema: {},
}));

vi.mock('@/config/intake-status', () => ({
  INTAKE_STATUS: { IN_PROGRESS: 'in_progress', READY: 'ready', PUBLISHED: 'published' },
}));

vi.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { DRAFT: 'draft', PUBLISHED: 'published' },
  PRODUCT_STATUS: { APPROVED: 'approved' },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/config/intake-checklist', () => ({
  INTAKE_TIERS: { REFURBISH: 'refurbish', PARTS: 'parts', RECYCLE: 'recycle' },
  QUICK_CAPTURE_TIER: 'quick',
  isChecklistComplete: vi.fn().mockReturnValue(false),
  hasChecklistFailure: vi.fn().mockReturnValue(false),
  getChecklistProgress: vi.fn().mockReturnValue({ completed: 0, total: 5 }),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),

    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
};

const MOCK_PRODUCT_RESULT = {
  itemUUID: 'uuid-123',
  productId: 'prod-456',
  inventoryId: 'inv-789',
  donationId: null,
  imageUrl: null,
  listingId: null,
  qcRequired: false,
  qcBypassed: false,
};

const MOCK_ITEMS_RESULT = {
  rows: [
    {
      intake_tier: 'refurbish',
      intake_checklist: null,
      category: 'Laptop',
      brand: 'Dell',
      product_name: 'Latitude',
    },
  ],
};

function makePostRequest(
  body: Record<string, unknown> = {
    produktname: 'ThinkPad',
    hersteller: 'Lenovo',
    zustand: 'good',
    intake_tier: 'refurbish',
  },
) {
  return new NextRequest('http://localhost/api/admin/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/intake');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // POST mocks
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}));
  mockCreateErfassungProduct.mockResolvedValue(MOCK_PRODUCT_RESULT);
  mockAppendIntakeEvent.mockResolvedValue(undefined);
  mockValidateBody.mockReturnValue({
    success: true,
    data: {
      produktname: 'ThinkPad',
      hersteller: 'Lenovo',
      zustand: 'good',
      intake_tier: 'refurbish',
    },
  });

  // GET mocks
  mockValidateQuery.mockReturnValue({
    success: true,
    data: { limit: 20, offset: 0 },
  });
  mockDbExecute
    .mockResolvedValueOnce(MOCK_ITEMS_RESULT) // items query
    .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // count query
    .mockResolvedValueOnce({
      rows: [{ in_progress: '1', ready: '0', published: '0', total_unfiltered: '1' }],
    }); // statusCounts

  const checklist = (await import('@/config/intake-checklist')) as any;
  checklist.isChecklistComplete.mockReturnValue(false);
  checklist.getChecklistProgress.mockReturnValue({ completed: 0, total: 5 });
});

// ============================================================================
// POST /api/admin/intake
// ============================================================================

describe('POST /api/admin/intake — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/intake — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makePostRequest({}));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/intake — success', () => {
  it('returns 200 with item_uuid and product_id', async () => {
    const response = await POST(makePostRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.item_uuid).toBe('uuid-123');
    expect(body.data.product_id).toBe('prod-456');
    expect(body.data.inventory_id).toBe('inv-789');
  });

  it('mirrors the device to Kivvi after the transaction commits', async () => {
    await POST(makePostRequest());
    expect(mockSyncProductToKivvi).toHaveBeenCalledTimes(1);
    expect(mockSyncProductToKivvi).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv-789' }),
    );
  });

  it('maps the quality destination to the refurbish checklist tier', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        produktname: 'ThinkPad',
        hersteller: 'Lenovo',
        zustand: 'good',
        destination: 'quality',
      },
    });

    await POST(makePostRequest());

    expect(mockCreateErfassungProduct).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'erfassen' }),
      'admin-1',
      expect.anything(),
      expect.objectContaining({ intakeTier: 'refurbish', checklistGated: true }),
    );
  });

  it('publishes an explicitly untested destination and records the reason atomically', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        produktname: 'Sealed dock',
        hersteller: 'Dell',
        zustand: 'new',
        destination: 'shop_untested',
        verkaufspreis: 40,
        qc_skip_reason: 'factory sealed accessory',
      },
    });
    mockCreateErfassungProduct.mockResolvedValueOnce({
      ...MOCK_PRODUCT_RESULT,
      listingId: 'listing-1',
      qcBypassed: true,
    });

    const response = await POST(makePostRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.published).toBe(true);
    expect(mockCreateErfassungProduct).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'publish' }),
      'admin-1',
      expect.anything(),
      expect.objectContaining({ qcBypassReason: 'factory sealed accessory' }),
    );
    expect(mockAppendIntakeEvent).toHaveBeenCalledTimes(3);
    expect(mockAppendIntakeEvent).toHaveBeenCalledWith(
      'inv-789',
      expect.objectContaining({
        type: 'quality_skipped',
        metadata: { reason: 'factory sealed accessory' },
      }),
      expect.objectContaining({ required: true }),
    );
  });

  it('returns 500 when db.transaction throws', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(makePostRequest());
    expect(response.status).toBe(500);
  });
});

// ============================================================================
// GET /api/admin/intake
// ============================================================================

describe('GET /api/admin/intake — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/intake — validation', () => {
  it('returns 400 when query is invalid', async () => {
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Query-Parameter' },
        { status: 400 },
      ),
    });
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/intake — success', () => {
  it('returns 200 with items, pagination, statusCounts', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
    expect(body.data.statusCounts.inProgress).toBe(1);
  });

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset();
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(500);
  });
});
