/**
 * @vitest-environment node
 *
 * Tests for GET /api/admin/marketplace/questions
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
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockOffset = vi.fn();
const mockValidateQuery = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  listingQuestions: {
    id: 'q_id',
    question: 'q_question',
    answer: 'q_answer',
    status: 'q_status',
    createdAt: 'q_createdAt',
    answeredAt: 'q_answeredAt',
    listingId: 'q_listingId',
    askerId: 'q_askerId',
  },
  listings: { id: 'l_id', title: 'l_title', sellerId: 'l_sellerId' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}));

vi.mock('@/lib/schemas', () => ({
  validateQuery: (...args: unknown[]) => mockValidateQuery(...args),
  AdminQuestionsQuerySchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    hasMoreItems: (offset: number, limit: number, total: number) => offset + limit < total,
  };
});

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

const MOCK_ROWS = [
  { id: 'q-1', question: 'Ist der Akku noch gut?', status: 'open', listing_title: 'Laptop' },
];

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/marketplace/questions');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockFrom
    .mockReturnValueOnce({ where: mockWhere })
    .mockReturnValueOnce({ innerJoin: mockInnerJoin });
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
  mockWhere.mockResolvedValueOnce([{ count: '1' }]).mockReturnValueOnce({ orderBy: mockOrderBy });
  mockOrderBy.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ offset: mockOffset });
  mockOffset.mockResolvedValue(MOCK_ROWS);
  mockValidateQuery.mockReturnValue({
    success: true,
    data: { status: 'open', limit: 20, offset: 0 },
  });
});

describe('GET /api/admin/marketplace/questions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/marketplace/questions — validation', () => {
  it('returns 400 when query is invalid', async () => {
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Abfrage' }, { status: 400 }),
    });
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/marketplace/questions — authenticated', () => {
  it('returns 200 with items and pagination', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.pagination.total).toBe(1);
  });
});
