/**
 * @vitest-environment node
 *
 * Tests for PATCH /api/task-requests/[id]
 *
 * Responds to a task request (accept or decline).
 *
 * Behaviors locked:
 *   PATCH /api/task-requests/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing status)
 *   - returns 404 when request not found
 *   - returns 400 when request is already answered
 *   - returns 400 when user is the requester (can't answer own request)
 *   - returns 200 on successful accept (direct request)
 *   - returns 200 on successful decline
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
        const resolvedContext = context?.params
          ? context.params.then((p: { id: string }) => ({ params: p }))
          : Promise.resolve(undefined);
        return resolvedContext.then((ctx: unknown) =>
          (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, ctx),
        );
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
  taskRequests: {
    id: 'tr_id',
    taskId: 'tr_tid',
    requestedBy: 'tr_rb',
    requestedUserId: 'tr_ru',
    status: 'tr_s',
    responseMessage: 'tr_rm',
    updatedAt: 'tr_ua',
  },
  tasks: { id: 't_id', title: 't_title', currentStatus: 't_cs', updatedAt: 't_ua' },
  users: { id: 'u_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  ne: vi.fn(),
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
}));

vi.mock('@/config/tasks', () => ({
  TASK_STATUSES: { IN_PROGRESS: 'in_progress' },
  REQUEST_STATUSES: { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' },
}));

vi.mock('@/config/notifications', () => ({
  NOTIFICATION_TYPES: { TASK_REQUEST_RESPONSE: 'task_request_response' },
  RELATED_TYPES: { TASK: 'task' },
}));

const mockCreateNotification = vi.fn();
const mockFireNotification = vi.fn();
vi.mock('@/lib/services/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  fireNotification: (...args: unknown[]) => mockFireNotification(...args),
}));

vi.mock('@/lib/schemas/tasks', () => ({
  requestResponseSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>;
      if (!body?.status) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
      }
      return {
        success: true,
        data: {
          status: body.status,
          response_message: body.response_message as string | undefined,
        },
      };
    },
  },
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Chain factories
// ---------------------------------------------------------------------------

function makeSelectChain(value: unknown[]) {
  const c: Record<string, Mock> = {};
  ['from', 'leftJoin'].forEach((m) => {
    c[m] = vi.fn().mockReturnValue(c);
  });
  c.where = vi.fn().mockResolvedValue(value);
  return c;
}

function makeUpdateReturningChain(returnValue: unknown[]) {
  const c: Record<string, Mock> = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockReturnValue(c);
  c.returning = vi.fn().mockResolvedValue(returnValue);
  return c;
}

function makeUpdateWhereChain() {
  const c: Record<string, Mock> = {};
  c.set = vi.fn().mockReturnValue(c);
  c.where = vi.fn().mockResolvedValue(undefined);
  return c;
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PATCH } from '../route';

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

// Broadcast request (requestedUserId is null), created by user-2
const MOCK_TASK_REQUEST = {
  id: 'req-1',
  taskId: 'task-1',
  taskTitle: 'Reinigung',
  status: 'pending',
  requestedUserId: null,
  requestedBy: 'user-2',
};

const MOCK_UPDATED_REQUEST = {
  id: 'req-1',
  taskId: 'task-1',
  status: 'accepted',
  responseMessage: null,
};

function makeContext(id = 'req-1') {
  return { params: Promise.resolve({ id }) };
}

function makePatchRequest(id = 'req-1', body?: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost/api/task-requests/${id}`,
    body !== undefined
      ? {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : { method: 'PATCH' },
  );
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockCreateNotification.mockResolvedValue({ id: 'notif-1' });
  mockFireNotification.mockReturnValue(undefined);
});

// ============================================================================
// PATCH /api/task-requests/[id]
// ============================================================================

describe('PATCH /api/task-requests/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/task-requests/[id] — validation', () => {
  it('returns 400 when status is missing', async () => {
    const mockDb = (await import('@/db')).db as any;
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]));

    const response = await PATCH(makePatchRequest('req-1', {}), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/task-requests/[id] — not found', () => {
  it('returns 404 when request does not exist', async () => {
    const mockDb = (await import('@/db')).db as any;
    mockDb.select.mockReturnValueOnce(makeSelectChain([]));

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/task-requests/[id] — already answered', () => {
  it('returns 400 when request is not pending', async () => {
    const mockDb = (await import('@/db')).db as any;
    mockDb.select.mockReturnValueOnce(
      makeSelectChain([
        {
          ...MOCK_TASK_REQUEST,
          status: 'accepted',
        },
      ]),
    );

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/task-requests/[id] — own request', () => {
  it('returns 400 when user tries to answer their own request', async () => {
    const mockDb = (await import('@/db')).db as any;
    // requestedBy === session.user.id (user-1)
    mockDb.select.mockReturnValueOnce(
      makeSelectChain([
        {
          ...MOCK_TASK_REQUEST,
          requestedBy: 'user-1',
        },
      ]),
    );

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/task-requests/[id] — accept broadcast request', () => {
  it('returns 200 and fires notification', async () => {
    const mockDb = (await import('@/db')).db as any;
    // Select: fetch request
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]));
    // Update 1: update request status (with returning)
    mockDb.update
      .mockReturnValueOnce(makeUpdateReturningChain([MOCK_UPDATED_REQUEST]))
      // Update 2: update task status (where-terminal)
      .mockReturnValueOnce(makeUpdateWhereChain())
      // Update 3: cancel other broadcast requests (where-terminal)
      .mockReturnValueOnce(makeUpdateWhereChain());

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('req-1');
    expect(mockFireNotification).toHaveBeenCalled();
  });
});

describe('PATCH /api/task-requests/[id] — decline request', () => {
  it('returns 200 on decline', async () => {
    const mockDb = (await import('@/db')).db as any;
    // Select: fetch request
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]));
    // Update: update request status to declined (with returning)
    mockDb.update.mockReturnValueOnce(
      makeUpdateReturningChain([{ ...MOCK_UPDATED_REQUEST, status: 'declined' }]),
    );

    const response = await PATCH(makePatchRequest('req-1', { status: 'declined' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockFireNotification).toHaveBeenCalled();
  });
});
