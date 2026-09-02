/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/workshops/proposals/[id]/history
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 404 when proposal not found
 *   - returns 200 with edit history
 */

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

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  workshopProposals: { id: 'wp_id', editHistory: 'wp_editHistory' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
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

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/workshops/proposals/prop-1/history', {
    method: 'GET',
  });
}

function makeContext(id = 'prop-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([{ editHistory: [{ id: 'e-1', editor_name: 'Admin' }] }]);
});

describe('GET /api/admin/workshops/proposals/[id]/history — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/workshops/proposals/[id]/history — authenticated', () => {
  it('returns 404 when proposal not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 with history', async () => {
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.history).toHaveLength(1);
  });
});
