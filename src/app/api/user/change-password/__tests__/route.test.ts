/**
 * @vitest-environment node
 *
 * Tests for POST /api/user/change-password
 *
 * Mission-relevant: password change is security-critical. If the current
 * password check is bypassed, or the wrong user's hash is updated, account
 * takeover becomes trivial.
 *
 * Behaviors locked:
 *   POST /api/user/change-password
 *   - returns 401 when not authenticated
 *   - returns 400 when user is not found in DB
 *   - returns 400 when no passwordHash set (OAuth-only account)
 *   - returns 400 when currentPassword is wrong
 *   - returns 400 when newPassword equals currentPassword
 *   - returns 200 on successful password change
 *   - calls db.update only for the authenticated user's id
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = vi.fn();

vi.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
}));

const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockUpdateWhere = vi.fn().mockResolvedValue([]);
const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  users: { id: 'users_id', passwordHash: 'users_passwordHash', updatedAt: 'users_updatedAt' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'NOW()' }), { raw: vi.fn() }),
}));

const mockVerifyPassword = vi.fn();
const mockHashPassword = vi.fn();

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));

vi.mock('@/lib/api/helpers', async () => ({
  apiSuccess: (data: unknown, status = 200) => {
    return NextResponse.json({ success: true, data }, { status });
  },
  apiBadRequest: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    return NextResponse.json({ success: false, error: msg }, { status });
  },
  apiUnauthorized: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  },
}));

const mockPasswordChangeLimiter = vi.fn().mockReturnValue(true);
vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    passwordChange: (id: string) => mockPasswordChangeLimiter(id),
  },
}));

vi.mock('@/lib/schemas', async () => {
  const { z } = (await vi.importActual('zod')) as typeof import('zod');
  const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  });
  return {
    validateBody: (schema: ReturnType<typeof z.object>, body: unknown) => {
      const result = schema.safeParse(body);
      if (!result.success) {
        return {
          success: false as const,
          error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
        };
      }
      return { success: true as const, data: result.data };
    },
    ChangePasswordSchema,
  };
});

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-99',
    email: 'user@example.com',
    name: 'User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
};

const STORED_HASH = '$2b$10$stored-password-hash';
const NEW_HASH = '$2b$10$new-password-hash';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/user/change-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(MOCK_SESSION);
  mockPasswordChangeLimiter.mockReturnValue(true);

  // Default: user found with a password hash
  mockSelectWhere.mockResolvedValue([{ passwordHash: STORED_HASH }]);

  // Default: current password valid, new password different
  mockVerifyPassword
    .mockResolvedValueOnce(true) // currentPassword check
    .mockResolvedValueOnce(false); // same-password guard

  mockHashPassword.mockResolvedValue(NEW_HASH);
});

// ============================================================================
// POST /api/user/change-password
// ============================================================================

describe('POST /api/user/change-password — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST(
      makeRequest({ currentPassword: 'Old123!abc', newPassword: 'New456!xyz' }),
    );
    expect(response.status).toBe(401);
  });
});

describe('POST /api/user/change-password — validation / not found', () => {
  it('returns 400 when user is not found in DB', async () => {
    mockSelectWhere.mockResolvedValueOnce([]);
    const response = await POST(
      makeRequest({ currentPassword: 'Old123!abc', newPassword: 'New456!xyz' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when no passwordHash set (OAuth account)', async () => {
    mockSelectWhere.mockResolvedValueOnce([{ passwordHash: null }]);
    const response = await POST(
      makeRequest({ currentPassword: 'Old123!abc', newPassword: 'New456!xyz' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when currentPassword is incorrect', async () => {
    mockVerifyPassword.mockReset();
    mockVerifyPassword.mockResolvedValueOnce(false); // wrong current password
    const response = await POST(
      makeRequest({ currentPassword: 'WrongPass1', newPassword: 'New456!xyz' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/falsch/i);
  });

  it('returns 400 when newPassword equals currentPassword', async () => {
    mockVerifyPassword.mockReset();
    mockVerifyPassword
      .mockResolvedValueOnce(true) // current password valid
      .mockResolvedValueOnce(true); // same-password guard triggers
    const response = await POST(
      makeRequest({ currentPassword: 'SamePass1!', newPassword: 'SamePass1!' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/unterscheiden/i);
  });

  it('returns 400 on missing fields', async () => {
    const response = await POST(makeRequest({ currentPassword: 'only-one-field' }));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/user/change-password — success', () => {
  it('returns 200 on valid password change', async () => {
    const response = await POST(
      makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }),
    );
    expect(response.status).toBe(200);
  });

  it('returns success: true with message', async () => {
    const response = await POST(
      makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }),
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toMatch(/passwort/i);
  });

  it("updates only the authenticated user's record", async () => {
    await POST(makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }));
    const { eq } = (await import('drizzle-orm')) as any;
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-99');
  });

  it('updates with the newly hashed password', async () => {
    await POST(makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }));
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: NEW_HASH }));
  });
});

describe('POST /api/user/change-password — rate limiting', () => {
  it('returns 400 when the per-user passwordChange limiter rejects', async () => {
    // Attack scenario: session-thief hammers the endpoint with guesses for
    // the user's current password. The limiter must reject BEFORE we read
    // the stored hash or call verifyPassword — otherwise the timing/error
    // channel still leaks information per-attempt.
    mockPasswordChangeLimiter.mockReturnValueOnce(false);
    const response = await POST(
      makeRequest({ currentPassword: 'Guess123!', newPassword: 'NewPass99!' }),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/zu viele/i);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockVerifyPassword).not.toHaveBeenCalled();
  });

  it('keys the limiter by the authenticated user id', async () => {
    await POST(makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }));
    expect(mockPasswordChangeLimiter).toHaveBeenCalledWith('user-99:change-password');
  });
});

describe('POST /api/user/change-password — DB error', () => {
  it('returns 500 when db.select throws', async () => {
    mockSelectWhere.mockRejectedValueOnce(new Error('DB timeout'));
    const response = await POST(
      makeRequest({ currentPassword: 'OldPass1!', newPassword: 'NewPass99!' }),
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
