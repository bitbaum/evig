/**
 * @vitest-environment node
 *
 * Tests for GET /api/tasks and POST /api/tasks
 *
 * Mission-relevant: tasks power the staff coordination dashboard. If listing
 * or creation breaks, staff cannot coordinate repair and workshop work.
 *
 * Behaviors locked:
 *   GET /api/tasks
 *   - returns 401 when not authenticated
 *   - returns 200 with tasks array
 *
 *   POST /api/tasks
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing title)
 *   - returns 201 with created task
 *   - calls notifyUsers when assigned_to is provided
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

vi.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}));

vi.mock('@/db/schema', () => ({
  tasks: {
    id: 't_id',
    title: 't_title',
    isArchived: 't_archived',
    category: 't_cat',
    currentStatus: 't_status',
    taskType: 't_type',
    projectId: 't_proj',
    priority: 't_pri',
    createdAt: 't_ca',
    assignedTo: 't_at',
    createdBy: 't_cb',
  },
  taskCompletions: {
    id: 'tc_id',
    taskId: 'tc_tid',
    completedBy: 'tc_cb',
    completedAt: 'tc_cat',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
  desc: vi.fn(),
}));

vi.mock('@/config/tasks', () => ({
  TASK_PRIORITIES: { URGENT: 'urgent', HIGH: 'high', NORMAL: 'normal', LOW: 'low' },
}));

vi.mock('@/lib/schemas/tasks', () => ({
  createTaskSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>;
      if (!body?.title || !body?.category) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
      }
      return {
        success: true,
        data: {
          title: body.title,
          category: body.category,
          task_type: 'recurring',
          priority: 'normal',
          tags: [],
          assigned_to: (body.assigned_to as string) || null,
        },
      };
    },
  },
}));

const mockGetDbUserId = vi.fn();

vi.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId(...args),
}));

const mockNotifyUsers = vi.fn();

vi.mock('@/lib/services/notifications', () => ({
  notifyUsers: (...args: unknown[]) => mockNotifyUsers(...args),
}));

vi.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
  NOTIFICATION_TYPES: { TASK_ASSIGNED: 'task_assigned' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, errors?: unknown) =>
      NextResponse.json(
        { success: false, error: msg, ...(errors ? { errors } : {}) },
        { status: 400 },
      ),
  };
});

// ---------------------------------------------------------------------------
// Drizzle fluent chain mock
// ---------------------------------------------------------------------------

// Mock @/db with stub select/insert; configured in beforeEach via await import('@/db')
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
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
};

const MOCK_TASK = {
  id: 'task-1',
  title: 'Reinigung',
  category: 'cleaning',
  priority: 'normal',
  current_status: 'idle',
  task_type: 'recurring',
  created_by: 'user-1',
};

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/tasks');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body?: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost/api/tasks',
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { method: 'POST' },
  );
}

// Build a Drizzle select chain where the given terminal method resolves with value
function makeSelectChain(terminal: 'orderBy' | 'where' | 'limit' | 'offset', value: unknown[]) {
  const c: Record<string, Mock> = {};
  [
    'from',
    'leftJoin',
    'innerJoin',
    'where',
    'orderBy',
    'groupBy',
    'having',
    'limit',
    'offset',
  ].forEach((m) => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  c[terminal] = vi.fn().mockResolvedValue(value);
  return c;
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' });
  mockNotifyUsers.mockResolvedValue(undefined);

  const dbMod = (await import('@/db')) as any;

  // GET default: single select chain that resolves at orderBy
  dbMod.db.select.mockReturnValue(makeSelectChain('offset', [MOCK_TASK]));

  // POST insert chain
  const mockReturning = vi.fn().mockResolvedValue([MOCK_TASK]);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  dbMod.db.insert.mockReturnValue({ values: mockValues });
});

// ============================================================================
// GET /api/tasks
// ============================================================================

describe('GET /api/tasks — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/tasks — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns tasks array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('task-1');
  });

  it('returns empty array when no tasks exist', async () => {
    const dbMod = (await import('@/db')) as any;
    dbMod.db.select.mockReturnValueOnce(makeSelectChain('offset', []));
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data).toEqual([]);
  });
});

// ============================================================================
// POST /api/tasks
// ============================================================================

describe('POST /api/tasks — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest({ title: 'Test', category: 'cleaning' }));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/tasks — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makePostRequest({ category: 'cleaning' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when category is missing', async () => {
    const response = await POST(makePostRequest({ title: 'Reinigung' }));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/tasks — success', () => {
  it('returns 201 with created task', async () => {
    const response = await POST(makePostRequest({ title: 'Reinigung', category: 'cleaning' }));
    expect(response.status).toBe(201);
  });

  it('returns task data', async () => {
    const response = await POST(makePostRequest({ title: 'Reinigung', category: 'cleaning' }));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('task-1');
    expect(body.data.title).toBe('Reinigung');
  });

  it('does not call notifyUsers when assigned_to is not provided', async () => {
    await POST(makePostRequest({ title: 'Reinigung', category: 'cleaning' }));
    expect(mockNotifyUsers).not.toHaveBeenCalled();
  });

  it('calls notifyUsers when assigned_to is provided', async () => {
    await POST(
      makePostRequest({ title: 'Reinigung', category: 'cleaning', assigned_to: 'user-42' }),
    );
    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['user-42'],
      expect.objectContaining({ type: 'task_assigned' }),
    );
  });
});
