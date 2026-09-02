/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/refunds
 *
 * Behaviors locked:
 *   GET - 401, 200 (with pagination)
 */

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler;
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session);
      });
  },
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();

// alias called at module init
vi.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}));

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  refunds: {
    id: 'r_id',
    status: 'r_status',
    refundNumber: 'r_refundNumber',
    originalTransactionId: 'r_originalTransactionId',
    amountCents: 'r_amountCents',
    currency: 'r_currency',
    reason: 'r_reason',
    reasonDetails: 'r_reasonDetails',
    requestedBy: 'r_requestedBy',
    approvedBy: 'r_approvedBy',
    processedBy: 'r_processedBy',
    customerNotes: 'r_customerNotes',
    internalNotes: 'r_internalNotes',
    createdAt: 'r_createdAt',
    approvedAt: 'r_approvedAt',
    processedAt: 'r_processedAt',
  },
  paymentTransactions: { id: 'pt_id', amountCents: 'pt_amountCents', currency: 'pt_currency' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: vi.fn().mockReturnValue({ limit: 20, offset: 0 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';

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

const MOCK_REFUND = {
  id: 'ref-1',
  refundNumber: 'R-001',
  status: 'requested',
  amountCents: 5000,
  currency: 'CHF',
};

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/refunds', { method: 'GET' });
}

beforeEach(async () => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  const helpers = (await import('@/lib/api/helpers')) as any;
  helpers.parsePagination.mockReturnValue({ limit: 20, offset: 0 });

  // Two parallel queries: refunds list + count
  // refunds: from → innerJoin(users) → innerJoin(pt) → leftJoin(approvedBy) → leftJoin(requestedBy) → where → orderBy → limit → offset
  // count: from → where → terminal
  mockFrom
    .mockReturnValueOnce({ innerJoin: mockInnerJoin }) // refunds list
    .mockReturnValueOnce({ where: mockWhere }); // count
  mockInnerJoin.mockReturnValue({
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    where: mockWhere,
  });
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockWhere
    .mockReturnValueOnce({ orderBy: mockOrderBy }) // refunds list
    .mockResolvedValueOnce([{ total: 1 }]); // count
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ offset: mockOffset });
  mockOffset.mockResolvedValue([MOCK_REFUND]);
});

describe('GET /api/admin/refunds — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/refunds — authenticated', () => {
  it('returns 200 with refunds list and pagination', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.refunds).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });
});
