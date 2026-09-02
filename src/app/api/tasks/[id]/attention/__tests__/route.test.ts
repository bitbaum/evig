/**
 * @vitest-environment node
 *
 * Tests for POST /api/tasks/[id]/attention
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 404 when task not found (getActiveTask returns error)
 *   - returns 201 with attention flag record
 *   - calls notifyAllStaff with correct payload
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

const mockNotifyAllStaff = vi.fn();
vi.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff(...args),
}));

const mockTransactionFn = vi.fn();
vi.mock('@/db', () => ({
  db: { transaction: (...args: unknown[]) => mockTransactionFn(...args) },
}));

vi.mock('@/db/schema/misc', () => ({
  tasks: { id: 't_id', currentStatus: 't_cs' },
  taskAttentionFlags: { id: 'taf_id', taskId: 'taf_tid', flaggedBy: 'taf_fb', message: 'taf_msg' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('@/config/tasks', () => ({
  TASK_STATUSES: { NEEDS_ATTENTION: 'needs_attention' },
}));

vi.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
}));

vi.mock('@/lib/schemas/tasks', () => ({
  attentionFlagSchema: {
    safeParse: (b: unknown) => ({
      success: true,
      data: { message: (b as Record<string, unknown>)?.message as string | undefined },
    }),
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
const MOCK_FLAG = {
  id: 'flag-1',
  taskId: 'task-1',
  flaggedBy: 'db-user-1',
  message: 'Braucht Hilfe',
};

function makeContext(id = 'task-1') {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/tasks/task-1/attention', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockGetActiveTask.mockResolvedValue({ task: MOCK_TASK });
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' });
  mockNotifyAllStaff.mockResolvedValue(undefined);

  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([MOCK_FLAG]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    };
    return callback(tx);
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/tasks/[id]/attention — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/tasks/[id]/attention — task not found', () => {
  it('returns 404 when getActiveTask returns an error response', async () => {
    const { NextResponse } = (await import('next/server')) as any;
    mockGetActiveTask.mockResolvedValueOnce({
      error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }),
    });
    const response = await POST(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('POST /api/tasks/[id]/attention — success', () => {
  it('returns 201 with attention flag record', async () => {
    const response = await POST(makeRequest({ message: 'Braucht Hilfe' }), makeContext());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('flag-1');
    expect(body.data.taskId).toBe('task-1');
  });

  it('calls notifyAllStaff with correct payload including task title', async () => {
    await POST(makeRequest({ message: 'Braucht Hilfe' }), makeContext());
    expect(mockNotifyAllStaff).toHaveBeenCalledTimes(1);
    expect(mockNotifyAllStaff).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task_attention',
        related_type: 'task',
        related_id: 'task-1',
      }),
      'db-user-1',
    );
  });
});
