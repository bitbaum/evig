/**
 * @vitest-environment node
 *
 * Tests for GET /api/task-requests
 *
 * Returns pending task requests for the current user (direct + broadcasts).
 *
 * Behaviors locked:
 *   GET /api/task-requests
 *   - returns 401 when not authenticated
 *   - returns 200 with requests array
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
    return (req: Request, context?: unknown) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, context);
      });
  },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}));

vi.mock('@/db/schema', () => ({
  taskRequests: {
    id: 'tr_id',
    taskId: 'tr_tid',
    requestedBy: 'tr_rb',
    requestedUserId: 'tr_ru',
    isBroadcast: 'tr_ib',
    message: 'tr_msg',
    status: 'tr_s',
    responseMessage: 'tr_rm',
    completionId: 'tr_ci',
    createdAt: 'tr_ca',
    updatedAt: 'tr_ua',
  },
  tasks: {
    id: 't_id',
    title: 't_title',
    description: 't_desc',
    category: 't_cat',
    priority: 't_pri',
    currentStatus: 't_cs',
    estimatedMinutes: 't_em',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  ne: vi.fn(),
  isNull: vi.fn(),
  or: vi.fn(),
  desc: vi.fn(),
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
}));

vi.mock('@/config/tasks', () => ({
  REQUEST_STATUSES: { PENDING: 'pending' },
}));

// ---------------------------------------------------------------------------
// Drizzle fluent chain mock
// ---------------------------------------------------------------------------

const mockOrderBy = vi.fn();

const q: Record<string, Mock> = {};
['from', 'leftJoin', 'where', 'groupBy'].forEach((m) => {
  q[m] = vi.fn().mockReturnValue(q);
});
q.orderBy = mockOrderBy;

vi.mock('@/db', () => ({
  db: { select: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
};

const MOCK_REQUEST = {
  id: 'req-1',
  task_id: 'task-1',
  requested_by: 'user-2',
  status: 'pending',
  task_title: 'Reinigung',
};

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/task-requests');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // Restore chain after resetAllMocks
  Object.keys(q).forEach((k) => {
    q[k] = vi.fn().mockReturnValue(q);
  });
  q.orderBy = mockOrderBy;
  mockOrderBy.mockResolvedValue([MOCK_REQUEST]);

  const dbMod = (await import('@/db')) as any;
  dbMod.db.select.mockReturnValue(q);
});

// ============================================================================
// GET /api/task-requests
// ============================================================================

describe('GET /api/task-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/task-requests — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns requests array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('req-1');
  });

  it('returns empty array when no requests exist', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data).toEqual([]);
  });
});
