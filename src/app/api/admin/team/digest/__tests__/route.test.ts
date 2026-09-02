/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/team/digest
 *
 * Behaviors locked:
 *   GET /api/admin/team/digest
 *   - returns 401 when not authenticated
 *   - returns 400 when filter is invalid
 *   - returns 200 with digest summary
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

const mockDbExecute = vi.fn();
const mockValidateDigestFilter = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}));

vi.mock('@/db/schema/misc', () => ({
  taskCompletions: {},
  tasks: {},
}));

vi.mock('@/db/schema/team', () => ({
  activityUpdates: {},
  helpRequests: {},
  teamProfiles: {},
}));

vi.mock('@/db/schema/auth', () => ({
  users: {},
}));

vi.mock('drizzle-orm', () => ({
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_table: unknown) => 'mock_table',
}));

vi.mock('@/lib/schemas/activity', () => ({
  validateDigestFilter: (...args: unknown[]) => mockValidateDigestFilter(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

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

const MOCK_FILTERS = {
  since: '2026-04-25T00:00:00.000Z',
  until: '2026-05-02T00:00:00.000Z',
  department: undefined,
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/team/digest');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockValidateDigestFilter.mockReturnValue({ success: true, data: MOCK_FILTERS });

  // 6 parallel db.execute calls: taskCompletions, activityUpdates, helpCreated, helpResolved, categoryStats, milestones
  mockDbExecute
    .mockResolvedValueOnce({
      rows: [
        {
          user_id: 'u-1',
          user_name: 'Hans',
          user_email: 'hans@example.com',
          department: null,
          count: '3',
        },
      ],
    })
    .mockResolvedValueOnce({
      rows: [
        {
          user_id: 'u-1',
          user_name: 'Hans',
          user_email: 'hans@example.com',
          department: null,
          count: '2',
        },
      ],
    })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [{ category: 'maintenance', count: '3' }] })
    .mockResolvedValueOnce({ rows: [] });
});

// ============================================================================
// GET /api/admin/team/digest
// ============================================================================

describe('GET /api/admin/team/digest — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/team/digest — validation', () => {
  it('returns 400 when filter is invalid', async () => {
    mockValidateDigestFilter.mockReturnValueOnce({ success: false });
    const response = await GET(makeRequest({ since: 'bad' }));
    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/team/digest — authenticated', () => {
  it('returns 200 with digest summary', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.period.since).toBe(MOCK_FILTERS.since);
    expect(body.data.totals.task_completions).toBe(3);
    expect(body.data.by_category).toHaveLength(1);
    expect(body.data.by_user).toHaveLength(1);
    expect(body.data.top_contributors).toHaveLength(1);
  });

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset();
    mockDbExecute.mockRejectedValue(new Error('DB error'));
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });
});
