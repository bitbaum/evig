/**
 * @vitest-environment node
 *
 * Tests for GET/POST /api/it-hilfe/requests
 *
 * Mission-relevant: GET is the public browse endpoint (window-function total,
 * pagination); POST is the authenticated creation endpoint with rate limiting
 * and validation guards.
 *
 * Behaviors locked:
 *   GET /api/it-hilfe/requests
 *   - returns 200 with requests array
 *   - extracts total from _total_count window function
 *   - returns total 0 and empty array when no rows
 *   - includes pagination metadata
 *   - returns 500 when DB throws
 *
 *   POST /api/it-hilfe/requests
 *   - returns 401 when not authenticated
 *   - returns 429 when rate limited
 *   - returns 400 when validation fails
 *   - returns 201 with requestId on success
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

// withAuth no longer wraps POST (the route now resolves session manually
// to allow anonymous submissions). Mock left out — the route imports
// auth() from '@/auth' directly, which is already mocked above.

const mockDbExecute = vi.fn();
const mockInsert = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertReturning = vi.fn();

vi.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockInsertValues };
    },
  },
}));

vi.mock('@/db/schema/itHilfe', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status' },
}));

vi.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'sql' }), {
    raw: vi.fn(),
    join: vi.fn(),
  }),
  getTableName: vi.fn().mockReturnValue('mock_table'),
}));

const mockItHilfeCreateLimiter = vi.fn();
const mockGetClientIdentifier = vi.fn().mockReturnValue('127.0.0.1');

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    itHilfeCreate: (...args: unknown[]) => mockItHilfeCreateLimiter(...args),
  },
  getClientIdentifier: (...args: unknown[]) => mockGetClientIdentifier(...args),
}));

const mockFindOrCreateAnonymousUser = vi.fn();
vi.mock('@/lib/it-hilfe/find-or-create-anonymous-user', () => ({
  findOrCreateAnonymousUser: (...args: unknown[]) => mockFindOrCreateAnonymousUser(...args),
}));

const mockCreatePasswordResetToken = vi.fn();
vi.mock('@/lib/auth/db-verification', () => ({
  createPasswordResetToken: (...args: unknown[]) => mockCreatePasswordResetToken(...args),
}));

const mockSendCustomEmail = vi.fn();
vi.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail(...args),
}));

vi.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeAnonymousRequestClaim: vi.fn().mockReturnValue({ subject: 's', html: 'h', text: 't' }),
}));

vi.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }));

vi.mock('@/lib/security/sanitize', () => ({
  sanitizeInput: (input: string) => input,
}));

vi.mock('@/config/it-hilfe', () => ({
  getCategoryIds: vi.fn().mockReturnValue(['hardware', 'software', 'network', 'other']),
  getSkillIds: vi.fn().mockReturnValue(['wifi', 'linux', 'windows']),
  URGENCY_LEVELS: [{ id: 'low' }, { id: 'normal' }, { id: 'high' }],
  URGENCY_DEFAULT: 'normal',
  SERVICE_TYPES: [{ id: 'remote' }, { id: 'onsite' }, { id: 'flexible' }],
  SERVICE_TYPE_DEFAULT: 'flexible',
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  deriveBudgetType: vi.fn().mockReturnValue('free'),
  // Mirror SSOT constants added in MMM.1 — the route imports these
  // for anonymous-user claim emails and list pagination respectively.
  // Without them the route gets `undefined` and downstream calls receive
  // wrong args (claim-token TTL became `undefined`, etc.).
  CLAIM_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  IT_HILFE_PAGINATION: { defaultLimit: 20, maxLimit: 50 },
}));

vi.mock('@/lib/schemas/it-hilfe', () => ({
  itHilfeRequestSchema: {},
  validateAndRespond: vi.fn().mockReturnValue({
    success: true,
    data: {
      title: 'Laptop geht nicht',
      description: 'Laptop startet nicht mehr',
      categoryId: 'hardware',
      urgency: 'normal',
      serviceType: 'flexible',
      skillsNeeded: [],
    },
  }),
}));

vi.mock('@/lib/it-hilfe/request-mapper', () => ({
  mapRequestListRow: (row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    status: row.status,
  }),
}));

vi.mock('@/lib/it-hilfe/notifications', () => ({
  sendRequestCreatedNotifications: vi.fn(),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    parsePagination: vi.fn().mockReturnValue({ limit: 20, offset: 0, page: 1 }),

    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  };
});

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

function makeRow(id: string, total = 3) {
  return {
    _total_count: total,
    id,
    title: 'Laptop geht nicht',
    requester_id: 'user-1',
    requester_name: 'Hans',
    status: 'open',
    category_id: 'hardware',
    urgency: 'normal',
    budget_type: 'free',
    budget_amount_cents: null,
    service_type: 'flexible',
    city: 'Zürich',
    canton: 'ZH',
    expires_at: '2027-01-01',
    created_at: '2026-05-01',
  };
}

const MOCK_ROWS = [makeRow('req-1'), makeRow('req-2'), makeRow('req-3')];

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/it-hilfe/requests');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/it-hilfe/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Laptop geht nicht', ...body }),
  });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockDbExecute.mockResolvedValue({ rows: MOCK_ROWS });
  mockItHilfeCreateLimiter.mockReturnValue(true);
  mockGetClientIdentifier.mockReturnValue('127.0.0.1');
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning });
  mockInsertReturning.mockResolvedValue([{ id: 'req-new' }]);
  mockFindOrCreateAnonymousUser.mockResolvedValue({ userId: 'anon-user-1', wasCreated: true });
  mockCreatePasswordResetToken.mockResolvedValue('reset-token-abc');
  mockSendCustomEmail.mockResolvedValue(undefined);
  // vi.resetAllMocks() wipes return values on vi.fn() defined inside
  // vi.mock() factories — re-set the template mock so it doesn't return
  // undefined into sendCustomEmail.
  const templates = (await import('@/lib/email/templates/it-hilfe')) as any;
  templates.itHilfeAnonymousRequestClaim.mockReturnValue({ subject: 's', html: 'h', text: 't' });

  const helpers = (await import('@/lib/api/helpers')) as any;
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0, page: 1 });

  const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
  schemas.validateAndRespond.mockReturnValue({
    success: true,
    data: {
      title: 'Laptop geht nicht',
      description: 'Laptop startet nicht mehr',
      categoryId: 'hardware',
      urgency: 'normal',
      serviceType: 'flexible',
      skillsNeeded: [],
    },
  });

  const itHilfe = (await import('@/config/it-hilfe')) as any;
  itHilfe.deriveBudgetType.mockReturnValue('free');
});

// ============================================================================
// GET /api/it-hilfe/requests
// ============================================================================

describe('GET /api/it-hilfe/requests — success', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
  });

  it('returns requests array', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data.requests).toHaveLength(3);
  });

  it('extracts total from _total_count window function', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data.total).toBe(3);
  });

  it('returns total 0 and empty array when no rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] });
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data.requests).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it('includes pagination metadata', async () => {
    const response = await GET(makeGetRequest());
    const body = await response.json();
    expect(body.data.pagination).toBeDefined();
    expect(typeof body.data.pagination.limit).toBe('number');
    expect(typeof body.data.pagination.offset).toBe('number');
    expect(typeof body.data.pagination.hasMore).toBe('boolean');
  });

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'));
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(500);
  });
});

// ============================================================================
// POST /api/it-hilfe/requests
// ============================================================================

describe('POST /api/it-hilfe/requests — anonymous submissions', () => {
  // Anonymous-post is the conversion-driver T1 from the roadmap: a logged-out
  // visitor must be able to submit a request by supplying just their email.

  it('returns 400 when session is null AND no submitterEmail provided', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makePostRequest());
    expect(response.status).toBe(400);
    expect(mockInsertReturning).not.toHaveBeenCalled();
  });

  it('returns 201 when session is null AND submitterEmail is provided', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        description: 'Laptop startet nicht mehr',
        categoryId: 'hardware',
        urgency: 'normal',
        serviceType: 'flexible',
        skillsNeeded: [],
        submitterEmail: 'anon@example.com',
      },
    });

    const response = await POST(makePostRequest({ submitterEmail: 'anon@example.com' }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.newAccount).toBe(true);

    // findOrCreateAnonymousUser was called with the email
    expect(mockFindOrCreateAnonymousUser).toHaveBeenCalledWith('anon@example.com');
    // The request was inserted with the resolved anonymous userId
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ requesterId: 'anon-user-1' }),
    );
  });

  it('sends the claim email when wasCreated is true (new anonymous account)', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({ userId: 'new-anon-1', wasCreated: true });
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        submitterEmail: 'newuser@example.com',
      },
    });

    await POST(makePostRequest({ submitterEmail: 'newuser@example.com' }));

    // Allow the fire-and-forget chain a tick to complete
    await new Promise((resolve) => setImmediate(resolve));

    // 7-day TTL — claim links shouldn't expire while users are still
    // reading their email backlog.
    expect(mockCreatePasswordResetToken).toHaveBeenCalledWith(
      'newuser@example.com',
      7 * 24 * 60 * 60 * 1000,
    );
    expect(mockSendCustomEmail).toHaveBeenCalledWith('newuser@example.com', expect.any(Object));

    // The claim URL must include callbackUrl pointing to the just-created
    // request, so the user lands on it after setting a password + signing in.
    // (Without this, the post-claim UX dumps users on the default page and
    // they have to navigate to /it-hilfe/my themselves.)
    const templates = (await import('@/lib/email/templates/it-hilfe')) as any;
    const claimArgs = templates.itHilfeAnonymousRequestClaim.mock.calls[0];
    const claimUrl = claimArgs[1] as string;
    expect(claimUrl).toContain('callbackUrl=');
    expect(claimUrl).toContain(encodeURIComponent('/it-hilfe/req-new'));
    expect(claimUrl).toContain('token=');

    // The standard request-confirmation email must be SUPPRESSED for new
    // anonymous accounts (the claim email replaces it). Two emails to the
    // same person would confuse and the standard one's "view your request"
    // link wouldn't work until they've claimed.
    const notifMod = (await import('@/lib/it-hilfe/notifications')) as any;
    const notifArgs = notifMod.sendRequestCreatedNotifications.mock.calls[0][0];
    expect(notifArgs.includeRequesterConfirmation).toBe(false);
  });

  it('keeps requester confirmation enabled when wasCreated is false (existing account)', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({
      userId: 'existing-2',
      wasCreated: false,
    });
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: { title: 'X', submitterEmail: 'known@example.com' },
    });

    await POST(makePostRequest({ submitterEmail: 'known@example.com' }));
    await new Promise((resolve) => setImmediate(resolve));

    const notifMod = (await import('@/lib/it-hilfe/notifications')) as any;
    const notifArgs = notifMod.sendRequestCreatedNotifications.mock.calls[0][0];
    // Existing user: they have a password, the standard confirmation email's
    // link works for them — DON'T suppress it.
    expect(notifArgs.includeRequesterConfirmation).toBe(true);
  });

  it('logs resolved {success:false} claim email failure under (resolved) key — admin-detectable, not silently swallowed', async () => {
    // sendCustomEmail RESOLVES with {success:false} on SMTP/Listmonk
    // failure rather than throwing. Without splitting the fire-and-forget
    // chain into .then(check)+.catch, that resolved-failure is invisible
    // in the logs — the silent-failure-with-DB-state-already-mutated mode
    // (new anon account exists in users table; password-bearing claim
    // email never arrived; user locked out).
    mockAuth.mockResolvedValueOnce(null);
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({ userId: 'new-anon-2', wasCreated: true });
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: { title: 'Laptop geht nicht', submitterEmail: 'newuser2@example.com' },
    });
    mockSendCustomEmail.mockResolvedValueOnce({ success: false, error: 'SMTP rejected' });

    await POST(makePostRequest({ submitterEmail: 'newuser2@example.com' }));
    await new Promise((resolve) => setImmediate(resolve));

    const loggerMod = (await import('@/lib/logger')) as any;
    expect(loggerMod.logger.warn).toHaveBeenCalledWith(
      'Anonymous-request claim email failed (resolved)',
      expect.objectContaining({ error: 'SMTP rejected', email: 'newuser2@example.com' }),
    );
  });

  it('does NOT send the claim email when wasCreated is false (existing account)', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockFindOrCreateAnonymousUser.mockResolvedValueOnce({
      userId: 'existing-1',
      wasCreated: false,
    });
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: {
        title: 'Laptop geht nicht',
        submitterEmail: 'existing@example.com',
      },
    });

    await POST(makePostRequest({ submitterEmail: 'existing@example.com' }));
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockCreatePasswordResetToken).not.toHaveBeenCalled();
    expect(mockSendCustomEmail).not.toHaveBeenCalled();
  });

  it('uses client IP for rate limiting key when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockGetClientIdentifier.mockReturnValueOnce('203.0.113.1');
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: true,
      data: { title: 'X', submitterEmail: 'foo@bar.com' },
    });

    await POST(makePostRequest({ submitterEmail: 'foo@bar.com' }));

    // First arg to itHilfeCreate is the rate-limit key
    const callKey = mockItHilfeCreateLimiter.mock.calls[0][0] as string;
    expect(callKey).toContain('203.0.113.1');
    expect(callKey).toContain('anon');
  });
});

describe('POST /api/it-hilfe/requests — rate limiting', () => {
  it('returns 400 when rate limited', async () => {
    mockItHilfeCreateLimiter.mockReturnValueOnce(false);
    const response = await POST(makePostRequest());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/it-hilfe/requests — validation', () => {
  it('returns 400 when validation fails', async () => {
    const schemas = (await import('@/lib/schemas/it-hilfe')) as any;
    schemas.validateAndRespond.mockReturnValueOnce({
      success: false,
      errors: ['title: Titel erforderlich'],
    });
    const response = await POST(makePostRequest());
    expect(response.status).toBe(400);
  });
});

describe('POST /api/it-hilfe/requests — success', () => {
  it('returns 201 with requestId', async () => {
    const response = await POST(makePostRequest());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.requestId).toBe('req-new');
  });

  it('returns 500 when DB throws', async () => {
    mockInsertReturning.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(makePostRequest());
    expect(response.status).toBe(500);
  });
});
