/**
 * @vitest-environment node
 *
 * Tests for PATCH /api/me/preferences
 *
 * Mission-relevant: users set their dashboard mode (coordinator/lead/volunteer)
 * to personalise their RevampIT experience. If validation is bypassed or the
 * wrong user's record is updated, dashboard state gets corrupted.
 *
 * Behaviors locked:
 *   PATCH /api/me/preferences
 *   - returns 401 when not authenticated
 *   - returns 200 with null data on success
 *   - validates dashboardMode enum (returns 400 on invalid value)
 *   - calls db.update for the authenticated user's id only
 *   - skips db.update when dashboardMode is not in body
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockWhere = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock('@/db', () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('@/db/schema/auth', () => ({
  users: { id: 'users_id', dashboardMode: 'users_dashboardMode' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
}));

vi.mock('@/lib/api/helpers', async () => ({
  apiSuccess: (data: unknown, status = 200) => {
    return NextResponse.json({ success: true, data }, { status });
  },
  apiBadRequest: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    return NextResponse.json({ success: false, error: msg }, { status });
  },
  apiUnauthorized: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
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
    id: 'user-42',
    email: 'staff@revamp-it.ch',
    name: 'Staff',
    isStaff: true,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([]);
});

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

// ============================================================================
// PATCH /api/me/preferences
// ============================================================================

describe('PATCH /api/me/preferences — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest({ dashboardMode: 'coordinator' }));
    expect(response.status).toBe(401);
  });

  it('returns 401 when session.user.id is missing', async () => {
    mockAuth.mockResolvedValueOnce({ user: null });
    const response = await PATCH(makeRequest({ dashboardMode: 'coordinator' }));
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/me/preferences — valid input', () => {
  it.each(['coordinator', 'lead', 'volunteer'])(
    'returns 200 for dashboardMode "%s"',
    async (mode) => {
      const response = await PATCH(makeRequest({ dashboardMode: mode }));
      expect(response.status).toBe(200);
    },
  );

  it('returns success: true', async () => {
    const response = await PATCH(makeRequest({ dashboardMode: 'lead' }));
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('calls db.update with the correct dashboardMode', async () => {
    await PATCH(makeRequest({ dashboardMode: 'volunteer' }));
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ dashboardMode: 'volunteer' }));
  });

  it('calls db.update filtered by the session user id', async () => {
    await PATCH(makeRequest({ dashboardMode: 'coordinator' }));
    const { eq } = (await import('drizzle-orm')) as any;
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-42');
  });

  it('returns 200 and skips db.update when dashboardMode is absent', async () => {
    const response = await PATCH(makeRequest({}));
    expect(response.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/me/preferences — validation errors', () => {
  it('returns 400 for an invalid enum value', async () => {
    const response = await PATCH(makeRequest({ dashboardMode: 'superuser' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 for a numeric dashboardMode', async () => {
    const response = await PATCH(makeRequest({ dashboardMode: 42 }));
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/me/preferences — DB error', () => {
  it('returns 500 when db.update throws', async () => {
    mockWhere.mockRejectedValueOnce(new Error('connection lost'));
    const response = await PATCH(makeRequest({ dashboardMode: 'coordinator' }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
