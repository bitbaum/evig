/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/intake/[id]/publish
 *
 * Behaviors locked:
 *   POST /api/admin/intake/[id]/publish
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when item not found
 *   - returns 400 when item is already published
 *   - returns 400 when checklist is not complete
 *   - returns 200 on successful publish
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined;
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(
          req,
          session,
          resolvedContext,
        );
      });
  },
}));

const mockDbExecute = vi.fn();
const mockTransaction = vi.fn();
const mockTxUpdate = vi.fn();
const mockTxSet = vi.fn();
const mockTxUpdateWhere = vi.fn();
const mockTxInsert = vi.fn();
const mockTxValues = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema/inventory', () => ({
  aiExtractedProducts: { id: 'aep_id', estimatedPriceChf: 'aep_price', updatedAt: 'aep_updatedAt' },
  inventoryItems: {
    id: 'ii_id',
    marketplaceStatus: 'ii_mktStatus',
    sellingPriceChf: 'ii_price',
    updatedAt: 'ii_updatedAt',
  },
  marketplaceListings: {
    id: 'ml_id',
    inventoryItemId: 'ml_invId',
    priceChf: 'ml_price',
    title: 'ml_title',
    description: 'ml_desc',
    platform: 'ml_platform',
    status: 'ml_status',
    publishedAt: 'ml_publishedAt',
    createdBy: 'ml_createdBy',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_table: unknown) => 'mock_table',
}));

vi.mock('@/config/intake-status', () => ({
  INTAKE_STATUS: { PUBLISHED: 'published', IN_PROGRESS: 'in_progress', READY: 'ready' },
}));

vi.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
}));

vi.mock('@/config/intake-checklist', () => ({
  isChecklistComplete: vi.fn().mockReturnValue(true),
  hasChecklistFailure: vi.fn().mockReturnValue(false),
  requiresQualityControl: vi.fn().mockReturnValue(false),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    INTAKE_ITEM_NOT_FOUND: 'Nicht gefunden',
    INTAKE_ALREADY_PUBLISHED: 'Bereits publiziert',
    INTAKE_CHECKLIST_INCOMPLETE: 'Checkliste unvollständig',
    INTAKE_CHECKLIST_FAILED: 'Prüfung fehlgeschlagen',
    INTAKE_QC_REQUIRED: 'Qualitätskontrolle erforderlich',
  },
}));

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}));

vi.mock('@/lib/schemas/intake', () => ({
  IntakePublishSchema: {},
}));

const mockAppendIntakeEvent = vi.fn();

vi.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent(...args),
}));

// The route delegates the actual listing create/refresh to publishRevampitListing
// (it replaced the old inline marketplace_listings insert). That helper runs its
// own DB chains inside the tx and is covered by its own tests; here we mock it so
// the route test exercises only the route's orchestration + gating.
const mockPublishRevampitListing = vi.fn();

vi.mock('@/lib/marketplace/publish-revampit-listing', () => ({
  publishRevampitListing: (...args: unknown[]) => mockPublishRevampitListing(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
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

const MOCK_ROW = {
  id: 'inv-1',
  ai_product_id: 'prod-1',
  intake_tier: 'refurbish',
  intake_checklist: {},
  marketplace_status: 'draft',
  brand: 'Lenovo',
  product_name: 'ThinkPad',
  short_description: 'A great laptop',
  category: 'Laptop',
};

function makeRequest(body: Record<string, unknown> = { price_chf: 299 }) {
  return new NextRequest('http://localhost/api/admin/intake/inv-1/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'inv-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockDbExecute.mockResolvedValue({ rows: [MOCK_ROW] });
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    mockTxSet.mockReturnValue({ where: mockTxUpdateWhere });
    mockTxUpdateWhere.mockResolvedValue(undefined);
    mockTxValues.mockResolvedValue(undefined);
    const tx = {
      update: (...args: unknown[]) => {
        mockTxUpdate(...args);
        return { set: mockTxSet };
      },
      insert: (...args: unknown[]) => {
        mockTxInsert(...args);
        return { values: mockTxValues };
      },
    };
    return cb(tx);
  });
  mockAppendIntakeEvent.mockResolvedValue(undefined);
  mockPublishRevampitListing.mockResolvedValue('listing-1');

  mockValidateBody.mockReturnValue({ success: true, data: { price_chf: 299 } });

  const checklist = (await import('@/config/intake-checklist')) as any;
  checklist.isChecklistComplete.mockReturnValue(true);
});

// ============================================================================
// POST /api/admin/intake/[id]/publish
// ============================================================================

describe('POST /api/admin/intake/[id]/publish — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/intake/[id]/publish — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Preis erforderlich' }, { status: 400 }),
    });
    const response = await POST(makeRequest({}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when item not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] });
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 400 when item is already published', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ ...MOCK_ROW, marketplace_status: 'published' }],
    });
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when checklist is not complete', async () => {
    const checklist = (await import('@/config/intake-checklist')) as any;
    checklist.isChecklistComplete.mockReturnValueOnce(false);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/intake/[id]/publish — success', () => {
  it('returns 200 on successful publish', async () => {
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.published).toBe(true);
    expect(body.data.price_chf).toBe(299);
  });
});
