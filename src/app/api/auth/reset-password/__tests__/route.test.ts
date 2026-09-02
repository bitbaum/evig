/**
 * @vitest-environment node
 *
 * Tests for POST /api/auth/reset-password
 *
 * Mission-relevant: password reset is the last-resort account recovery path.
 * If token verification is bypassed or the wrong user's password is updated,
 * it's an account takeover vulnerability.
 *
 * Behaviors locked:
 *   POST /api/auth/reset-password
 *   - returns 429 when rate limited
 *   - returns 400 when token is invalid or expired
 *   - returns 200 on successful password reset
 *   - calls hashPassword with the new password
 *   - calls updateUserPassword with the hashed password
 *   - returns 500 when updateUserPassword fails
 *   - returns 400 on schema validation failure
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCheckRateLimit = vi.fn();
const mockGetClientIp = vi.fn().mockReturnValue('10.0.0.1');

vi.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
}));

const mockVerifyPasswordResetToken = vi.fn();
const mockUpdateUserPassword = vi.fn();

vi.mock('@/lib/auth/db', () => ({
  verifyPasswordResetToken: (...args: unknown[]) => mockVerifyPasswordResetToken(...args),
  updateUserPassword: (...args: unknown[]) => mockUpdateUserPassword(...args),
}));

const mockHashPassword = vi.fn().mockResolvedValue('$2b$10$new-hashed-password');

vi.mock('@/lib/auth/password', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
}));

const mockSendCustomEmail = vi.fn().mockResolvedValue(undefined);
const mockPasswordChangeConfirmation = vi
  .fn()
  .mockReturnValue({ subject: 'Passwort geändert', html: '', text: '' });

vi.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail(...args),
  passwordChangeConfirmation: (...args: unknown[]) => mockPasswordChangeConfirmation(...args),
}));

const mockSelectWhere = vi.fn().mockResolvedValue([{ name: 'Hans' }]);
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  users: { id: 'users_id', name: 'users_name', email: 'users_email' },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  eq: vi.fn().mockReturnValue({ __eq: true }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
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
  apiRateLimited: (msg: string) => {
    return NextResponse.json({ success: false, error: msg }, { status: 429 });
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_BODY = {
  token: 'valid-reset-token-abc',
  password: 'NewSecure99',
  confirmPassword: 'NewSecure99',
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 9, resetAt: 0 });
  mockVerifyPasswordResetToken.mockResolvedValue({ success: true, email: 'hans@example.com' });
  mockUpdateUserPassword.mockResolvedValue({ success: true });
  mockSelectWhere.mockResolvedValue([{ name: 'Hans' }]);
});

// ============================================================================
// POST /api/auth/reset-password
// ============================================================================

describe('POST /api/auth/reset-password — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60 });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(429);
  });
});

describe('POST /api/auth/reset-password — token validation', () => {
  it('returns 400 when token is invalid', async () => {
    mockVerifyPasswordResetToken.mockResolvedValueOnce({ success: false, error: 'Token ungültig' });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/ungültig/i);
  });

  it('returns 400 when token is expired (generic error)', async () => {
    mockVerifyPasswordResetToken.mockResolvedValueOnce({ success: false });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password — success', () => {
  it('returns 200 on valid token and password', async () => {
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);
  });

  it('returns success: true with message', async () => {
    const response = await POST(makeRequest(VALID_BODY));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toMatch(/passwort/i);
  });

  it('calls hashPassword with the new password', async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockHashPassword).toHaveBeenCalledWith('NewSecure99');
  });

  it('calls updateUserPassword with the hashed password', async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockUpdateUserPassword).toHaveBeenCalledWith(
      'hans@example.com',
      '$2b$10$new-hashed-password',
    );
  });

  it('sends password change confirmation email (fire-and-forget)', async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockSendCustomEmail).toHaveBeenCalledWith('hans@example.com', expect.anything());
  });
});

describe('POST /api/auth/reset-password — schema validation', () => {
  it('returns 400 when token is missing', async () => {
    const response = await POST(
      makeRequest({ password: 'NewSecure99', confirmPassword: 'NewSecure99' }),
    );
    expect(response.status).toBe(400);
  });

  it('returns 400 when passwords do not match', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, confirmPassword: 'DifferentPass1' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when password is too short (less than 8 chars)', async () => {
    const response = await POST(
      makeRequest({ token: 'tok', password: 'short', confirmPassword: 'short' }),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password — DB/service errors', () => {
  it('returns 500 when updateUserPassword returns failure', async () => {
    mockUpdateUserPassword.mockResolvedValueOnce({ success: false });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('returns 500 when verifyPasswordResetToken throws', async () => {
    mockVerifyPasswordResetToken.mockRejectedValueOnce(new Error('DB error'));
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(500);
  });
});

describe('POST /api/auth/reset-password — resolved-failure swallow lock', () => {
  it('still returns 200 when sendCustomEmail resolves { success: false } — but logs the resolved failure', async () => {
    // Regression lock for the swallow fix in this commit:
    // sendCustomEmail resolves {success:false} on SMTP failure rather than
    // throwing. A bare `.catch()` would miss this. Without this assertion
    // a refactor could silently revert to the bare-catch shape and the
    // password-recovery confirmation would fail silently.
    const { logger } = (await import('@/lib/logger')) as unknown as { logger: { warn: Mock } };
    mockSendCustomEmail.mockResolvedValueOnce({ success: false, error: 'Listmonk 500' });

    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);

    // Flush the fire-and-forget .then() chain
    await new Promise((r) => setImmediate(r));

    const resolvedFailureLogs = logger.warn.mock.calls.filter(
      (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('(resolved)'),
    );
    expect(resolvedFailureLogs.length).toBeGreaterThanOrEqual(1);
  });
});
