/**
 * @vitest-environment node
 *
 * Tests for POST /api/pools/[id]/leave (authenticated)
 *
 * Behaviors locked:
 *   POST - 401, 404 (not a member), 400 (owner can't leave), 200
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<{ id: string }> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  poolMemberships: {
    id: 'pm_id',
    poolId: 'pm_poolId',
    userId: 'pm_userId',
    role: 'pm_role',
    status: 'pm_status',
    leftAt: 'pm_leftAt',
  },
  subscriptionPools: { id: 'sp_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
}));

vi.mock('@/config/database', () => ({
  POOL_MEMBERSHIP_STATUS: { ACTIVE: 'active', LEFT: 'left' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
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

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
};

const MOCK_MEMBERSHIP = { id: 'mem-1', role: 'member' };

function makeContext(id = 'pool-1') {
  return { params: Promise.resolve({ id }) };
}

function makeRequest() {
  return new NextRequest('http://localhost/api/pools/pool-1/leave', { method: 'POST' });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  const from = vi.fn();
  from.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockResolvedValue([MOCK_MEMBERSHIP]);
  mockSelect.mockReturnValue({ from });
  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);
});

describe('POST /api/pools/[id]/leave — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/pools/[id]/leave — validation', () => {
  it('returns 404 when not a member', async () => {
    mockLimit.mockResolvedValueOnce([]);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/kein Mitglied/i);
  });

  it('returns 400 when owner tries to leave', async () => {
    mockLimit.mockResolvedValueOnce([{ id: 'mem-1', role: 'owner' }]);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Inhaber/i);
  });
});

describe('POST /api/pools/[id]/leave — success', () => {
  it('returns 200 and updates membership status to left', async () => {
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'left',
      }),
    );
  });
});
