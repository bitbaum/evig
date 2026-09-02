/**
 * @vitest-environment node
 *
 * Tests for POST /api/admin/workshops/proposals/[id]/approve
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 400 when action is invalid
 *   - returns 404 when proposal not found
 *   - returns 200 on reject action
 *   - returns 200 on approve action (runs transaction)
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler;
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

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockTransaction = vi.fn();
const mockTxUpdate = vi.fn();
const mockTxSet = vi.fn();
const mockTxUpdateWhere = vi.fn();
const mockTxInsert = vi.fn();
const mockTxValues = vi.fn();
const mockTxReturning = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  workshopProposals: { id: 'wp_id', userId: 'wp_userId', title: 'wp_title', status: 'wp_status' },
  workshops: { id: 'w_id' },
  workshopInstances: { id: 'wi_id' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REQUIRES_CHANGES: 'requires_changes',
  },
}));

vi.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled' },
}));

vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

const MOCK_SESSION = {
  user: {
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
};

const MOCK_PROPOSAL = {
  id: 'prop-1',
  userId: 'u-1',
  title: 'Laptop Repair Workshop',
  description: 'Learn to fix laptops',
  shortDescription: 'Repair workshop',
  category: 'electronics',
  durationMinutes: 120,
  level: 'beginner',
  maxParticipants: 10,
  minParticipants: 3,
  priceCents: 2000,
  prerequisites: null,
  learningObjectives: null,
  targetAudience: null,
  materialsProvided: [],
  materialsRequired: [],
  proposedDate: null,
  proposedTime: null,
  selectedLocationId: null,
  proposedLocation: null,
  proposerName: 'Hans',
  proposerEmail: 'hans@example.com',
};

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/workshops/proposals/prop-1/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'prop-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin });
  mockLeftJoin.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_PROPOSAL]);

  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    const tx = {
      update: (...args: unknown[]) => {
        mockTxUpdate(...args);
        return { set: mockTxSet };
      },
      insert: (...args: unknown[]) => {
        mockTxInsert(...args);
        return { values: mockTxValues };
      },
    };
    mockTxSet.mockReturnValue({ where: mockTxUpdateWhere });
    mockTxUpdateWhere.mockResolvedValue(undefined);
    mockTxValues.mockReturnValue({ returning: mockTxReturning });
    mockTxReturning.mockResolvedValue([{ id: 'w-new' }]);
    return cb(tx);
  });

  mockSendEmail.mockResolvedValue({ success: true });
});

describe('POST /api/admin/workshops/proposals/[id]/approve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest({ action: 'approve' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/workshops/proposals/[id]/approve — validation', () => {
  it('returns 400 when action is invalid', async () => {
    const response = await POST(makeRequest({ action: 'invalid' }), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when proposal not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await POST(makeRequest({ action: 'reject' }), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('POST /api/admin/workshops/proposals/[id]/approve — success', () => {
  it('returns 200 on reject action', async () => {
    const response = await POST(
      makeRequest({ action: 'reject', review_notes: 'Not good enough' }),
      makeContext(),
    );
    expect(response.status).toBe(200);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('returns 200 on approve action', async () => {
    const response = await POST(makeRequest({ action: 'approve' }), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.proposal.status).toBe('approved');
  });

  it('logs resolved {success:false} email failure under (resolved) key for reject — not silently swallowed', async () => {
    // sendEmail RESOLVES with {success:false} on SMTP/Listmonk failure
    // rather than throwing. The bare try/catch the route used to wrap
    // sendEmail in only caught throws — resolved failures slipped
    // through invisibly. Especially critical for reject and
    // require_changes since neither has an in-app notification fallback
    // (only approve fires notifyUsers below), so the proposer would
    // never learn the decision.
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP rejected' });

    const response = await POST(
      makeRequest({ action: 'reject', review_notes: 'Not enough detail' }),
      makeContext(),
    );
    expect(response.status).toBe(200); // The decision still applies; we just log the email failure

    const loggerMod = (await import('@/lib/logger')) as any;
    expect(loggerMod.logger.warn).toHaveBeenCalledWith(
      'Workshop proposal notification email failed (resolved)',
      expect.objectContaining({ action: 'reject', error: 'SMTP rejected' }),
    );
  });
});
