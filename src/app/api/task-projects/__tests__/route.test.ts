/**
 * @vitest-environment node
 *
 * Tests for GET /api/task-projects and POST /api/task-projects
 *
 * Behaviors locked:
 *   GET /api/task-projects
 *   - returns 401 when not authenticated
 *   - returns 200 with projects array
 *
 *   POST /api/task-projects
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 with created project
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
    apiBadRequest: (msg: string, errors?: unknown) =>
      NextResponse.json(
        { success: false, error: msg, ...(errors ? { errors } : {}) },
        { status: 400 },
      ),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/db/schema', () => ({
  taskProjects: {
    id: 'tp_id',
    title: 'tp_title',
    description: 'tp_desc',
    status: 'tp_status',
    targetDate: 'tp_td',
    createdBy: 'tp_cb',
    createdAt: 'tp_ca',
    updatedAt: 'tp_ua',
  },
  tasks: { id: 't_id', projectId: 't_pid', isArchived: 't_ia', isCompleted: 't_ic' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
  not: vi.fn(),
}));

vi.mock('@/lib/schemas/tasks', () => ({
  createProjectSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>;
      if (!body?.title || !body?.status) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
      }
      return {
        success: true,
        data: {
          title: body.title,
          status: body.status,
          description: undefined,
          target_date: undefined,
        },
      };
    },
  },
}));

// ---------------------------------------------------------------------------
// Drizzle fluent chain mock
// ---------------------------------------------------------------------------

const mockOrderByTerminal = vi.fn();
const mockWhereTerminal = vi.fn();
const mockReturning = vi.fn();
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });

const q: Record<string, Mock> = {};
['from', 'leftJoin', 'where', 'groupBy', 'having', 'limit', 'offset'].forEach((m) => {
  q[m] = vi.fn().mockReturnValue(q);
});
q.orderBy = mockOrderByTerminal;

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

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

const MOCK_PROJECT = {
  id: 'proj-1',
  title: 'Q1 Cleanup',
  status: 'active',
  createdBy: 'db-user-1',
};

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/task-projects');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body?: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost/api/task-projects',
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { method: 'POST' },
  );
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // Restore chain methods after resetAllMocks
  Object.keys(q).forEach((k) => {
    q[k] = vi.fn().mockReturnValue(q);
  });
  q.orderBy = mockOrderByTerminal;
  mockOrderByTerminal.mockResolvedValue([MOCK_PROJECT]);

  // For POST user lookup — where is terminal for select
  mockWhereTerminal.mockResolvedValue([{ id: 'db-user-1' }]);

  // Insert chain
  mockValues.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([MOCK_PROJECT]);

  const dbMod = (await import('@/db')) as any;
  dbMod.db.select.mockReturnValue(q);
  dbMod.db.insert.mockReturnValue({ values: mockValues });
});

// ============================================================================
// GET /api/task-projects
// ============================================================================

describe('GET /api/task-projects — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/task-projects — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns projects array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('proj-1');
  });

  it('returns empty array when no projects exist', async () => {
    mockOrderByTerminal.mockResolvedValueOnce([]);
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data).toEqual([]);
  });
});

// ============================================================================
// POST /api/task-projects
// ============================================================================

describe('POST /api/task-projects — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest({ title: 'Test', status: 'planning' }));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/task-projects — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makePostRequest({ status: 'planning' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when status is missing', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup' }));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/task-projects — success', () => {
  beforeEach(async () => {
    // For POST: first select call uses where as terminal (user lookup)
    const dbMod = (await import('@/db')) as any;
    const userLookupChain: Record<string, Mock> = {};
    ['from', 'leftJoin', 'groupBy'].forEach((m) => {
      userLookupChain[m] = vi.fn().mockReturnValue(userLookupChain);
    });
    userLookupChain.where = vi.fn().mockResolvedValue([{ id: 'db-user-1' }]);
    dbMod.db.select.mockReturnValue(userLookupChain);
  });

  it('returns 201 with created project', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup', status: 'active' }));
    expect(response.status).toBe(201);
  });

  it('returns project data', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup', status: 'active' }));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('proj-1');
    expect(body.data.title).toBe('Q1 Cleanup');
  });
});
