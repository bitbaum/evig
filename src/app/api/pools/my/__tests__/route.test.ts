/**
 * @vitest-environment node
 *
 * Tests for GET /api/pools/my
 *
 * Mission-relevant: pool memberships control feature visibility and access
 * across the platform. If this returns memberships for the wrong user or
 * a broken response, permission checks downstream silently fail.
 *
 * Behaviors locked:
 *   GET /api/pools/my
 *   - returns 401 when not authenticated
 *   - returns 200 with pool membership list for the current user
 *   - returns empty array when user has no active memberships
 *   - queries only ACTIVE memberships for the current user
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockWhere = vi.fn();
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  poolMemberships: { poolId: 'pm_poolId', userId: 'pm_userId', status: 'pm_status' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  and: vi.fn().mockReturnValue({ __and: true }),
}));

vi.mock('@/config/database', () => ({
  POOL_MEMBERSHIP_STATUS: { ACTIVE: 'active' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/api/helpers', async () => ({
  apiSuccess: (data: unknown) => {
    return NextResponse.json({ success: true, data });
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    return NextResponse.json({ success: false, error: msg }, { status });
  },
  apiUnauthorized: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-7',
    email: 'member@example.com',
    name: 'Member',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

const MOCK_MEMBERSHIPS = [{ poolId: 'pool-1' }, { poolId: 'pool-2' }];

function makeRequest() {
  return new NextRequest('http://localhost/api/pools/my');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(MOCK_MEMBERSHIPS);
});

// ============================================================================
// GET /api/pools/my
// ============================================================================

describe('GET /api/pools/my — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/pools/my — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
  });

  it('returns membership array', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].poolId).toBe('pool-1');
  });

  it('returns empty array when user has no active memberships', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await GET(makeRequest());
    const body = await response.json();
    expect(body.data).toEqual([]);
  });

  it('queries only ACTIVE memberships for the current user', async () => {
    await GET(makeRequest());
    const { eq } = (await import('drizzle-orm')) as any;
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-7');
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'active');
  });

  it('returns 500 when DB throws', async () => {
    mockWhere.mockRejectedValueOnce(new Error('DB connection error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
