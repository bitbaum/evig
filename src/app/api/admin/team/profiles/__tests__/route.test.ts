/**
 * @vitest-environment node
 *
 * Tests for GET/POST /api/admin/team/profiles
 *
 * Behaviors locked:
 *   GET /api/admin/team/profiles
 *   - returns 401 when not authenticated
 *   - returns 400 when filter is invalid
 *   - returns 200 with profiles (hr_notes stripped for non-super-admins)
 *
 *   POST /api/admin/team/profiles
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when user not found
 *   - returns 400 when profile already exists
 *   - returns 201 on success
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
const mockLimit = vi.fn();
const mockOrderBy = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockSafeParse = vi.fn();
const mockValidateCreateTeamProfile = vi.fn();
const mockIsSuperAdmin = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return { from: mockFrom };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  teamProfiles: {
    id: 'tp_id',
    userId: 'tp_userId',
    position: 'tp_position',
    department: 'tp_department',
    employmentType: 'tp_employmentType',
    startDate: 'tp_startDate',
    contractHours: 'tp_contractHours',
    skills: 'tp_skills',
    interests: 'tp_interests',
    goals: 'tp_goals',
    strengths: 'tp_strengths',
    developmentAreas: 'tp_developmentAreas',
    availability: 'tp_availability',
    workingHours: 'tp_workingHours',
    preferredContact: 'tp_preferredContact',
    phone: 'tp_phone',
    emergencyContactName: 'tp_ecName',
    emergencyContactPhone: 'tp_ecPhone',
    emergencyContactRelation: 'tp_ecRel',
    hrNotes: 'tp_hrNotes',
    isActive: 'tp_isActive',
    createdAt: 'tp_createdAt',
    updatedAt: 'tp_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  ilike: (col: unknown, pattern: string) => ({ __ilike: [col, pattern] }),
  asc: (col: unknown) => ({ __asc: col }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin(...args),
}));

vi.mock('@/lib/schemas/team', () => ({
  teamProfileFilterSchema: { safeParse: (...args: unknown[]) => mockSafeParse(...args) },
  validateCreateTeamProfile: (...args: unknown[]) => mockValidateCreateTeamProfile(...args),
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
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
import { GET, POST } from '../route';

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
  id: 'prof-1',
  user_id: 'u-1',
  user_name: 'Hans',
  user_email: 'hans@example.com',
  position: 'Developer',
  department: 'tech',
  employment_type: 'fulltime',
  start_date: '2024-01-01',
  hr_notes: 'confidential',
  is_active: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const VALID_POST_BODY = { user_id: 'u-1', position: 'Developer', is_active: true };

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/team/profiles', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockIsSuperAdmin.mockReturnValue(true);

  mockSafeParse.mockReturnValue({ success: true, data: { is_active: 'all' } });
  mockValidateCreateTeamProfile.mockReturnValue({ success: true, data: VALID_POST_BODY });

  // GET list chain: from → innerJoin → where → orderBy
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere });
  mockInnerJoin.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  mockOrderBy.mockResolvedValue([MOCK_ROW]);

  // POST insert chain
  mockValues.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ id: 'prof-new' }]);
});

// ============================================================================
// GET /api/admin/team/profiles
// ============================================================================

describe('GET /api/admin/team/profiles — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/team/profiles — validation', () => {
  it('returns 400 when filter is invalid', async () => {
    mockSafeParse.mockReturnValueOnce({ success: false, error: { errors: [] } });
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
  });
});

describe('GET /api/admin/team/profiles — authenticated', () => {
  it('returns 200 with profiles including hr_notes for super admins', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].hr_notes).toBe('confidential');
  });

  it('strips hr_notes for non-super-admins', async () => {
    mockIsSuperAdmin.mockReturnValue(false);
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data[0].hr_notes).toBeUndefined();
  });
});

// ============================================================================
// POST /api/admin/team/profiles
// ============================================================================

describe('POST /api/admin/team/profiles — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(makeRequest('POST', VALID_POST_BODY));
    expect(response.status).toBe(401);
  });
});

describe('POST /api/admin/team/profiles — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateCreateTeamProfile.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    });
    const response = await POST(makeRequest('POST', {}));
    expect(response.status).toBe(400);
  });

  it('returns 400 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([]); // user lookup: empty
    const response = await POST(makeRequest('POST', VALID_POST_BODY));
    expect(response.status).toBe(400);
  });

  it('returns 400 when profile already exists', async () => {
    mockWhere
      .mockResolvedValueOnce([{ id: 'u-1' }]) // user lookup: found (awaited directly)
      .mockReturnValueOnce({ limit: mockLimit }); // profile check: select().from().where().limit(1)
    mockLimit.mockResolvedValueOnce([{ id: 'prof-existing' }]); // profile exists
    const response = await POST(makeRequest('POST', VALID_POST_BODY));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/team/profiles — success', () => {
  it('returns 201 on success', async () => {
    mockWhere
      .mockResolvedValueOnce([{ id: 'u-1' }]) // user lookup: found (awaited directly)
      .mockReturnValueOnce({ limit: mockLimit }); // profile check: select().from().where().limit(1)
    mockLimit.mockResolvedValueOnce([]); // no existing profile
    const response = await POST(makeRequest('POST', VALID_POST_BODY));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.id).toBe('prof-new');
  });
});
