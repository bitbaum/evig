/**
 * @vitest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockExecute = vi.fn();
const mockTransaction = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
  },
}));

vi.mock('@/db/schema/itHilfe', () => ({
  itHilfeRequests: {
    id: 'ihr_id',
    requesterId: 'ihr_requesterId',
    status: 'ihr_status',
    matchedOfferId: 'ihr_matchedOfferId',
  },
  itHilfeOffers: {
    id: 'iho_id',
    requestId: 'iho_requestId',
    helperId: 'iho_helperId',
    status: 'iho_status',
  },
}));

vi.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('@/db/schema/messaging', () => ({
  conversations: { id: 'conv_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_t: unknown) => 'table_name',
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

vi.mock('@/config/database', () => ({
  CONVERSATION_TYPES: { IT_HILFE: 'it_hilfe' },
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

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeOfferAccepted: vi.fn().mockReturnValue({}),
  itHilfeOfferRejected: vi.fn().mockReturnValue({}),
}));

vi.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }));

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
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
const MOCK_REQUEST_ROW = {
  requester_id: 'user-1',
  requester_name: 'Test User',
  status: 'open',
  title: 'Fix laptop',
};
const MOCK_OFFER_ROW = {
  id: VALID_OFFER_UUID,
  helper_id: 'helper-1',
  helper_name: 'Helper',
  helper_email: 'helper@example.com',
  status: 'pending',
};

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string, offerId: string) => ({
  params: Promise.resolve({ id, offerId }),
});

function makeRequest(id: string, offerId: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers/${offerId}/accept`, {
    method: 'POST',
  });
}

function setupSuccessExecute() {
  // Inside the transaction the route now FOR-UPDATEs the request row + reads
  // the offer status (see accept-offer.ts race-fix). Then it does the
  // conversation-check execute. Return rows for the lock+recheck reads,
  // then empty rows for the conversation lookup.
  const txExecute = vi
    .fn()
    .mockResolvedValueOnce({ rows: [{ status: 'open' }] }) // FOR UPDATE request
    .mockResolvedValueOnce({ rows: [{ status: 'pending' }] }) // re-read offer
    .mockResolvedValueOnce({ rows: [] }) // conversation lookup (none exists)
    .mockResolvedValue({ rows: [{ id: 'conv-new' }] }); // conversation INSERT ... RETURNING id
  const txUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  });
  const txInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn({ update: txUpdate, insert: txInsert, execute: txExecute });
  });
  // fire-and-forget rejected helpers notification
  mockExecute
    .mockResolvedValueOnce({ rows: [MOCK_REQUEST_ROW] }) // request query
    .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] }) // offer query
    .mockResolvedValue({ rows: [] }); // subsequent fire-and-forget calls
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockValues.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    const res = await POST(
      makeRequest('bad-id', VALID_OFFER_UUID),
      routeParams('bad-id', VALID_OFFER_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    mockExecute
      .mockResolvedValueOnce({ rows: [] }) // request not found
      .mockResolvedValueOnce({ rows: [] }); // offer result (not reached)

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the requester', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    mockExecute
      .mockResolvedValueOnce({
        rows: [{ requester_id: 'other-user', requester_name: 'Other', status: 'open', title: 'X' }],
      })
      .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] });

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 when request status is not open', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    mockExecute
      .mockResolvedValueOnce({
        rows: [{ requester_id: 'user-1', requester_name: 'Test', status: 'completed', title: 'X' }],
      })
      .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] });

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 when offer is accepted successfully', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSuccessExecute();

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 400 when FOR UPDATE re-check sees the request already matched (race-window guard)', async () => {
    // Outer pre-transaction read sees request OPEN + offer PENDING → passes
    // validation. But by the time the transaction acquires the FOR UPDATE
    // lock on the request row, a concurrent transaction has already
    // accepted a different offer and flipped status to 'matched'. Inner
    // re-check sees status='matched' (not 'open'), aborts cleanly with
    // request_not_open which the route maps to 400.
    mockAuth.mockResolvedValue(MOCK_SESSION);
    mockExecute
      .mockResolvedValueOnce({ rows: [MOCK_REQUEST_ROW] }) // outer pre-read: OPEN
      .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] }); // outer pre-read: offer PENDING

    // Inside the transaction the FOR UPDATE sees the row already MATCHED
    // (sibling transaction won the race).
    const txExecute = vi.fn().mockResolvedValueOnce({ rows: [{ status: 'matched' }] }); // FOR UPDATE: race lost
    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    const txInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) => {
      return fn({ update: txUpdate, insert: txInsert, execute: txExecute });
    });

    const res = await POST(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(400);
    // Updates must NOT have happened — the race-loser aborts cleanly
    // before touching offer/request state.
    expect(txUpdate).not.toHaveBeenCalled();
    expect(txInsert).not.toHaveBeenCalled();
  });
});
