/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/donations/users
 *
 * Mission-relevant: user search for linking donations. Short search terms
 * (< 2 chars) return an empty array immediately without hitting the DB.
 *
 * Behaviors locked:
 *   GET /api/admin/donations/users
 *   - returns 401 when not authenticated
 *   - returns empty array when search is missing
 *   - returns empty array when search is too short (< 2 chars)
 *   - returns 200 with matching users
 *   - returns 500 when DB throws
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

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  or: vi.fn().mockReturnValue({ __or: true }),
  ilike: vi.fn().mockReturnValue({ __ilike: true }),
  asc: vi.fn().mockReturnValue({ __asc: true }),
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
import { GET } from '../route';

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

const MOCK_USERS = [
  { id: 'u-1', name: 'Hans Müller', email: 'hans@example.com' },
  { id: 'u-2', name: 'Anna Schmidt', email: 'anna@example.com' },
];

function makeRequest(search?: string) {
  const url = new URL('http://localhost/api/admin/donations/users');
  if (search !== undefined) url.searchParams.set('search', search);
  return new NextRequest(url.toString());
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue(MOCK_USERS);
});

// ============================================================================
// GET /api/admin/donations/users
// ============================================================================

describe('GET /api/admin/donations/users — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest('hans'));
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/donations/users — short search', () => {
  it('returns empty array when search is missing', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.users).toEqual([]);
  });

  it('returns empty array when search is 1 char', async () => {
    const response = await GET(makeRequest('a'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.users).toEqual([]);
  });
});

describe('GET /api/admin/donations/users — success', () => {
  it('returns 200 with matching users', async () => {
    const response = await GET(makeRequest('hans'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.users).toHaveLength(2);
  });

  it('returns 500 when DB throws', async () => {
    mockLimit.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeRequest('hans'));
    expect(response.status).toBe(500);
  });
});
