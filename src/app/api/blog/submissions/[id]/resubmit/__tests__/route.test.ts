/**
 * @vitest-environment node
 *
 * Tests for POST /api/blog/submissions/[id]/resubmit
 *
 * Mission-relevant: submitters can only revise their own submissions when
 * status is `requires_changes`. Ownership and status guards must be tight —
 * otherwise any authenticated user could hijack or re-queue another's work.
 *
 * Behaviors locked:
 *   POST /api/blog/submissions/[id]/resubmit
 *   - returns 401 when not authenticated
 *   - returns 400 when content is missing
 *   - returns 404 when submission does not exist
 *   - returns 403 when current user is not the submitter
 *   - returns 400 when status is not requires_changes
 *   - returns 200 on successful resubmission
 *   - resets status to pending on success
 *   - staff notification failure does not affect response
 *   - returns 500 when DB update throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth:
    (handler: (req: Request, session: unknown, context: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined;
        return handler(req, session, resolvedContext);
      }),
}));

// select chain: select().from().where()
const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

// update chain: update().set().where()
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  blogSubmissions: {
    id: 'bs_id',
    userId: 'bs_userId',
    title: 'bs_title',
    content: 'bs_content',
    excerpt: 'bs_excerpt',
    status: 'bs_status',
    reviewedBy: 'bs_reviewedBy',
    reviewedAt: 'bs_reviewedAt',
    rejectionReason: 'bs_rejectionReason',
    updatedAt: 'bs_updatedAt',
  },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'sql' }), { raw: vi.fn() }),
}));

vi.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    REQUIRES_CHANGES: 'requires_changes',
  },
}));

const mockNotifyAllStaff = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

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
    id: 'user-author',
    email: 'author@example.com',
    name: 'Author',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

const MOCK_SUBMISSION = {
  id: 'sub-1',
  userId: 'user-author',
  title: 'Mein Beitrag',
  content: 'Alter Inhalt...',
  excerpt: null,
  status: 'requires_changes',
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: 'Needs more detail',
  updatedAt: '2026-05-01',
};

function makeRequest(body: Record<string, unknown> = {}, id = 'sub-1') {
  return new NextRequest(`http://localhost/api/blog/submissions/${id}/resubmit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'sub-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockSelect.mockReturnValue({ from: mockSelectFrom });
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelectWhere.mockResolvedValue([MOCK_SUBMISSION]);
  mockUpdate.mockReturnValue({ set: mockUpdateSet });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue([]);
  mockNotifyAllStaff.mockResolvedValue(undefined);
});

// ============================================================================
// POST /api/blog/submissions/[id]/resubmit
// ============================================================================

describe('POST /api/blog/submissions/[id]/resubmit — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest({ content: 'New content' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/blog/submissions/[id]/resubmit — validation', () => {
  it('returns 400 when content is empty', async () => {
    const response = await POST(makeRequest({ content: '' }), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when content is missing', async () => {
    const response = await POST(makeRequest({}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when title is empty string', async () => {
    const response = await POST(makeRequest({ content: 'Good content', title: '' }), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when submission does not exist', async () => {
    mockSelectWhere.mockResolvedValueOnce([]);
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 403 when user is not the submitter', async () => {
    mockSelectWhere.mockResolvedValueOnce([{ ...MOCK_SUBMISSION, userId: 'different-user' }]);
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(403);
  });

  it('returns 400 when submission status is not requires_changes', async () => {
    mockSelectWhere.mockResolvedValueOnce([{ ...MOCK_SUBMISSION, status: 'pending' }]);
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/blog/submissions/[id]/resubmit — success', () => {
  it('returns 200 on successful resubmission', async () => {
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(200);
  });

  it('returns status: pending in response', async () => {
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    const body = await response.json();
    expect(body.data.status).toBe('pending');
  });

  it('returns submission id in response', async () => {
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    const body = await response.json();
    expect(body.data.id).toBe('sub-1');
  });

  it('still returns 200 when staff notification fails', async () => {
    mockNotifyAllStaff.mockRejectedValueOnce(new Error('notification service down'));
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(200);
  });
});

describe('POST /api/blog/submissions/[id]/resubmit — DB error', () => {
  it('returns 500 when DB update throws', async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(makeRequest({ content: 'Updated content' }), makeContext());
    expect(response.status).toBe(500);
  });
});
