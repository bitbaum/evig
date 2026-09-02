/**
 * @vitest-environment node
 *
 * Tests for POST/DELETE /api/admin/listings/[id]/verify
 *
 * Behaviors locked:
 *   POST /api/admin/listings/[id]/verify
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when listing not found
 *   - returns 200 on success
 *
 *   DELETE /api/admin/listings/[id]/verify
 *   - returns 401 when not authenticated
 *   - returns 200 on success
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
  listings: {
    id: 'l_id',
    status: 'l_status',
    verifiedAt: 'l_verifiedAt',
    verifiedBy: 'l_verifiedBy',
    verificationNotes: 'l_verificationNotes',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { REMOVED: 'removed' },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  VerifyListingSchema: {},
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
import { POST, DELETE } from '../route';

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

function makeRequest(method = 'POST', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/listings/lst-1/verify', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(id = 'lst-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([{ id: 'lst-1', status: 'active' }]);

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  mockValidateBody.mockReturnValue({ success: true, data: { verification_notes: 'Tested OK' } });
});

// ============================================================================
// POST /api/admin/listings/[id]/verify
// ============================================================================

describe('POST /api/admin/listings/[id]/verify — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest('POST', {}), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/listings/[id]/verify — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makeRequest('POST', {}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when listing not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(makeRequest('POST', {}), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('POST /api/admin/listings/[id]/verify — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest('POST', {}), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.verified).toBe(true);
    expect(body.data.id).toBe('lst-1');
  });
});

// ============================================================================
// DELETE /api/admin/listings/[id]/verify
// ============================================================================

describe('DELETE /api/admin/listings/[id]/verify — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/admin/listings/[id]/verify — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.verified).toBe(false);
  });
});
