/**
 * @vitest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/tasks/[id]
 *
 * Mission-relevant: task detail, editing, and archiving are core to the staff
 * coordination workflow. A broken GET prevents staff from seeing task history.
 * A broken PATCH or DELETE prevents task management.
 *
 * Behaviors locked:
 *   GET /api/tasks/[id]
 *   - returns 401 when not authenticated
 *   - returns 200 with task + completions + flags + requests
 *   - returns 404 when task not found
 *
 *   PATCH /api/tasks/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 on invalid body
 *   - returns 404 when task not found
 *   - returns 200 with updated task
 *
 *   DELETE /api/tasks/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when task not found (no rows returned)
 *   - returns 200 with { archived: true }
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        if (context?.params) {
          return context.params.then((params) =>
            (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, { params }),
          );
        }
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(
          req,
          session,
          undefined,
        );
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
    assignedTo: 't_at',
    createdBy: 't_cb',
    currentStatus: 't_status',
    createdAt: 't_ca',
    updatedAt: 't_ua',
  },
  taskCompletions: {
    id: 'tc_id',
    taskId: 'tc_tid',
    completedBy: 'tc_cb',
    completedAt: 'tc_ca',
    notes: 'tc_n',
    durationMinutes: 'tc_dm',
    createdAt: 'tc_crat',
  },
  taskAttentionFlags: {
    id: 'taf_id',
    taskId: 'taf_tid',
    flaggedBy: 'taf_fb',
    message: 'taf_msg',
    isResolved: 'taf_res',
    resolvedBy: 'taf_rb',
    resolvedAt: 'taf_ra',
    resolvedByCompletionId: 'taf_rc',
    createdAt: 'taf_ca',
  },
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
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
  desc: vi.fn(),
}));

vi.mock('@/config/tasks', () => ({
  REQUEST_STATUSES: { PENDING: 'pending' },
}));

vi.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
  NOTIFICATION_TYPES: { TASK_ASSIGNED: 'task_assigned' },
}));

vi.mock('@/lib/schemas/tasks', () => ({
  updateTaskSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>;
      if (!body || Object.keys(body).length === 0) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
      }
      return { success: true, data: body };
    },
  },
}));

const mockNotifyUsers = vi.fn();

vi.mock('@/lib/services/notifications', () => ({
  notifyUsers: (...args: unknown[]) => mockNotifyUsers(...args),
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
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string, errors?: unknown) =>
      NextResponse.json(
        { success: false, error: msg, ...(errors ? { errors } : {}) },
        { status: 400 },
      ),
  };
});

// ---------------------------------------------------------------------------
// Drizzle mock helpers
// ---------------------------------------------------------------------------

/**
 * Build a standalone chain that resolves at the given terminal method.
 * Each chain instance is independent so Promise.all gets distinct chains.
 */
function makeChain(terminal: 'where' | 'orderBy' | 'limit', value: unknown[]) {
  const c: Record<string, Mock> = {};
  ['from', 'leftJoin', 'where', 'orderBy', 'limit', 'groupBy'].forEach((m) => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  c[terminal] = vi.fn().mockResolvedValue(value);
  return c;
}

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PATCH, DELETE } from '../route';

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
  assignedTo: null,
};

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest(
    'http://localhost/api/tasks/task-1',
    body
      ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method },
  );
}

function makeContext(id = 'task-1') {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockNotifyUsers.mockResolvedValue(undefined);
});

// ============================================================================
// GET /api/tasks/[id]
// ============================================================================

describe('GET /api/tasks/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/tasks/[id] — authenticated', () => {
  it('returns 200 with task, completions, flags, and requests', async () => {
    const dbMod = (await import('@/db')) as any;
    dbMod.db.select
      .mockReturnValueOnce(makeChain('where', [MOCK_TASK])) // task details
      .mockReturnValueOnce(makeChain('limit', [])) // completions
      .mockReturnValueOnce(makeChain('orderBy', [])) // flags
      .mockReturnValueOnce(makeChain('orderBy', [])); // requests

    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.task.id).toBe('task-1');
    expect(Array.isArray(body.data.completions)).toBe(true);
    expect(Array.isArray(body.data.attention_flags)).toBe(true);
    expect(Array.isArray(body.data.pending_requests)).toBe(true);
  });

  it('returns 404 when task rows are empty', async () => {
    const dbMod = (await import('@/db')) as any;
    dbMod.db.select
      .mockReturnValueOnce(makeChain('where', [])) // task not found
      .mockReturnValueOnce(makeChain('limit', []))
      .mockReturnValueOnce(makeChain('orderBy', []))
      .mockReturnValueOnce(makeChain('orderBy', []));

    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

// ============================================================================
// PATCH /api/tasks/[id]
// ============================================================================

describe('PATCH /api/tasks/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/tasks/[id] — validation', () => {
  it('returns 400 when body is empty', async () => {
    const response = await PATCH(makeRequest('PATCH', {}), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/tasks/[id] — not found', () => {
  it('returns 404 when task does not exist', async () => {
    const dbMod = (await import('@/db')) as any;
    // select for existence check returns empty
    const existenceChain: Record<string, Mock> = {};
    ['from', 'leftJoin', 'where', 'orderBy', 'limit', 'groupBy'].forEach((m) => {
      existenceChain[m] = vi.fn().mockReturnValue(existenceChain);
    });
    existenceChain.where = vi.fn().mockResolvedValue([]);
    dbMod.db.select.mockReturnValue(existenceChain);

    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/tasks/[id] — success', () => {
  it('returns 200 with updated task', async () => {
    const dbMod = (await import('@/db')) as any;

    // select for existence check
    const existenceChain: Record<string, Mock> = {};
    ['from', 'leftJoin', 'where', 'orderBy', 'limit', 'groupBy'].forEach((m) => {
      existenceChain[m] = vi.fn().mockReturnValue(existenceChain);
    });
    existenceChain.where = vi
      .fn()
      .mockResolvedValue([{ id: 'task-1', title: 'Old title', assignedTo: null }]);
    dbMod.db.select.mockReturnValue(existenceChain);

    // update returning
    const mockReturning = vi.fn().mockResolvedValue([MOCK_TASK]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    dbMod.db.update = vi.fn().mockReturnValue({ set: mockSet });

    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('task-1');
  });
});

// ============================================================================
// DELETE /api/tasks/[id]
// ============================================================================

describe('DELETE /api/tasks/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/tasks/[id] — not found', () => {
  it('returns 404 when no rows returned from update', async () => {
    const dbMod = (await import('@/db')) as any;
    const mockReturning = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    dbMod.db.update = vi.fn().mockReturnValue({ set: mockSet });

    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/tasks/[id] — success', () => {
  it('returns 200 with archived: true', async () => {
    const dbMod = (await import('@/db')) as any;
    const mockReturning = vi.fn().mockResolvedValue([{ id: 'task-1' }]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
    dbMod.db.update = vi.fn().mockReturnValue({ set: mockSet });

    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.archived).toBe(true);
  });
});
