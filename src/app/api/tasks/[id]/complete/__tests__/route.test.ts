/**
 * @vitest-environment node
 *
 * Tests for POST /api/tasks/[id]/complete
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 404 when task not found (getActiveTask returns error)
 *   - returns 201 with completion record
 *   - calls notifyUsers when task.created_by differs from dbUserId
 *   - does NOT call notifyUsers when task.created_by equals dbUserId
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({ auth: (...args: unknown[]) => mockAuth(...args) }));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin:
    (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined;
        return handler(req, session, resolvedContext);
      }),
}));

const mockGetDbUserId = vi.fn();
const mockGetActiveTask = vi.fn();
vi.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId(...args),
  getActiveTask: (...args: unknown[]) => mockGetActiveTask(...args),
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

const mockInsertReturning = vi.fn();
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  taskCompletions: { id: 'tc_id', taskId: 'tc_tid', completedBy: 'tc_cb', completedAt: 'tc_ca' },
}));

vi.mock('drizzle-orm', () => ({
  sql: Object.assign(vi.fn().mockReturnValue({}), { raw: vi.fn().mockReturnValue({}) }),
}));

const mockNotifyUsers = vi.fn();
vi.mock('@/lib/services/notifications', () => ({
  notifyUsers: (...args: unknown[]) => mockNotifyUsers(...args),
}));

vi.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
}));

vi.mock('@/lib/schemas/tasks', () => ({
  taskCompletionSchema: {
    safeParse: (b: unknown) => {
      return {
        success: true,
        data: {
          notes: (b as Record<string, unknown>)?.notes || undefined,
          duration_minutes: undefined,
        },
      };
    },
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

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

const MOCK_TASK = { id: 'task-1', title: 'Reinigung', created_by: 'db-user-2', is_archived: false };

function makeContext(id = 'task-1') {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/tasks/task-1/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetActiveTask.mockResolvedValue({ task: MOCK_TASK });
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' });
  mockInsertReturning.mockResolvedValue([
    { id: 'comp-1', taskId: 'task-1', completedBy: 'db-user-1' },
  ]);
  mockNotifyUsers.mockResolvedValue(undefined);
  ((await import('@/db')).db.insert as any).mockReturnValue({
    values: vi.fn().mockReturnValue({ returning: mockInsertReturning }),
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/tasks/[id]/complete — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/tasks/[id]/complete — task not found', () => {
  it('returns 404 when getActiveTask returns an error response', async () => {
    const { NextResponse } = (await import('next/server')) as any;
    mockGetActiveTask.mockResolvedValueOnce({
      error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }),
    });
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('POST /api/tasks/[id]/complete — success', () => {
  it('returns 201 with completion record', async () => {
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('comp-1');
    expect(body.data.taskId).toBe('task-1');
  });

  it('calls notifyUsers when task.created_by differs from dbUserId', async () => {
    // MOCK_TASK.created_by = 'db-user-2', dbUserId = 'db-user-1' → should notify
    await POST(makeRequest(), makeContext());
    expect(mockNotifyUsers).toHaveBeenCalledTimes(1);
    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['db-user-2'],
      expect.objectContaining({
        type: 'task_completed',
        related_type: 'task',
        related_id: 'task-1',
      }),
    );
  });

  it('does NOT call notifyUsers when task.created_by equals dbUserId', async () => {
    // Both are 'db-user-1' → no self-notification
    mockGetActiveTask.mockResolvedValueOnce({
      task: { ...MOCK_TASK, created_by: 'db-user-1' },
    });
    await POST(makeRequest(), makeContext());
    expect(mockNotifyUsers).not.toHaveBeenCalled();
  });
});
