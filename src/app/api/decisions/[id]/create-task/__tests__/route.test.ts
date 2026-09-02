/**
 * @vitest-environment node
 *
 * Tests for POST /api/decisions/[id]/create-task
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (_sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof _sectionOrHandler === 'function' ? _sectionOrHandler : maybeHandler;
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

const mockGetDbUserId = vi.fn();
vi.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId(...args),
}));

const mockCreateFollowUpTaskFromDecision = vi.fn();
vi.mock('@/lib/services/protocol-decision-tasks', () => ({
  createFollowUpTaskFromDecision: (...args: unknown[]) =>
    mockCreateFollowUpTaskFromDecision(...args),
}));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

const SESSION = { user: { id: 'user-1', email: 'admin@revampit.ch' } };

function makeContext(id = 'decision-1') {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/decisions/[id]/create-task — unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/decisions/decision-1/create-task', {
        method: 'POST',
      }),
      makeContext(),
    );

    expect(response.status).toBe(401);
  });
});

describe('POST /api/decisions/[id]/create-task — success', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(SESSION);
    mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' });
    mockCreateFollowUpTaskFromDecision.mockResolvedValue({
      taskId: 'task-1',
      linkId: 'link-1',
      protocolId: 'proto-1',
      actionItemId: 'action-1',
    });
  });

  it('creates a linked follow-up task', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/decisions/decision-1/create-task', {
        method: 'POST',
      }),
      makeContext(),
    );

    expect(response.status).toBe(201);
    expect(mockCreateFollowUpTaskFromDecision).toHaveBeenCalledWith('decision-1', 'db-user-1');
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.taskId).toBe('task-1');
  });

  it('maps closed-decision errors to 400', async () => {
    mockCreateFollowUpTaskFromDecision.mockRejectedValue(new Error('DECISION_NOT_CLOSED'));

    const response = await POST(
      new NextRequest('http://localhost/api/decisions/decision-1/create-task', {
        method: 'POST',
      }),
      makeContext(),
    );

    expect(response.status).toBe(400);
  });
});
