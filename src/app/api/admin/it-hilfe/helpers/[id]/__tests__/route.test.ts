/**
 * @vitest-environment node
 *
 * Tests for PATCH /api/admin/it-hilfe/helpers/[id]
 *
 * Behaviors locked:
 *   PATCH /api/admin/it-hilfe/helpers/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when helper not found
 *   - returns 200 on verify action
 *   - returns 200 on suspend action
 *   - returns 200 on reactivate action
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
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockReturning = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockValidateBody = vi.fn();

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
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return { values: mockValues };
    },
  },
}));

vi.mock('@/db/schema', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    isVerified: 'rp_isVerified',
    verificationDate: 'rp_verificationDate',
    status: 'rp_status',
    isActive: 'rp_isActive',
    updatedAt: 'rp_updatedAt',
  },
  userProfiles: {
    userId: 'up_userId',
    isVerified: 'up_isVerified',
    verificationDate: 'up_verificationDate',
    updatedAt: 'up_updatedAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    HELPER_NOT_FOUND: 'Helfer nicht gefunden',
  },
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
}));

vi.mock('@/lib/schemas/it-hilfe', () => ({
  AdminHelperActionSchema: {},
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
import { PATCH } from '../route';

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

const MOCK_HELPER = { id: 'hp-1', userId: 'user-1', isVerified: false, isActive: true };

function makeRequest(body: Record<string, unknown> = { action: 'verify' }) {
  return new NextRequest('http://localhost/api/admin/it-hilfe/helpers/hp-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeContext(id = 'hp-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);

  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_HELPER]);

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockReturnValue({ returning: mockReturning });
  mockReturning.mockResolvedValue([{ ...MOCK_HELPER, isVerified: true }]);

  // verify upserts the person's is_verified into user_profiles
  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockOnConflictDoUpdate.mockResolvedValue(undefined);

  mockValidateBody.mockReturnValue({ success: true, data: { action: 'verify' } });
});

// ============================================================================
// PATCH /api/admin/it-hilfe/helpers/[id]
// ============================================================================

describe('PATCH /api/admin/it-hilfe/helpers/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/admin/it-hilfe/helpers/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await PATCH(makeRequest({}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when helper not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await PATCH(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/admin/it-hilfe/helpers/[id] — success', () => {
  it('returns 200 on verify action', async () => {
    const response = await PATCH(makeRequest({ action: 'verify' }), makeContext());
    expect(response.status).toBe(200);
  });

  it('returns 200 on suspend action', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { action: 'suspend' } });
    const response = await PATCH(makeRequest({ action: 'suspend' }), makeContext());
    expect(response.status).toBe(200);
  });

  it('returns 200 on reactivate action', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { action: 'reactivate' } });
    const response = await PATCH(makeRequest({ action: 'reactivate' }), makeContext());
    expect(response.status).toBe(200);
  });
});
