/**
 * @vitest-environment node
 *
 * Tests for GET/POST /api/admin/services
 *
 * Behaviors locked:
 *   GET /api/admin/services
 *   - returns 401 when not authenticated
 *   - returns 200 with services list
 *   - returns 500 when domain throws
 *
 *   POST /api/admin/services
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 on duplicate slug
 *   - returns 201 on success
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

const mockGetAdminServices = vi.fn();
const mockCreateServiceType = vi.fn();
const mockValidateBody = vi.fn();

vi.mock('@/lib/services', () => ({
  getAdminServices: (...args: unknown[]) => mockGetAdminServices(...args),
  createServiceType: (...args: unknown[]) => mockCreateServiceType(...args),
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  AdminCreateServiceSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
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
import { GET, POST } from '../route';

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

const VALID_BODY = {
  name: 'Laptop Repair',
  slug: 'laptop-repair',
  durationMinutes: 60,
  requiresApproval: false,
  isBookable: true,
  isFeatured: false,
  displayOrder: 1,
  pricingDetails: [],
};

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/services', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetAdminServices.mockResolvedValue([MOCK_SERVICE]);
  mockCreateServiceType.mockResolvedValue(MOCK_SERVICE);
  mockValidateBody.mockReturnValue({ success: true, data: VALID_BODY });
});

// ============================================================================
// GET /api/admin/services
// ============================================================================

describe('GET /api/admin/services — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/services — authenticated', () => {
  it('returns 200 with services list', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('svc-1');
  });

  it('returns 500 when domain throws', async () => {
    mockGetAdminServices.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});

// ============================================================================
// POST /api/admin/services
// ============================================================================

describe('POST /api/admin/services — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest('POST', VALID_BODY));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/services — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await POST(makeRequest('POST', {}));
    expect(response.status).toBe(400);
  });

  it('returns 400 on duplicate slug', async () => {
    mockCreateServiceType.mockRejectedValueOnce(new Error('duplicate key value'));
    const response = await POST(makeRequest('POST', VALID_BODY));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/services — success', () => {
  it('returns 201 on success', async () => {
    const response = await POST(makeRequest('POST', VALID_BODY));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.id).toBe('svc-1');
  });
});
