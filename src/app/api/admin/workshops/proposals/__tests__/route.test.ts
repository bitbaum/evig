/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/workshops/proposals
 *
 * Behaviors locked:
 *   GET /api/admin/workshops/proposals
 *   - returns 401 when not authenticated
 *   - returns 200 with items and pagination
 *   - returns 500 when DB throws
 */

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
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  workshopProposals: {
    id: 'wp_id',
    userId: 'wp_userId',
    title: 'wp_title',
    status: 'wp_status',
    category: 'wp_category',
    createdAt: 'wp_createdAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  locations: { id: 'l_id', name: 'l_name' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  ilike: (col: unknown, pat: string) => ({ __ilike: [col, pat] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
    join: (parts: unknown[], _sep: unknown) => ({ __join: parts }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: vi.fn().mockReturnValue({ limit: 20, offset: 0 }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  };
});

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

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
  id: 'prop-1',
  title: 'Intro to Electronics',
  status: 'pending',
  proposerName: 'Hans',
  proposerEmail: 'hans@example.com',
};

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/workshops/proposals', { method: 'GET' });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  const helpers = (await import('@/lib/api/helpers')) as any;
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 });

  // Count query: from → where → resolves [{ count: '1' }]
  // Items query: from → leftJoin(x2) → where → orderBy → limit → offset
  mockFrom
    .mockReturnValueOnce({ where: mockWhere }) // count
    .mockReturnValueOnce({ leftJoin: mockLeftJoin }); // items
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockWhere
    .mockResolvedValueOnce([{ count: '1' }]) // count result
    .mockReturnValueOnce({ orderBy: mockOrderBy }); // items
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ offset: mockOffset });
  mockOffset.mockResolvedValue([MOCK_ROW]);
});

describe('GET /api/admin/workshops/proposals — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/workshops/proposals — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
  });

  it('returns 500 when DB throws', async () => {
    mockFrom.mockReset();
    mockFrom.mockReturnValueOnce({ where: mockWhere });
    mockWhere.mockReset();
    mockWhere.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});
