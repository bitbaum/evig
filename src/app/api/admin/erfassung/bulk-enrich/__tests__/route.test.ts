/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/erfassung/bulk-enrich
 *
 * Mission-relevant: enforces the per-request product count limit
 * (BULK_LIMITS.maxProducts) to prevent runaway AI calls.
 *
 * Behaviors locked:
 *   POST /api/admin/erfassung/bulk-enrich
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when item count exceeds limit
 *   - returns 200 with enriched items
 *   - returns 500 when extraction throws
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

const mockExtractMultipleProducts = vi.fn();

vi.mock('@/lib/erfassung/bulk-extraction', () => ({
  extractMultipleProducts: (...args: unknown[]) => mockExtractMultipleProducts(...args),
}));

vi.mock('@/config/erfassung', () => ({
  BULK_LIMITS: { maxProducts: 3, saveChunkSize: 10 },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: vi.fn().mockReturnValue({
    success: true,
    data: {
      items: [
        { _tempId: 't-1', hersteller: 'Dell', produktname: 'Latitude' },
        { _tempId: 't-2', hersteller: 'Lenovo', produktname: 'ThinkPad' },
      ],
    },
  }),
  BulkEnrichSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
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

const MOCK_ITEMS = [
  { _tempId: 't-1', hersteller: 'Dell', produktname: 'Latitude' },
  { _tempId: 't-2', hersteller: 'Lenovo', produktname: 'ThinkPad' },
];

const MOCK_ENRICHED = [
  {
    kurzbeschreibung: 'Business laptop',
    hauptkategorie: 'Laptop',
    zustand: 'good',
    verkaufspreis: 299,
  },
  {
    kurzbeschreibung: 'Business laptop 2',
    hauptkategorie: 'Laptop',
    zustand: 'good',
    verkaufspreis: 350,
  },
];

function makeRequest(body: Record<string, unknown> = { items: MOCK_ITEMS }) {
  return new NextRequest('http://localhost/api/admin/erfassung/bulk-enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockExtractMultipleProducts.mockResolvedValue(MOCK_ENRICHED);

  const schemas = (await import('@/lib/schemas')) as any;
  schemas.validateBody.mockReturnValue({ success: true, data: { items: MOCK_ITEMS } });
});

// ============================================================================
// POST /api/admin/erfassung/bulk-enrich
// ============================================================================

describe('POST /api/admin/erfassung/bulk-enrich — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/erfassung/bulk-enrich — validation', () => {
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

  it('returns 400 when item count exceeds limit', async () => {
    const schemas = (await import('@/lib/schemas')) as any;
    schemas.validateBody.mockReturnValueOnce({
      success: true,
      data: {
        items: [
          { _tempId: 't-1', hersteller: 'A', produktname: 'P1' },
          { _tempId: 't-2', hersteller: 'B', produktname: 'P2' },
          { _tempId: 't-3', hersteller: 'C', produktname: 'P3' },
          { _tempId: 't-4', hersteller: 'D', produktname: 'P4' }, // exceeds limit of 3
        ],
      },
    });
    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/erfassung/bulk-enrich — success', () => {
  it('returns 200 with enriched items', async () => {
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.items).toHaveLength(2);
    expect(body.data.items[0].enriched).toBe(true);
  });

  it('returns 500 when extraction throws', async () => {
    mockExtractMultipleProducts.mockRejectedValueOnce(new Error('AI error'));
    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
  });
});
