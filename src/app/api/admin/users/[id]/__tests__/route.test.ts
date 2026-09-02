/**
 * @vitest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/users/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 404 when user not found
 *   - returns 200 with user details
 *
 *   PATCH /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 400 when body is invalid
 *   - returns 404 when user not found
 *   - returns 400 when no fields to update
 *   - returns 200 on success
 *
 *   DELETE /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 404 when user not found
 *   - returns 403 when trying to delete a super admin
 *   - returns 400 when trying to delete self
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
const mockLeftJoin = vi.fn();
const mockWhere = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockUpdateWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflictDoUpdate = vi.fn();
const mockDelete = vi.fn();
const mockDeleteWhere = vi.fn();
const mockTransaction = vi.fn();
const mockValidateBody = vi.fn();
const mockIsSuperAdmin = vi.fn();

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
    delete: (...args: unknown[]) => {
      mockDelete(...args);
      return { where: mockDeleteWhere };
    },
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  users: {
    id: 'u_id',
    name: 'u_name',
    email: 'u_email',
    isStaff: 'u_isStaff',
    isSuperAdmin: 'u_isSuperAdmin',
    staffPermissions: 'u_staffPerms',
    createdAt: 'u_createdAt',
    emailVerified: 'u_emailVerified',
  },
  userProfiles: { userId: 'up_userId', phone: 'up_phone', addressLine1: 'up_address' },
  sessions: { userId: 'sess_userId' },
  accounts: { userId: 'acc_userId' },
  authAuditLog: { id: 'authAuditLog' },
}));

vi.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  // audit.ts calls getTableName on module load to build raw SQL fragments —
  // any non-empty stable string keeps the import side-effect free in tests.
  getTableName: () => 'auth_audit_log',
  sql: { raw: (s: unknown) => s },
}));

vi.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin(...args),
  SUPER_ADMIN_EMAILS: ['protected@revamp-it.ch'],
}));

vi.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  AdminUpdateUserSchema: {},
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
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
import { GET, PATCH, DELETE } from '../route';

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

const MOCK_USER = { id: 'user-1', name: 'Hans', email: 'hans@example.com', is_staff: false };

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/users/user-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeContext(id = 'user-1') {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockIsSuperAdmin.mockReturnValue(true);

  // GET uses leftJoin; PATCH/DELETE use direct where on users
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere });
  mockLeftJoin.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue([MOCK_USER]);

  mockSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdateWhere.mockResolvedValue(undefined);

  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
  mockOnConflictDoUpdate.mockResolvedValue(undefined);

  mockDeleteWhere.mockResolvedValue(undefined);

  // Default transaction stub: invokes the callback with a tx object that
  // exposes tx.delete(...).where(...) returning undefined for all three
  // delete chains (sessions, accounts, users).
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const txDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    return fn({ delete: txDelete });
  });

  mockValidateBody.mockReturnValue({ success: true, data: { name: 'New Name' } });
});

// ============================================================================
// GET /api/admin/users/[id]
// ============================================================================

describe('GET /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(403);
  });
});

describe('GET /api/admin/users/[id] — authenticated', () => {
  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 200 with user details', async () => {
    const response = await GET(makeRequest(), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.user.id).toBe('user-1');
  });
});

// ============================================================================
// PATCH /api/admin/users/[id]
// ============================================================================

describe('PATCH /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false);
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext());
    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/admin/users/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten' },
        { status: 400 },
      ),
    });
    const response = await PATCH(makeRequest('PATCH', {}), makeContext());
    expect(response.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 400 when no fields to update', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} });
    const response = await PATCH(makeRequest('PATCH', {}), makeContext());
    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/admin/users/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makeRequest('PATCH', { name: 'New Name' }), makeContext());
    expect(response.status).toBe(200);
  });
});

// ============================================================================
// DELETE /api/admin/users/[id]
// ============================================================================

describe('DELETE /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/admin/users/[id] — guards', () => {
  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(404);
  });

  it('returns 403 when trying to delete a protected super admin', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_USER, email: 'protected@revamp-it.ch' }]);
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(403);
  });

  it('returns 400 when trying to delete self', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_USER, id: 'admin-1' }]);
    const response = await DELETE(makeRequest('DELETE'), makeContext('admin-1'));
    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/admin/users/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.message).toContain('hans@example.com');
  });

  it('wraps sessions + accounts + users deletes in a single transaction so partial failures roll back', async () => {
    // Previously the route ran:
    //   await Promise.all([db.delete(sessions), db.delete(accounts)])
    //   await db.delete(users)
    // …three auto-commit statements. If the users delete failed (FK
    // reference from listings/orders/etc that wasn't cascaded), sessions
    // and accounts were ALREADY committed, leaving a zombie user that
    // can't authenticate but still exists. Regression: assert all three
    // deletes happen inside one db.transaction() callback so a partial
    // failure aborts the whole operation.
    const txDelete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ delete: txDelete }),
    );

    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(200);
    // db.transaction called exactly once with the whole batch
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // All three deletes go through tx.delete (NOT db.delete), so the
    // statements share one transaction context.
    expect(txDelete).toHaveBeenCalledTimes(3);
    // Top-level mockDelete must not be used during DELETE (only the
    // transactional tx.delete path is allowed).
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('rolls back the response to 500 when the transaction throws partway through', async () => {
    // Simulate: sessions delete OK, accounts delete OK, users delete throws.
    // The transaction must reject — postgres will roll back the prior two —
    // and the route's outer catch surfaces a 500 to the admin caller.
    mockTransaction.mockImplementationOnce(async () => {
      throw new Error('FK constraint violation on users delete');
    });

    const response = await DELETE(makeRequest('DELETE'), makeContext());
    expect(response.status).toBe(500);
  });
});
