/**
 * @vitest-environment node
 *
 * Tests for GET + PUT /api/user/technician-profile
 *
 * GET: Return technician profile + skills for the authenticated user
 * PUT: Upsert profile and replace skills
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

vi.mock('@/lib/api/middleware', async () => ({
  withAuth: (handler: unknown) => (req: Request, context?: { params?: Promise<unknown> }) =>
    mockAuth().then(async (session: unknown) => {
      if (!session || !(session as { user?: { id?: string } }).user?.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const resolvedContext = context?.params ? { params: await context.params } : undefined;
      return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext);
    }),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockInsert2 = vi.fn();
const mockValues2 = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return { where: mockDeleteWhere };
    },
  },
}));

const mockValidateBody = vi.fn();
vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  TechnicianProfileSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}));

vi.mock('@/config/repairer-status', () => ({
  REPAIRER_STATUS: { ACTIVE: 'active' },
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community', PROFESSIONAL: 'professional' },
}));

vi.mock('@/config/it-hilfe', () => ({
  IT_SKILLS: {
    networking: [{ id: 'networking', label: 'Netzwerk' }],
    hardware: [{ id: 'hardware', label: 'Hardware' }],
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    description: 'rp_description',
    hourlyRateCents: 'rp_hourlyRateCents',
    acceptsGratis: 'rp_acceptsGratis',
    acceptsKulturlegi: 'rp_acceptsKulturlegi',
    serviceDeliveryTypes: 'rp_serviceDeliveryTypes',
    postalCode: 'rp_postalCode',
    city: 'rp_city',
    maxTravelKm: 'rp_maxTravelKm',
    isActive: 'rp_isActive',
    profileTier: 'rp_profileTier',
    phone: 'rp_phone',
    address: 'rp_address',
    status: 'rp_status',
  },
  userSkills: {
    userId: 'us_userId',
    skillId: 'us_skillId',
    categoryId: 'us_categoryId',
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

const MOCK_PROFILE_ROW = {
  bio: 'I fix hardware',
  hourlyRateCents: 5000,
  acceptsGratis: false,
  acceptsKulturlegi: true,
  serviceTypes: ['remote'],
  postalCode: '8001',
  city: 'Zürich',
  maxTravelKm: 20,
  isActive: true,
  profileTier: 'community',
};

const MOCK_SKILL_ROW = { skillId: 'networking', categoryId: 'networking' };

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeChain(terminal: 'where' | 'limit', result: unknown[]) {
  const terminalFn = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = terminal === 'where' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.limit = terminal === 'limit' ? terminalFn : vi.fn().mockReturnValue(chain);
  chain.as = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeRequest(method = 'GET', body?: unknown) {
  return new Request('http://localhost/api/user/technician-profile', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { GET, PUT } from '../route';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockDeleteWhere.mockResolvedValue([]);
  mockOnConflictDoUpdate.mockResolvedValue([]);
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
});

describe('GET /api/user/technician-profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it('returns 200 with profile and skills when profile exists', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain('where', [MOCK_PROFILE_ROW]);
      return makeChain('where', [MOCK_SKILL_ROW]);
    });

    const res = await GET(makeRequest() as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profile).not.toBeNull();
    expect(body.data.hasProfile).toBe(true);
    expect(body.data.profile.skills).toContain('networking');
  });

  it('returns 200 with null profile when no profile exists', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain('where', []); // no profile
      return makeChain('where', []); // no skills
    });

    const res = await GET(makeRequest() as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.profile).toBeNull();
    expect(body.data.hasProfile).toBe(false);
  });
});

describe('PUT /api/user/technician-profile', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await PUT(makeRequest('PUT', { bio: 'Hello' }) as never);
    expect(res.status).toBe(401);
  });

  it('returns 400 when validation fails', async () => {
    mockValidateBody.mockReturnValue({
      success: false,
      error: new Response(JSON.stringify({ success: false, error: 'Ungültige Eingabedaten' }), {
        status: 400,
      }),
    });
    const res = await PUT(makeRequest('PUT', {}) as never);
    expect(res.status).toBe(400);
  });

  it('returns 200 with success message after upsert', async () => {
    mockValidateBody.mockReturnValue({
      success: true,
      data: {
        skills: ['networking'],
        bio: 'Updated bio',
        hourlyRateCents: 6000,
        acceptsGratis: true,
        acceptsKulturlegi: false,
        serviceTypes: ['remote', 'in-person'],
        postalCode: '8001',
        city: 'Zürich',
        maxTravelKm: 30,
        isActive: true,
      },
    });

    // After delete, values is called for skill insert
    const mockInsertSkillValues = vi.fn().mockResolvedValue([]);
    mockInsert.mockImplementation(() => undefined);
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    // Second insert (skills)
    let insertCount = 0;
    vi.spyOn((await import('@/db')).db as any, 'insert').mockImplementation(
      (...args: unknown[]) => {
        insertCount++;
        mockInsert(...args);
        if (insertCount === 1) {
          return { values: mockValues };
        }
        return { values: mockInsertSkillValues };
      },
    );

    const res = await PUT(makeRequest('PUT', {}) as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBeTruthy();
  });
});
