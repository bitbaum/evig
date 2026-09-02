/**
 * @vitest-environment node
 *
 * Tests for DELETE /api/it-hilfe/requests/[id]/offers/[offerId]
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockFrom = vi.fn();
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
  itHilfeOffers: {
    id: 'iho_id',
    requestId: 'iho_requestId',
    helperId: 'iho_helperId',
    status: 'iho_status',
  },
  itHilfeRequests: { id: 'ihr_id', offerCount: 'ihr_offerCount' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_t: unknown) => 'it_hilfe_offers',
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
  OFFER_STATUS: {
    PENDING: 'pending',
    WITHDRAWN: 'withdrawn',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
  },
}));

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
const MOCK_OFFER = {
  helperId: 'user-1',
  status: 'pending',
  requestId: VALID_UUID,
};

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { DELETE } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string, offerId: string) => ({
  params: Promise.resolve({ id, offerId }),
});

function makeRequest(id: string, offerId: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers/${offerId}`, {
    method: 'DELETE',
  });
}

function setupSelectChain(rows: unknown[]) {
  mockWhere.mockResolvedValue(rows);
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DELETE /api/it-hilfe/requests/[id]/offers/[offerId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateWhere.mockResolvedValue(undefined);
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    // Default FOR UPDATE inside transaction returns status='pending' so the
    // race-recheck passes. Tests covering the race-loser branch override
    // via mockTransaction.mockImplementationOnce.
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      });
      const txExecute = vi.fn().mockResolvedValue({ rows: [{ status: 'pending' }] });
      return fn({ update: txUpdate, execute: txExecute });
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    const res = await DELETE(
      makeRequest('bad-id', VALID_OFFER_UUID),
      routeParams('bad-id', VALID_OFFER_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid offerId', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);

    const res = await DELETE(
      makeRequest(VALID_UUID, 'bad-offer-id'),
      routeParams(VALID_UUID, 'bad-offer-id'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when offer not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSelectChain([]);

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when user is not the offer helper', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSelectChain([{ helperId: 'other-user', status: 'pending', requestId: VALID_UUID }]);

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 when offer is not pending', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSelectChain([{ helperId: 'user-1', status: 'accepted', requestId: VALID_UUID }]);

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(400);
  });

  it('returns 200 when offer is successfully withdrawn', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSelectChain([MOCK_OFFER]);

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('idempotent on double-click: FOR UPDATE re-check sees withdrawn, no offerCount decrement fires', async () => {
    // Helper double-clicks "Withdraw". Both pre-reads pass status ===
    // PENDING. Inside the transaction the FOR UPDATE on the offer row
    // sees status='withdrawn' (sibling click already won). The transaction
    // returns false; neither the WITHDRAWN UPDATE nor the offerCount
    // decrement fires. Without this guard, offerCount would drift down
    // in the "X Angebote erhalten" UI on every double-click.
    mockAuth.mockResolvedValue(MOCK_SESSION);
    setupSelectChain([MOCK_OFFER]);

    const txUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    const txExecute = vi.fn().mockResolvedValue({ rows: [{ status: 'withdrawn' }] });
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
      fn({ update: txUpdate, execute: txExecute }),
    );

    const res = await DELETE(
      makeRequest(VALID_UUID, VALID_OFFER_UUID),
      routeParams(VALID_UUID, VALID_OFFER_UUID),
    );
    expect(res.status).toBe(200); // idempotent — desired end-state already reached
    // Critical: neither UPDATE fired inside the transaction
    expect(txUpdate).not.toHaveBeenCalled();
  });
});
