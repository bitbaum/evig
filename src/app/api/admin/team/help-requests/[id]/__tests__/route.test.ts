/**
 * @vitest-environment node
 *
 * Tests for GET/PUT /api/admin/team/help-requests/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/team/help-requests/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found
 *   - returns 200 with request
 *
 *   PUT /api/admin/team/help-requests/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no fields to update
 *   - returns 404 when not found
 *   - returns 200 on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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
const mockInnerJoin = vi.fn();
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockValidateUpdateHelpRequest = vi.fn();

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
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: mockSet };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  helpRequests: {
    id: 'hr_id',
    requesterId: 'hr_requesterId',
    title: 'hr_title',
    description: 'hr_description',
    category: 'hr_category',
    urgency: 'hr_urgency',
    requestedUserId: 'hr_requestedUserId',
    isBroadcast: 'hr_isBroadcast',
    status: 'hr_status',
    resolvedBy: 'hr_resolvedBy',
    resolvedAt: 'hr_resolvedAt',
    resolutionNotes: 'hr_resolutionNotes',
    createdAt: 'hr_createdAt',
    updatedAt: 'hr_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/lib/schemas/activity', () => ({
  validateUpdateHelpRequest: (...args: unknown[]) => mockValidateUpdateHelpRequest(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

const MOCK_ROW = {
  id: 'hr-1',
  requester_id: 'u-1',
  requester_name: 'Hans',
  requester_email: 'hans@example.com',
  title: 'Need help',
  description: null,
  category: null,
  urgency: 'normal',
  requested_user_id: null,
  requested_user_name: null,
  requested_user_email: null,
  is_broadcast: true,
  status: 'open',
  resolved_by: null,
  resolved_by_name: null,
  resolved_at: null,
  resolution_notes: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/team/help-requests/hr-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(id = 'hr-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  // GET/PUT existence chain: from → innerJoin/leftJoin → where
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_ROW]);

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  mockValidateUpdateHelpRequest.mockReturnValue({ success: true, data: { urgency: 'high' } });
});

// ============================================================================
// GET /api/admin/team/help-requests/[id]
// ============================================================================

describe('GET /api/admin/team/help-requests/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/team/help-requests/[id] — authenticated', () => {
  it('returns 404 when not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 with request', async () => {
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe('hr-1');
  });
});

// ============================================================================
// PUT /api/admin/team/help-requests/[id]
// ============================================================================

describe('PUT /api/admin/team/help-requests/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PUT(makeRequest('PUT', { urgency: 'high' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PUT /api/admin/team/help-requests/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateUpdateHelpRequest.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    });
    const response = await PUT(makeRequest('PUT', {}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 400 when no fields to update', async () => {
    mockValidateUpdateHelpRequest.mockReturnValueOnce({ success: true, data: {} });
    const response = await PUT(makeRequest('PUT', {}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await PUT(makeRequest('PUT', { urgency: 'high' }), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/admin/team/help-requests/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest('PUT', { urgency: 'high' }), makeContext());
    expect(response.status).toBe(200);
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1);
  });
});
