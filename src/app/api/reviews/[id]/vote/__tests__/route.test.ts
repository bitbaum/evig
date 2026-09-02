/**
 * @vitest-environment node
 *
 * Tests for POST /api/reviews/[id]/vote
 *
 * Behaviors locked:
 *   POST - 401, 400 (invalid body), 404 (review not found), 400 (review not published),
 *          200 (remove vote - same voteType), 200 (change vote), 201 (new vote)
 */

const mockAuth = vi.fn();

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<unknown> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

const mockSelect = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id',
    status: 'r_status',
    helpfulVotes: 'r_helpfulVotes',
    totalVotes: 'r_totalVotes',
    updatedAt: 'r_updatedAt',
  },
  reviewVotes: {
    reviewId: 'rv_reviewId',
    voterId: 'rv_voterId',
    voteType: 'rv_voteType',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/review-status', () => ({
  REVIEW_STATUS: {
    PUBLISHED: 'published',
    PENDING_MODERATION: 'pending_moderation',
    HIDDEN: 'hidden',
    DELETED: 'deleted',
  },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, _details?: unknown) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal Server Error' },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: vi.fn((_schema: unknown, body: unknown) => ({
    success: true as const,
    data: body,
  })),
  ReviewVoteSchema: {},
}));

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

const { validateBody } = (await import('@/lib/schemas')) as any;

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
};

const PUBLISHED_REVIEW = { id: 'review-1', status: 'published' };

function setupSelectMocks(reviewRows: unknown[], existingVoteRows: unknown[]) {
  mockSelect.mockImplementation(() => {
    // Promise.all runs two selects in parallel; we use an index but mockImplementation is called per-chain
    // The route uses Promise.all([db.select...., db.select....])
    // Each call to db.select() returns a new chain. Track with a counter.
    const callCount = (mockSelect as Mock).mock.calls.length;
    if (callCount % 2 === 1) {
      // Odd calls: review query
      const mockWhere = vi.fn().mockResolvedValue(reviewRows);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      return { from: mockFrom };
    } else {
      // Even calls: vote query
      const mockWhere = vi.fn().mockResolvedValue(existingVoteRows);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      return { from: mockFrom };
    }
  });
}

function setupTransactionMock() {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
    };
    return fn(tx);
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  validateBody.mockImplementation((_schema: unknown, body: unknown) => ({
    success: true as const,
    data: body,
  }));
  setupSelectMocks([PUBLISHED_REVIEW], []);
  setupTransactionMock();
});

// ============================================================================
// POST — vote on review
// ============================================================================

describe('POST /api/reviews/[id]/vote — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(401);
  });
});

describe('POST /api/reviews/[id]/vote — validation', () => {
  it('returns 400 when body is invalid', async () => {
    validateBody.mockReturnValueOnce({
      success: false as const,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/reviews/[id]/vote — review not found', () => {
  it('returns 404 when review does not exist', async () => {
    setupSelectMocks([], []);
    const req = new NextRequest('http://localhost/api/reviews/nonexistent/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/reviews/[id]/vote — review not published', () => {
  it('returns 400 when review is not published', async () => {
    setupSelectMocks([{ id: 'review-1', status: 'pending_moderation' }], []);
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/nicht verfügbar/);
  });
});

describe('POST /api/reviews/[id]/vote — new vote', () => {
  it('returns 201 when adding a new helpful vote', async () => {
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.action).toBe('added');
  });

  it('returns 201 when adding a new unhelpful vote', async () => {
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'unhelpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.action).toBe('added');
  });
});

describe('POST /api/reviews/[id]/vote — toggle vote', () => {
  it('returns 200 with action=removed when voting same type (toggle off)', async () => {
    setupSelectMocks([PUBLISHED_REVIEW], [{ voteType: 'helpful' }]);
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.action).toBe('removed');
  });

  it('returns 200 with action=updated when changing vote type', async () => {
    setupSelectMocks([PUBLISHED_REVIEW], [{ voteType: 'unhelpful' }]);
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.action).toBe('updated');
  });
});
