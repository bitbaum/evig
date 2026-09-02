/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/erfassung
 *
 * Mission-relevant: product intake into inventory. Uses a DB transaction
 * + createErfassungProduct service. Kivvi sync is fire-and-forget and
 * should never fail the request.
 *
 * Behaviors locked:
 *   POST /api/admin/erfassung
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 with item_uuid and product_id
 *   - returns 200 even when Kivvi sync fails
 *   - returns 500 when DB transaction throws
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

const mockCreateErfassungProduct = vi.fn();
const mockSyncToKivvi = vi.fn();
const mockTransaction = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockCatch = vi.fn();

vi.mock('@/db', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/db/schema/inventory', () => ({
  inventoryItems: {
    id: 'ii_id',
    kivviInventoryItemId: 'ii_kivviId',
    kivviSyncStatus: 'ii_syncStatus',
    kivviSyncedAt: 'ii_syncedAt',
  },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
}));

vi.mock('@/lib/erfassung/create-product', () => ({
  createErfassungProduct: (...args: unknown[]) => mockCreateErfassungProduct(...args),
}));

vi.mock('@/lib/kivvi/client', () => ({
  syncToKivvi: (...args: unknown[]) => mockSyncToKivvi(...args),
  // Route maps zustand → Kivvi enum synchronously while building the sync
  // payload; without this stub it's undefined and throws before the response.
  mapConditionToKivvi: (condition?: string | null) => condition ?? 'fair',
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: vi.fn().mockReturnValue({
    success: true,
    data: {
      action: 'draft',
      produktname: 'ThinkPad X1',
      hersteller: 'Lenovo',
      verkaufspreis: 299,
      zustand: 'good',
    },
  }),
  ErfassungCreateSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

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
  imageUrl: null,
};

function makeRequest(
  body: Record<string, unknown> = { produktname: 'ThinkPad X1', zustand: 'good' },
) {
  return new NextRequest('http://localhost/api/admin/erfassung', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}));
  mockCreateErfassungProduct.mockResolvedValue(MOCK_PRODUCT_RESULT);
  // syncToKivvi: fire-and-forget Promise
  mockSyncToKivvi.mockResolvedValue({ success: true, kivviInventoryItemId: 'k-123' });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ catch: mockCatch });
  mockCatch.mockReturnValue(undefined);

  const schemas = (await import('@/lib/schemas')) as any;
  schemas.validateBody.mockReturnValue({
    success: true,
    data: {
      action: 'draft',
      produktname: 'ThinkPad X1',
      hersteller: 'Lenovo',
      verkaufspreis: 299,
      zustand: 'good',
    },
  });
});

// ============================================================================
// POST /api/admin/erfassung
// ============================================================================

describe('POST /api/admin/erfassung — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/erfassung — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const schemas = (await import('@/lib/schemas')) as any;
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/erfassung — success', () => {
  it('returns 200 with item_uuid and product_id', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.item_uuid).toBe('uuid-123');
    expect(body.data.product_id).toBe('prod-456');
  });

  it('returns 200 even when Kivvi sync fails', async () => {
    mockSyncToKivvi.mockRejectedValueOnce(new Error('Kivvi unavailable'));
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
  });

  it('returns 500 when DB transaction throws', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
  });
});
