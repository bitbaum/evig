/**
 * @vitest-environment node
 *
 * Tests for IT-Hilfe offers API routes
 *
 * Covers: GET /api/it-hilfe/requests/[id]/offers (list offers - owner only)
 *         POST /api/it-hilfe/requests/[id]/offers (submit offer)
 *         DELETE /api/it-hilfe/requests/[id]/offers/[offerId] (withdraw offer)
 */

// Mock Drizzle db for the offers route (GET + POST)
const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
};
const mockInsertChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
};
const mockUpdateChain = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([]),
};

// db.transaction mock: the POST route inserts the offer AND bumps offerCount
// inside one transaction, so tx must expose insert + update (and execute for
// the withdraw race-recheck). tx.insert delegates to the shared mockInsertChain
// so individual tests configure the returned offer via
// mockInsertChain.returning.mockResolvedValueOnce(...).
// Individual tests can override via (await import('@/db')).db.transaction.
const mockDbTransaction = vi.fn(async (fn: (tx: unknown) => unknown) => {
  const txUpdate = vi.fn((..._args: unknown[]) => ({
    set: vi.fn((..._args: unknown[]) => ({ where: vi.fn().mockResolvedValue(undefined) })),
  }));
  const txExecute = vi.fn().mockResolvedValue({ rows: [{ status: 'pending' }] });
  return fn({
    insert: vi.fn((..._args: unknown[]) => mockInsertChain),
    update: txUpdate,
    execute: txExecute,
  });
});

vi.mock('@/db', () => ({
  db: {
    select: vi.fn((..._args: unknown[]) => mockSelectChain),
    insert: vi.fn((..._args: unknown[]) => mockInsertChain),
    update: vi.fn((..._args: unknown[]) => mockUpdateChain),
    transaction: (...args: unknown[]) => mockDbTransaction.apply(null, args as never),
  },
}));

// DELETE route also uses Drizzle now (no raw SQL mock needed)

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendCustomEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeNewOfferReceived: vi.fn().mockReturnValue({ subject: '', html: '' }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    offerCreate: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: vi.fn(),
}));

import type { Mock, Mocked, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';

const mockAuth = auth as MockedFunction<typeof auth>;
const mockDb = db as Mocked<typeof db>;

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3001'), init as never);
}

const validRequestId = '11111111-1111-1111-1111-111111111111';
const validOfferId = '22222222-2222-2222-2222-222222222222';

// --- List offers (GET /api/it-hilfe/requests/[id]/offers) ---

describe('GET /api/it-hilfe/requests/[id]/offers', () => {
  let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeAll(async () => {
    const mod = (await import('../../it-hilfe/requests/[id]/offers/route')) as any;
    GET = mod.GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) });

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(401);
  });

  it('returns offers for request owner', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never);

    // First select: check request ownership
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }]);
    // Second select: get offers
    mockSelectChain.orderBy.mockResolvedValueOnce([
      {
        id: validOfferId,
        requestId: validRequestId,
        helperId: 'user-helper',
        helperName: 'Lisa Techniker',
        helperEmail: 'lisa@example.com',
        message: 'Ich kann dir mit dem Laptop helfen, habe viel Erfahrung damit.',
        estimatedTime: '1-2 Stunden',
        proposedCompensation: 'CHF 30',
        relevantSkills: ['hardware_repair'],
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await GET(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`),
      makeCtx(validRequestId),
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.offers).toHaveLength(1);
    expect(body.data.offers[0].helperName).toBe('Lisa Techniker');
    expect(body.data.offers[0].relevantSkills).toEqual(['hardware_repair']);
  });

  it('forbids non-owners from viewing offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }]);

    const res = await GET(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([]);

    const res = await GET(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(404);
  });

  it('normalizes null skills to empty array', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }]);
    mockSelectChain.orderBy.mockResolvedValueOnce([
      {
        id: validOfferId,
        requestId: validRequestId,
        helperId: 'user-helper',
        helperName: 'Lisa Techniker',
        helperEmail: 'lisa@example.com',
        message: 'Hilfe anbieten',
        estimatedTime: null,
        proposedCompensation: null,
        relevantSkills: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await GET(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`),
      makeCtx(validRequestId),
    );
    const body = await res.json();

    expect(body.data.offers[0].relevantSkills).toEqual([]);
  });
});

// --- Submit offer (POST /api/it-hilfe/requests/[id]/offers) ---

describe('POST /api/it-hilfe/requests/[id]/offers', () => {
  let POST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  beforeAll(async () => {
    const mod = (await import('../../it-hilfe/requests/[id]/offers/route')) as any;
    POST = mod.POST;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) });

  const validOfferBody = {
    message: 'Ich kann dir helfen, habe viel Erfahrung mit Laptops.',
    estimatedTime: '1-2 Stunden',
    proposedCompensation: 'CHF 30',
    relevantSkills: [],
  };

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(401);
  });

  it('creates an offer successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);

    // Request exists and is open (with innerJoin to users)
    mockSelectChain.where.mockResolvedValueOnce([
      {
        requesterId: 'user-owner',
        status: 'open',
        title: 'Laptop',
        requester_name: 'Hans',
        requester_email: 'hans@test.ch',
      },
    ]);
    // Not expired
    mockSelectChain.where.mockResolvedValueOnce([]);
    // No existing offer
    mockSelectChain.where.mockResolvedValueOnce([]);
    // Active technician profile — required to offer (only technicians may respond)
    mockSelectChain.where.mockResolvedValueOnce([{ id: 'rp-active' }]);
    // INSERT offer
    mockInsertChain.returning.mockResolvedValueOnce([{ id: validOfferId }]);
    // UPDATE offerCount increment
    mockUpdateChain.where.mockResolvedValueOnce([]);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.offerId).toBe(validOfferId);
  });

  it('prevents offering on own request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner', name: 'Hans', email: 'hans@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([
      {
        requesterId: 'user-owner',
        status: 'open',
        title: 'Laptop',
        requester_name: 'Hans',
        requester_email: 'hans@test.ch',
      },
    ]);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('eigene Anfrage');
  });

  it('prevents duplicate offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where
      .mockResolvedValueOnce([
        {
          requesterId: 'user-owner',
          status: 'open',
          title: 'Laptop',
          requester_name: 'Hans',
          requester_email: 'hans@test.ch',
        },
      ])
      .mockResolvedValueOnce([]) // not expired
      .mockResolvedValueOnce([{ id: 'existing-offer' }]); // existing offer

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('bereits ein Angebot');
  });

  it('rejects offers on closed requests', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([
      {
        requesterId: 'user-owner',
        status: 'matched',
        title: 'Laptop',
        requester_name: 'Hans',
        requester_email: 'hans@test.ch',
      },
    ]);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('keine neuen Angebote');
  });

  it('rejects offers on expired requests', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where
      .mockResolvedValueOnce([
        {
          requesterId: 'user-owner',
          status: 'open',
          title: 'Laptop',
          requester_name: 'Hans',
          requester_email: 'hans@test.ch',
        },
      ])
      .mockResolvedValueOnce([{ id: validRequestId }]); // expired

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('abgelaufen');
  });

  it('rejects message shorter than 20 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where
      .mockResolvedValueOnce([
        {
          requesterId: 'user-owner',
          status: 'open',
          title: 'Laptop',
          requester_name: 'Hans',
          requester_email: 'hans@test.ch',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ ...validOfferBody, message: 'Too short' }),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('20');
  });

  it('rejects empty message', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never);
    mockSelectChain.where
      .mockResolvedValueOnce([
        {
          requesterId: 'user-owner',
          status: 'open',
          title: 'Laptop',
          requester_name: 'Hans',
          requester_email: 'hans@test.ch',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ ...validOfferBody, message: '' }),
      }),
      makeCtx(validRequestId),
    );

    expect(res.status).toBe(400);
  });
});

// --- Withdraw offer (DELETE /api/it-hilfe/requests/[id]/offers/[offerId]) ---
// This route still uses raw SQL, so we test with mockQuery

describe('DELETE /api/it-hilfe/requests/[id]/offers/[offerId]', () => {
  let DELETE: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string; offerId: string }> },
  ) => Promise<Response>;

  beforeAll(async () => {
    const mod = (await import('../../it-hilfe/requests/[id]/offers/[offerId]/route')) as any;
    DELETE = mod.DELETE;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeCtx = (id: string, offerId: string) => ({ params: Promise.resolve({ id, offerId }) });

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, {
        method: 'DELETE',
      }),
      makeCtx(validRequestId, validOfferId),
    );

    expect(res.status).toBe(401);
  });

  it('withdraws a pending offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never);
    // db.select().from().where() — returns offer
    mockSelectChain.where.mockResolvedValueOnce([
      { helperId: 'user-helper', status: 'pending', requestId: validRequestId },
    ]);
    // db.update().set().where() — update offer status (2 calls: offer + request)
    mockUpdateChain.where.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, {
        method: 'DELETE',
      }),
      makeCtx(validRequestId, validOfferId),
    );
    const body = await res.json();

    expect(body.success).toBe(true);
  });

  it('forbids withdrawing another users offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([
      { helperId: 'user-helper', status: 'pending', requestId: validRequestId },
    ]);

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, {
        method: 'DELETE',
      }),
      makeCtx(validRequestId, validOfferId),
    );

    expect(res.status).toBe(403);
  });

  it('prevents withdrawing non-pending offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([
      { helperId: 'user-helper', status: 'accepted', requestId: validRequestId },
    ]);

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, {
        method: 'DELETE',
      }),
      makeCtx(validRequestId, validOfferId),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('ausstehende');
  });

  it('returns 404 for non-existent offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never);
    mockSelectChain.where.mockResolvedValueOnce([]);

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, {
        method: 'DELETE',
      }),
      makeCtx(validRequestId, validOfferId),
    );

    expect(res.status).toBe(404);
  });

  it('rejects invalid UUID format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never);

    const res = await DELETE(
      makeRequest('/api/it-hilfe/requests/bad-id/offers/bad-offer', { method: 'DELETE' }),
      makeCtx('bad-id', 'bad-offer'),
    );

    expect(res.status).toBe(400);
  });
});
