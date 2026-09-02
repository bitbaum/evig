/**
 * @vitest-environment node
 *
 * Tests for GET + POST /api/it-hilfe/requests/[id]/offers
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/db', () => {
  const update = (...args: unknown[]) => {
    mockUpdate(...args);
    return { set: mockSet };
  };
  const insert = (...args: unknown[]) => {
    mockInsert(...args);
    return { values: mockValues };
  };
  return {
    db: {
      select: (...args: unknown[]) => mockSelect(...args),
      update,
      insert,
      // The offers POST wraps the offer write + count bump in a transaction
      // (single offer_count writer). The tx exposes the same mocked builders.
      transaction: async (cb: (tx: unknown) => unknown) => cb({ update, insert }),
    },
  };
});

vi.mock('@/db/schema', () => ({
  itHilfeRequests: {
    id: 'ihr_id',
    requesterId: 'ihr_requesterId',
    status: 'ihr_status',
    title: 'ihr_title',
    offerCount: 'ihr_offerCount',
    expiresAt: 'ihr_expiresAt',
  },
  itHilfeOffers: {
    id: 'iho_id',
    requestId: 'iho_requestId',
    helperId: 'iho_helperId',
    status: 'iho_status',
    message: 'iho_message',
    estimatedTime: 'iho_estimatedTime',
    proposedCompensation: 'iho_proposedCompensation',
    proposedAmountCents: 'iho_proposedAmountCents',
    relevantSkills: 'iho_relevantSkills',
    createdAt: 'iho_createdAt',
    repairerProfileId: 'iho_repairerProfileId',
  },
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    businessName: 'rp_businessName',
    isVerified: 'rp_isVerified',
    averageRating: 'rp_averageRating',
    totalReviews: 'rp_totalReviews',
    isActive: 'rp_isActive',
  },
  userProfiles: { userId: 'up_userId', isVerified: 'up_isVerified' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
}));

// ── Other mocks ────────────────────────────────────────────────────────────

const mockValidateBody = vi.fn();

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  CreateOfferSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 401 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Server error' },
}));

vi.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  OFFER_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  },
}));

vi.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/services/notifications', () => ({
  notifyUsers: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeNewOfferReceived: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { offerCreate: vi.fn().mockReturnValue(true) },
  getClientIdentifier: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }));

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
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

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function makeRequest(id: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers`, {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
}

// Chain builders
function buildSelectChain(rows: unknown[]) {
  mockOrderBy.mockResolvedValue(rows);
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockInnerJoin.mockReturnValue({ where: mockWhere, leftJoin: mockLeftJoin });
  mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin });
  mockSelect.mockReturnValue({ from: mockFrom });
}

// ── GET Tests ──────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/requests/[id]/offers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not the request owner', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // First select: request ownership check
    mockWhere.mockResolvedValueOnce([{ requesterId: 'other-user', status: 'open' }]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(403);
  });

  it('returns 200 with offers when owner requests', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // First select: ownership check
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ requesterId: 'user-1', status: 'open' }]),
      }),
    });

    // Second select: offers with joins
    const offerRow = {
      id: 'offer-1',
      requestId: VALID_UUID,
      helperId: 'helper-1',
      helperName: 'Helper',
      helperEmail: 'helper@example.com',
      message: 'I can help',
      estimatedTime: null,
      proposedCompensation: null,
      relevantSkills: null,
      status: 'pending',
      createdAt: new Date('2024-01-01'),
      repairerProfileId: null,
      repairerBusinessName: null,
      repairerIsVerified: null,
      repairerAverageRating: null,
      repairerTotalReviews: null,
    };
    mockOrderBy.mockResolvedValue([offerRow]);
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
    mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await GET(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.offers).toHaveLength(1);
    expect(body.data.offers[0].id).toBe('offer-1');
  });
});

// ── POST Tests ─────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/offers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockReturning.mockResolvedValue([{ id: 'new-offer-1' }]);
    mockValues.mockReturnValue({ returning: mockReturning });
    // Reset rate limiter to allow by default
    const { rateLimiters } = (await import('@/lib/security/rate-limit')) as unknown as {
      rateLimiters: { offerCreate: Mock };
    };
    rateLimiters.offerCreate.mockReturnValue(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when rate limited', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    const { rateLimiters } = (await import('@/lib/security/rate-limit')) as unknown as {
      rateLimiters: { offerCreate: Mock };
    };
    rateLimiters.offerCreate.mockReturnValue(false);

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(429);
  });

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // requestData select + innerJoin chain → not found
    mockWhere.mockResolvedValue([]);
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when posting on own request', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // Return request owned by same user
    mockWhere.mockResolvedValue([
      {
        requesterId: 'user-1',
        status: 'open',
        title: 'X',
        requester_name: 'Test',
        requester_email: 'user@example.com',
      },
    ]);
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when request status is not open', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    mockWhere.mockResolvedValue([
      {
        requesterId: 'other-user',
        status: 'matched',
        title: 'X',
        requester_name: 'Jane',
        requester_email: 'jane@example.com',
      },
    ]);
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ innerJoin: mockInnerJoin });
    mockSelect.mockReturnValue({ from: mockFrom });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when validation fails', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // Request select (open, different owner)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              requesterId: 'other-user',
              status: 'open',
              title: 'X',
              requester_name: 'Jane',
              requester_email: 'jane@example.com',
            },
          ]),
        }),
      }),
    });
    // Expiry check → not expired
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    // Existing offer check → none
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    mockValidateBody.mockReturnValue({
      success: false,
      error: NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 }),
    });

    const res = await POST(makeRequest(VALID_UUID, 'POST', {}), routeParams(VALID_UUID));
    expect(res.status).toBe(400);
  });

  it('returns 201 when offer is created successfully', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // 1. Request + user join
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              requesterId: 'other-user',
              status: 'open',
              title: 'Fix laptop',
              requester_name: 'Jane',
              requester_email: 'jane@example.com',
            },
          ]),
        }),
      }),
    });
    // 2. Expiry check → not expired
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    // 3. Existing offer check → none
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    // 4. Technician profile check → active profile (registered technician)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'rp-1' }]),
      }),
    });

    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'I can help',
        estimatedTime: null,
        proposedCompensation: null,
        relevantSkills: [],
      },
    });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'I can help' }),
      routeParams(VALID_UUID),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.offerId).toBe('new-offer-1');
  });

  it('returns 403 when the user is not a registered technician', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // 1. Request + user join → open, not owner
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              requesterId: 'other-user',
              status: 'open',
              title: 'Fix laptop',
              requester_name: 'Jane',
              requester_email: 'jane@example.com',
            },
          ]),
        }),
      }),
    });
    // 2. Expiry check → not expired
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    // 3. Existing offer check → none
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    // 4. Technician profile check → none (NOT registered as a technician)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'I can help',
        estimatedTime: null,
        proposedCompensation: null,
        relevantSkills: [],
      },
    });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'I can help' }),
      routeParams(VALID_UUID),
    );
    expect(res.status).toBe(403);
  });

  it('resurrects a withdrawn offer instead of returning 400 (UPDATE not INSERT)', async () => {
    // Helper previously submitted, then withdrew. They want to re-offer on
    // the same OPEN request. Old behaviour: 400 "Du hast bereits ein
    // Angebot abgegeben". New: UPDATE the withdrawn row back to PENDING.
    // Locks in the fix so a future refactor can't silently regress.
    mockAuth.mockResolvedValue(MOCK_SESSION);

    // 1. Request select — open, not owner
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              requesterId: 'other-user',
              status: 'open',
              title: 'Fix laptop',
              requester_name: 'Jane',
              requester_email: 'jane@example.com',
            },
          ]),
        }),
      }),
    });
    // 2. Expiry check — not expired
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    // 3. Existing-offer check — WITHDRAWN row found
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'old-withdrawn-offer', status: 'withdrawn' }]),
      }),
    });
    // 4. Technician profile check — active profile (registered technician)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'rp-1' }]) }),
    });

    // The resurrect path uses .update().set().where().returning() — set up
    // a chain that supports it (overrides the default chain which has no
    // .returning()).
    const resurrectReturning = vi.fn().mockResolvedValue([{ id: 'old-withdrawn-offer' }]);
    const resurrectWhere = vi.fn().mockReturnValue({ returning: resurrectReturning });
    // Subsequent calls (offerCount increment) use the default where→Promise pattern
    mockSet
      .mockReturnValueOnce({ where: resurrectWhere }) // First update call: resurrect
      .mockReturnValue({ where: mockUpdateWhere }); // Subsequent: offerCount

    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'I changed my mind, I can help!',
        estimatedTime: null,
        proposedCompensation: null,
        relevantSkills: [],
      },
    });

    const res = await POST(
      makeRequest(VALID_UUID, 'POST', { message: 'I changed my mind, I can help!' }),
      routeParams(VALID_UUID),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    // Returned offerId is the resurrected row's id, NOT a fresh one
    expect(body.data.offerId).toBe('old-withdrawn-offer');
    // UPDATE path taken — INSERT must NOT have been called
    expect(mockInsert).not.toHaveBeenCalled();
    expect(resurrectReturning).toHaveBeenCalledTimes(1);
  });

  it('passes a verifiable signed acceptUrl to the offer-received email template', async () => {
    // Real signing helper needs AUTH_SECRET. This test deliberately does NOT
    // mock @/lib/it-hilfe/offer-accept-tokens — we want to exercise the real
    // signing path and round-trip the token back through verify.
    const previous = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'test-secret-offers-route-' + Date.now();

    mockAuth.mockResolvedValue(MOCK_SESSION);

    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              requesterId: 'other-user',
              status: 'open',
              title: 'Fix laptop',
              requester_name: 'Jane',
              requester_email: 'jane@example.com',
            },
          ]),
        }),
      }),
    });
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });
    // Technician profile check → active profile (registered technician)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'rp-1' }]) }),
    });

    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        message: 'I can help',
        estimatedTime: null,
        proposedCompensation: null,
        relevantSkills: [],
      },
    });

    try {
      const res = await POST(
        makeRequest(VALID_UUID, 'POST', { message: 'I can help' }),
        routeParams(VALID_UUID),
      );
      expect(res.status).toBe(201);

      // Inspect the central notifyUsers call — acceptUrl is now carried in
      // metadata (the offers route post-QQ.4.3 routes through notifyUsers,
      // which dispatches to itHilfeNewOfferReceived via getEmailContent).
      const notifMock = (await import('@/lib/services/notifications')) as unknown as {
        notifyUsers: Mock;
      };
      expect(notifMock.notifyUsers).toHaveBeenCalledTimes(1);
      const payload = notifMock.notifyUsers.mock.calls[0][1] as {
        metadata?: { acceptUrl?: string };
      };
      const acceptUrl = payload?.metadata?.acceptUrl;
      expect(typeof acceptUrl).toBe('string');
      expect(acceptUrl).toMatch(/^https:\/\/example\.com\/it-hilfe\/accept\?token=/);

      // Extract the token and round-trip it through the real verifier
      const url = new URL(acceptUrl as string);
      const token = url.searchParams.get('token');
      expect(token).toBeTruthy();

      const { verifyOfferAcceptToken } = (await vi.importActual(
        '@/lib/it-hilfe/offer-accept-tokens',
      )) as {
        verifyOfferAcceptToken: (t: string) => { ok: boolean; offerId?: string; reason?: string };
      };
      const verifyResult = verifyOfferAcceptToken(token as string);
      expect(verifyResult.ok).toBe(true);
      expect(verifyResult.offerId).toBe('new-offer-1');
    } finally {
      if (previous === undefined) {
        delete process.env.AUTH_SECRET;
      } else {
        process.env.AUTH_SECRET = previous;
      }
    }
  });
});
