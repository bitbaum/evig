/**
 * @vitest-environment node
 *
 * Tests for GET /api/reviews and POST /api/reviews
 *
 * Behaviors locked:
 *   GET  - 200 (published reviews), 401 (non-published without auth), 403 (non-staff requesting non-published)
 *   POST - 401, 400 (invalid body), 400 (duplicate), 404 (target not found), 201 (success)
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

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
let mockOffset: Mock;

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id',
    reviewerId: 'r_reviewerId',
    targetType: 'r_targetType',
    targetId: 'r_targetId',
    bookingId: 'r_bookingId',
    overallRating: 'r_overallRating',
    communicationRating: 'r_communicationRating',
    professionalismRating: 'r_professionalismRating',
    qualityRating: 'r_qualityRating',
    timelinessRating: 'r_timelinessRating',
    valueRating: 'r_valueRating',
    title: 'r_title',
    content: 'r_content',
    isVerifiedPurchase: 'r_isVerifiedPurchase',
    helpfulVotes: 'r_helpfulVotes',
    totalVotes: 'r_totalVotes',
    status: 'r_status',
    createdAt: 'r_createdAt',
    updatedAt: 'r_updatedAt',
  },
  reviewResponses: {
    reviewId: 'rr_reviewId',
    id: 'rr_id',
    content: 'rr_content',
    createdAt: 'rr_createdAt',
    responderId: 'rr_responderId',
    status: 'rr_status',
  },
  reviewVotes: {
    voteType: 'rv_voteType',
    reviewId: 'rv_reviewId',
    voterId: 'rv_voterId',
  },
  reviewAttachments: {
    id: 'ra_id',
    reviewId: 'ra_reviewId',
    originalFilename: 'ra_originalFilename',
    filePath: 'ra_filePath',
    mimeType: 'ra_mimeType',
    attachmentType: 'ra_attachmentType',
  },
}));

vi.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('@/db/schema/services', () => ({
  repairerProfiles: { id: 'rp_id', businessName: 'rp_businessName', userId: 'rp_userId' },
}));

vi.mock('@/db/schema/marketplace', () => ({
  listings: { id: 'l_id', title: 'l_title' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  asc: (a: unknown) => ({ __asc: a }),
  desc: (a: unknown) => ({ __desc: a }),
}));

vi.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: {
    REPAIRER: 'repairer',
    SERVICE: 'service',
    WORKSHOP: 'workshop',
    IT_HILFE: 'it_hilfe',
    LISTING: 'listing',
  },
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
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),

    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Internal Server Error' },
}));

vi.mock('@/lib/schemas', async () => {
  return {
    validateBody: vi.fn((schema: unknown, body: unknown) => {
      // Pass through for most tests — individual tests override per-test
      return { success: true as const, data: body };
    }),
    validateQuery: vi.fn((_schema: unknown, params: Record<string, string | null>) => {
      // Provide defaults matching what the real schema would produce
      return {
        success: true as const,
        data: {
          targetType: params.targetType ?? 'repairer',
          targetId: params.targetId ?? 'target-uuid',
          status: params.status ?? 'published',
          limit: parseInt(params.limit ?? '10'),
          offset: parseInt(params.offset ?? '0'),
          sortBy: params.sortBy ?? 'created_at',
          sortOrder: params.sortOrder ?? 'desc',
        },
      };
    }),
    CreateReviewSchema: {},
    GetReviewsQuerySchema: {},
  };
});

vi.mock('@/lib/reviews/review-service', () => ({
  validateReviewTarget: vi.fn(),
  notifyRepairerOfReview: vi.fn(),
}));

vi.mock('@/lib/reviews/create-review', () => ({
  createReview: vi.fn(),
  findDuplicateReview: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    reviewCreate: vi.fn().mockReturnValue(true),
  },
}));

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

const { validateBody, validateQuery } = (await import('@/lib/schemas')) as any;
const { validateReviewTarget, notifyRepairerOfReview } =
  (await import('@/lib/reviews/review-service')) as any;
const { createReview, findDuplicateReview } = (await import('@/lib/reviews/create-review')) as any;
const { rateLimiters } = (await import('@/lib/security/rate-limit')) as any;

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

const MOCK_ADMIN_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin User',
    isStaff: true,
    staffPermissions: ['*'] as string[],
  },
  expires: '2027-01-01',
};

const MOCK_REVIEW_ROW = {
  _total: 1,
  id: 'review-1',
  reviewerId: 'user-1',
  reviewerName: 'Test User',
  targetType: 'repairer',
  targetId: 'target-1',
  targetName: 'Fix It Shop',
  bookingId: null,
  overallRating: 4,
  communicationRating: null,
  professionalismRating: null,
  qualityRating: null,
  timelinessRating: null,
  valueRating: null,
  title: 'Great service',
  content: 'Very happy with the repair',
  isVerifiedPurchase: false,
  helpfulVotes: 0,
  totalVotes: 0,
  status: 'published',
  createdAt: new Date(),
  updatedAt: new Date(),
  userHasVoted: false,
  userVote: null,
  responseId: null,
  responseContent: null,
  responseCreatedAt: null,
  responderName: null,
  attachments: [],
};

function buildSelectChain(resolvedValue: unknown[]) {
  mockOffset = vi.fn().mockResolvedValue(resolvedValue);
  const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
  const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
  const mockLeftJoin = vi.fn().mockReturnValue({
    leftJoin: undefined as unknown,
    where: mockWhere,
    orderBy: mockOrderBy,
  });
  // We need leftJoin to chain back to itself multiple times
  const chainObj: Record<string, unknown> = {
    where: mockWhere,
    orderBy: mockOrderBy,
    leftJoin: vi.fn(),
    innerJoin: vi.fn(),
  };
  const mockInnerJoin = vi.fn().mockReturnValue(chainObj);
  const mockLeftJoin2 = vi.fn().mockReturnValue(chainObj);
  chainObj.leftJoin = mockLeftJoin2;
  chainObj.innerJoin = mockInnerJoin;
  mockLeftJoin.mockReturnValue(chainObj);
  const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin });

  // Subquery chain: .from().where().as() — synchronous only
  const mockSubAs = vi.fn().mockReturnValue({
    id: 'sub_id',
    reviewId: 'sub_reviewId',
    content: 'sub_content',
    createdAt: 'sub_createdAt',
    responderId: 'sub_responderId',
    name: 'sub_name',
  });
  const mockSubWhere = vi.fn().mockReturnValue({ as: mockSubAs });
  const mockSubFrom = vi.fn().mockReturnValue({ as: mockSubAs, where: mockSubWhere });

  // Main select vs subquery select: first two calls are subqueries (return sync chain), rest are main query
  let selectCallCount = 0;
  mockSelect.mockImplementation(() => {
    selectCallCount++;
    if (selectCallCount <= 2) {
      // subquery chain
      return { from: mockSubFrom };
    }
    // main query chain
    return { from: mockFrom };
  });

  // Override the where on chainObj to chain to orderBy/limit/offset
  chainObj.where = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  validateBody.mockImplementation((_schema: unknown, body: unknown) => ({
    success: true as const,
    data: body,
  }));
  validateQuery.mockImplementation((_schema: unknown, params: Record<string, string | null>) => ({
    success: true as const,
    data: {
      targetType: params.targetType ?? 'repairer',
      targetId: params.targetId ?? 'target-uuid-1234-5678-abcd-ef0123456789',
      status: params.status ?? 'published',
      limit: parseInt(params.limit ?? '10'),
      offset: parseInt(params.offset ?? '0'),
      sortBy: params.sortBy ?? 'created_at',
      sortOrder: params.sortOrder ?? 'desc',
    },
  }));
  rateLimiters.reviewCreate.mockReturnValue(true);
  validateReviewTarget.mockResolvedValue(true);
  notifyRepairerOfReview.mockResolvedValue(undefined);
  createReview.mockResolvedValue({ reviewId: 'new-review-1' });
  findDuplicateReview.mockResolvedValue(null);
  buildSelectChain([MOCK_REVIEW_ROW]);
});

// ============================================================================
// GET — browse reviews
// ============================================================================

describe('GET /api/reviews — published (no auth)', () => {
  it('returns 200 with published reviews', async () => {
    const req = new NextRequest(
      'http://localhost/api/reviews?targetType=repairer&targetId=target-uuid-1234-5678-abcd-ef0123456789',
    );
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.reviews)).toBe(true);
    expect(body.data.reviews[0].id).toBe('review-1');
  });

  it('returns 200 with empty list when no reviews found', async () => {
    mockOffset.mockResolvedValueOnce([]);
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost/api/reviews?targetType=repairer&targetId=target-uuid-1234-5678-abcd-ef0123456789',
    );
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.reviews).toEqual([]);
    expect(body.data.total).toBe(0);
  });
});

describe('GET /api/reviews — non-published requires auth', () => {
  it('returns 401 when requesting non-published without session', async () => {
    validateQuery.mockReturnValueOnce({
      success: true as const,
      data: {
        targetType: 'repairer',
        targetId: 'target-uuid',
        status: 'pending_moderation',
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    });
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest(
      'http://localhost/api/reviews?targetType=repairer&targetId=target-uuid&status=pending_moderation',
    );
    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it('returns 403 when non-staff user requests non-published', async () => {
    validateQuery.mockReturnValueOnce({
      success: true as const,
      data: {
        targetType: 'repairer',
        targetId: 'target-uuid',
        status: 'pending_moderation',
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    });
    mockAuth.mockResolvedValueOnce(MOCK_SESSION);
    const req = new NextRequest(
      'http://localhost/api/reviews?targetType=repairer&targetId=target-uuid&status=pending_moderation',
    );
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  it('returns 200 when admin requests non-published', async () => {
    validateQuery.mockReturnValueOnce({
      success: true as const,
      data: {
        targetType: 'repairer',
        targetId: 'target-uuid',
        status: 'pending_moderation',
        limit: 10,
        offset: 0,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    });
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION);
    const req = new NextRequest(
      'http://localhost/api/reviews?targetType=repairer&targetId=target-uuid&status=pending_moderation',
    );
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});

describe('GET /api/reviews — query validation failure', () => {
  it('returns 400 when query params are invalid', async () => {
    validateQuery.mockReturnValueOnce({
      success: false as const,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Abfrageparameter' },
        { status: 400 },
      ),
    });
    const req = new NextRequest('http://localhost/api/reviews');
    const response = await GET(req);
    expect(response.status).toBe(400);
  });
});

// ============================================================================
// POST — create review
// ============================================================================

describe('POST /api/reviews — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/reviews — rate limit', () => {
  it('returns 429 when rate limit exceeded', async () => {
    rateLimiters.reviewCreate.mockReturnValueOnce(false);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(429);
  });
});

describe('POST /api/reviews — validation', () => {
  it('returns 400 when body is invalid', async () => {
    validateBody.mockReturnValueOnce({
      success: false as const,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ targetType: 'repairer' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/reviews — duplicate check', () => {
  it('returns 400 when duplicate review exists', async () => {
    findDuplicateReview.mockResolvedValueOnce('existing-review-id');
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'repairer',
        targetId: 'target-uuid-1234-5678-abcd-ef0123456789',
        overallRating: 4,
        content: 'This is a duplicate review',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/bereits eine Bewertung/);
  });
});

describe('POST /api/reviews — target validation', () => {
  it('returns 404 when target does not exist', async () => {
    validateReviewTarget.mockResolvedValueOnce(false);
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'repairer',
        targetId: 'nonexistent-uuid-1234-5678-abcd',
        overallRating: 4,
        content: 'Review for nonexistent target',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toMatch(/nicht gefunden/);
  });
});

describe('POST /api/reviews — success', () => {
  it('returns 201 with created review id', async () => {
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'repairer',
        targetId: 'target-uuid-1234-5678-abcd-ef0123456789',
        overallRating: 5,
        content: 'Excellent service, very professional!',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.reviewId).toBe('new-review-1');
  });

  it('calls notifyRepairerOfReview for repairer target', async () => {
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'repairer',
        targetId: 'repairer-uuid-1234-5678-abcd-ef01',
        overallRating: 5,
        content: 'Excellent repair, highly recommend!',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    await POST(req);
    expect(notifyRepairerOfReview).toHaveBeenCalledTimes(1);
  });

  it('does not call notifyRepairerOfReview for non-repairer target', async () => {
    validateBody.mockReturnValueOnce({
      success: true as const,
      data: {
        targetType: 'listing',
        targetId: 'listing-uuid-1234-5678-abcd-ef01',
        overallRating: 4,
        content: 'Good listing, very accurate description!',
      },
    });
    const req = new NextRequest('http://localhost/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        targetType: 'listing',
        targetId: 'listing-uuid-1234-5678-abcd-ef01',
        overallRating: 4,
        content: 'Good listing, very accurate description!',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    await POST(req);
    expect(notifyRepairerOfReview).not.toHaveBeenCalled();
  });
});
