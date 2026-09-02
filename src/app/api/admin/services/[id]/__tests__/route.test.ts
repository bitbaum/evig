/**
 * @vitest-environment node
 *
 * Tests for GET/PUT/DELETE /api/admin/services/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/services/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when service not found
 *   - returns 200 with service
 *
 *   PUT /api/admin/services/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when slug format is invalid
 *   - returns 404 when service not found after update
 *   - returns 400 on duplicate slug
 *   - returns 200 on success
 *
 *   DELETE /api/admin/services/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when service not found
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

const mockGetAdminServiceById = vi.fn();
const mockUpdateServiceType = vi.fn();
const mockDeleteServiceType = vi.fn();

vi.mock('@/lib/services', () => ({
  getAdminServiceById: (...args: unknown[]) => mockGetAdminServiceById(...args),
  updateServiceType: (...args: unknown[]) => mockUpdateServiceType(...args),
  deleteServiceType: (...args: unknown[]) => mockDeleteServiceType(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
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
import { GET, PUT, DELETE } from '../route';

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

const MOCK_SERVICE = { id: 'svc-1', name: 'Laptop Repair', slug: 'laptop-repair', isActive: true };

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/services/svc-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(id = 'svc-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetAdminServiceById.mockResolvedValue(MOCK_SERVICE);
  mockUpdateServiceType.mockResolvedValue(MOCK_SERVICE);
  mockDeleteServiceType.mockResolvedValue(true);
});

// ============================================================================
// GET /api/admin/services/[id]
// ============================================================================

describe('GET /api/admin/services/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/services/[id] — authenticated', () => {
  it('returns 404 when service not found', async () => {
    mockGetAdminServiceById.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 with service', async () => {
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe('svc-1');
  });
});

// ============================================================================
// PUT /api/admin/services/[id]
// ============================================================================

describe('PUT /api/admin/services/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PUT(makeRequest('PUT', { name: 'Updated' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/admin/services/[id] — validation', () => {
  it('returns 400 when slug format is invalid', async () => {
    const response = await PUT(makeRequest('PUT', { slug: 'INVALID SLUG!' }), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when service not found after update', async () => {
    mockUpdateServiceType.mockResolvedValueOnce(null);
    const response = await PUT(makeRequest('PUT', { name: 'Updated' }), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 400 on duplicate slug', async () => {
    mockUpdateServiceType.mockRejectedValueOnce(new Error('duplicate key value'));
    const response = await PUT(makeRequest('PUT', { slug: 'other-service' }), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PUT /api/admin/services/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest('PUT', { name: 'Updated Repair' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe('svc-1');
  });
});

// ============================================================================
// DELETE /api/admin/services/[id]
// ============================================================================

describe('DELETE /api/admin/services/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/admin/services/[id] — authenticated', () => {
  it('returns 404 when service not found', async () => {
    mockDeleteServiceType.mockResolvedValueOnce(false);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.deleted).toBe(true);
  });
});
