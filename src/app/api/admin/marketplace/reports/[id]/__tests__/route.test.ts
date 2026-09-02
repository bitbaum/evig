/**
 * @vitest-environment node
 *
 * Tests for PATCH /api/admin/marketplace/reports/[id]
 *
 * Behaviors locked:
 *   PATCH /api/admin/marketplace/reports/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when report not found
 *   - returns 200 on dismiss action
 *   - returns 200 on remove_listing action (also removes listing and calls meilisearch)
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

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockValidateBody = vi.fn();
const mockRemoveListing = vi.fn();
const mockLogAdminAction = vi.fn();
const mockGetClientIdentifier = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  listingReports: {
    id: 'lr_id',
    listingId: 'lr_listingId',
    status: 'lr_status',
    reviewedAt: 'lr_reviewedAt',
    reviewedBy: 'lr_reviewedBy',
    resolutionAction: 'lr_resAction',
    resolutionNotes: 'lr_resNotes',
  },
  listings: { id: 'l_id', status: 'l_status', updatedAt: 'l_updatedAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    REPORT_NOT_FOUND: 'Meldung nicht gefunden',
  },
}));

vi.mock('@/config/report-status', () => ({
  REPORT_STATUS: { REVIEWED: 'reviewed' },
}));

vi.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { REMOVED: 'removed' },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}));

vi.mock('@/lib/schemas/marketplace', () => ({
  HandleReportSchema: {},
}));

vi.mock('@/lib/search/meilisearch', () => ({
  removeListing: (...args: unknown[]) => mockRemoveListing(...args),
}));

vi.mock('@/lib/auth/audit', () => ({
  logAdminAction: (...args: unknown[]) => mockLogAdminAction(...args),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  getClientIdentifier: (...args: unknown[]) => mockGetClientIdentifier(...args),
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
import { PATCH } from '../route';

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

const MOCK_REPORT = { id: 'rep-1', listing_id: 'lst-1', status: 'pending' };

function makeRequest(body: Record<string, unknown> = { action: 'dismiss' }) {
  return new NextRequest('http://localhost/api/admin/marketplace/reports/rep-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'rep-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_REPORT]);

  // update().set().where() — no returning needed (route ignores return values)
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  mockRemoveListing.mockResolvedValue(undefined);
  mockLogAdminAction.mockReturnValue(undefined);
  mockGetClientIdentifier.mockReturnValue('127.0.0.1');

  mockValidateBody.mockReturnValue({ success: true, data: { action: 'dismiss' } });
});

// ============================================================================
// PATCH /api/admin/marketplace/reports/[id]
// ============================================================================

describe('PATCH /api/admin/marketplace/reports/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/admin/marketplace/reports/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await PATCH(makeRequest({}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when report not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await PATCH(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/admin/marketplace/reports/[id] — success', () => {
  it('returns 200 on dismiss action', async () => {
    const response = await PATCH(makeRequest({ action: 'dismiss' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.handled).toBe(true);
    expect(body.data.action).toBe('dismiss');
  });

  it('returns 200 on remove_listing action', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { action: 'remove_listing' } });
    const response = await PATCH(makeRequest({ action: 'remove_listing' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.handled).toBe(true);
    expect(mockRemoveListing).toHaveBeenCalledWith('lst-1');
  });
});
