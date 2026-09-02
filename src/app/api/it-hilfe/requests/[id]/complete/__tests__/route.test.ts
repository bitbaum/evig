/**
 * @vitest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/complete (withAuth)
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<{ id: string }> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  itHilfeRequests: {
    id: 'ihr_id',
    requesterId: 'ihr_requesterId',
    status: 'ihr_status',
    title: 'ihr_title',
    matchedOfferId: 'ihr_matchedOfferId',
    completedAt: 'ihr_completedAt',
    completedBy: 'ihr_completedBy',
  },
  itHilfeOffers: { id: 'iho_id', helperId: 'iho_helperId', status: 'iho_status' },
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    totalJobsCompleted: 'rp_totalJobsCompleted',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_t: unknown) => 'it_hilfe_requests',
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
  notifyRequestCompleted: vi.fn(),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const MOCK_SESSION = {
  user: {
    id: 'helper-user',
    email: 'helper@example.com',
    name: 'Helper User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
};

// ── Imports (after mocks) ──────────────────────────────────────────────────

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/complete`, {
    method: 'POST',
  });
}

function setupTwoSelectChain(row1: unknown | null, row2: unknown | null) {
  // First select: request + user join
  mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(row1 ? [row1] : []),
      }),
    }),
  });
  // Second select: offer
  mockSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(row2 ? [row2] : []),
    }),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/complete', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      });
      // Default FOR UPDATE inside transaction returns status='matched' so the
      // race-recheck passes for happy-path tests. Tests covering the
      // race-loser case override via mockTransaction.mockImplementationOnce.
      const txExecute = vi.fn().mockResolvedValue({ rows: [{ status: 'matched' }] });
      return fn({ update: txUpdate, execute: txExecute });
    });
    // Re-establish fire-and-forget mocks cleared by resetAllMocks
    const notif = (await import('@/lib/it-hilfe/notifications')) as unknown as {
      notifyRequestCompleted: Mock;
    };
    notif.notifyRequestCompleted.mockImplementation(() => undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    const res = await POST(makeRequest('bad-id'), routeParams('bad-id'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupTwoSelectChain(null, null);

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(404);
  });

  it('returns 400 when request status is not matched', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupTwoSelectChain(
      {
        requestId: VALID_UUID,
        requesterId: 'requester-1',
        requesterName: 'Requester',
        requesterEmail: 'req@example.com',
        title: 'Fix laptop',
        status: 'open',
        matchedOfferId: VALID_OFFER_UUID,
      },
      null,
    );

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(400);
  });

  it('returns 403 when user is not the matched helper', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupTwoSelectChain(
      {
        requestId: VALID_UUID,
        requesterId: 'requester-1',
        requesterName: 'Requester',
        requesterEmail: 'req@example.com',
        title: 'Fix laptop',
        status: 'matched',
        matchedOfferId: VALID_OFFER_UUID,
      },
      { id: VALID_OFFER_UUID, helperId: 'different-helper', status: 'accepted' },
    );

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(403);
  });

  it('returns 200 when helper marks request as completed', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupTwoSelectChain(
      {
        requestId: VALID_UUID,
        requesterId: 'requester-1',
        requesterName: 'Requester',
        requesterEmail: 'req@example.com',
        title: 'Fix laptop',
        status: 'matched',
        matchedOfferId: VALID_OFFER_UUID,
      },
      { id: VALID_OFFER_UUID, helperId: 'helper-user', status: 'accepted' },
    );

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('idempotent on double-click: FOR UPDATE re-check sees completed, returns 200 without double-incrementing totalJobsCompleted', async () => {
    // Helper double-clicks "Mark complete". Both reads pass (MATCHED,
    // ACCEPTED, helperId matches). Without the FOR UPDATE re-check, both
    // transactions would run — status UPDATE is idempotent but
    // totalJobsCompleted++ would double-fire. With the re-check, the
    // second click sees status='completed' inside the lock and aborts.
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupTwoSelectChain(
      {
        requestId: VALID_UUID,
        requesterId: 'requester-1',
        requesterName: 'Requester',
        requesterEmail: 'req@example.com',
        title: 'Fix laptop',
        status: 'matched',
        matchedOfferId: VALID_OFFER_UUID,
      },
      { id: VALID_OFFER_UUID, helperId: 'helper-user', status: 'accepted' },
    );

    // Inside the transaction the FOR UPDATE sees status='completed' — a
    // sibling click already won the race.
    const txExecute = vi.fn().mockResolvedValue({ rows: [{ status: 'completed' }] });
    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
      fn({ update: txUpdate, execute: txExecute }),
    );

    const res = await POST(makeRequest(VALID_UUID), routeParams(VALID_UUID));
    expect(res.status).toBe(200); // idempotent — desired end-state already reached
    // Critical: no updates fired (no double-increment of totalJobsCompleted)
    expect(txUpdate).not.toHaveBeenCalled();
  });
});
