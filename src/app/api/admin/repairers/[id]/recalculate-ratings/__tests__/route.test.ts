/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/repairers/[id]/recalculate-ratings
 *
 * Behaviors locked:
 *   POST /api/admin/repairers/[id]/recalculate-ratings
 *   - returns 401 when not authenticated
 *   - returns 404 when repairer not found
 *   - returns 200 on success with updated ratings
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
const mockDbExecute = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    businessName: 'rp_businessName',
    averageRating: 'rp_averageRating',
    totalReviews: 'rp_totalReviews',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
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

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/repairers/rep-1/recalculate-ratings', {
    method: 'POST',
  });
}

function makeContext(id = 'rep-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere
    .mockResolvedValueOnce([{ id: 'rep-1', businessName: 'Hans Repairs' }]) // existence check
    .mockResolvedValueOnce([{ averageRating: '4.5', totalReviews: '10' }]); // updated ratings
  mockDbExecute.mockResolvedValue(undefined);
});

// ============================================================================
// POST /api/admin/repairers/[id]/recalculate-ratings
// ============================================================================

describe('POST /api/admin/repairers/[id]/recalculate-ratings — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/repairers/[id]/recalculate-ratings — validation', () => {
  it('returns 404 when repairer not found', async () => {
    mockWhere.mockReset();
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('POST /api/admin/repairers/[id]/recalculate-ratings — success', () => {
  it('returns 200 with updated ratings', async () => {
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.repairerId).toBe('rep-1');
    expect(body.data.ratings.averageRating).toBe(4.5);
    expect(body.data.ratings.totalReviews).toBe(10);
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
  });
});
