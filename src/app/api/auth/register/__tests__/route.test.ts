/**
 * @vitest-environment node
 *
 * Tests for POST /api/auth/register
 *
 * Mission-relevant: registration is the entry point for all volunteers,
 * donors, and workshop participants. If validation is bypassed or the wrong
 * status is returned, the onboarding funnel breaks.
 *
 * Behaviors locked:
 *   POST /api/auth/register
 *   - returns 429 when rate limited
 *   - returns 400 on schema validation failure
 *   - returns 200 on successful registration
 *   - returns 400 when registerUser reports a failure
 *   - returns 503 on DB connection error
 *   - returns 500 on unexpected error
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

const mockRegisterUser = vi.fn();

vi.mock('@/auth', () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
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

// The route uses RegisterSchema.safeParse() directly (not validateBody).
// Mock the schema module to control output without depending on password complexity rules.
vi.mock('@/lib/schemas', async () => {
  const actual = await vi.importActual('@/lib/schemas');
  return {
    ...actual,
    RegisterSchema: {
      safeParse: vi.fn((body: unknown) => {
        const b = body as Record<string, unknown>;
        if (
          !b?.email ||
          !String(b.email).includes('@') ||
          !b?.password ||
          String(b.password).length < 8
        ) {
          return {
            success: false,
            error: { flatten: () => ({ fieldErrors: { email: ['Invalid'] } }) },
          };
        }
        return {
          success: true,
          data: { email: b.email, password: b.password, name: b.name, role: b.role || 'customer' },
        };
      }),
    },
  };
});

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
  email: 'newuser@example.com',
  password: 'ValidPass1',
  name: 'New User',
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 4, resetAt: 0 });
  mockRegisterUser.mockResolvedValue({
    success: true,
    data: { id: 'user-1', email: 'newuser@example.com' },
  });
});

// ============================================================================
// POST /api/auth/register
// ============================================================================

describe('POST /api/auth/register — rate limiting', () => {
  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 3600,
      remaining: 0,
      resetAt: 0,
    });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(429);
  });

  it('does not call registerUser when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 3600,
      remaining: 0,
      resetAt: 0,
    });
    await POST(makeRequest(VALID_BODY));
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/register — validation', () => {
  it('returns 400 when email is invalid', async () => {
    const response = await POST(makeRequest({ email: 'bad', password: 'ValidPass1' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    const response = await POST(makeRequest({ email: 'test@example.com', password: 'short' }));
    expect(response.status).toBe(400);
  });

  it('does not call registerUser on validation failure', async () => {
    await POST(makeRequest({ email: 'bad', password: 'x' }));
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/register — success', () => {
  it('returns 200 on valid registration', async () => {
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(200);
  });

  it('returns success: true', async () => {
    const response = await POST(makeRequest(VALID_BODY));
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('calls registerUser with email, password, name, role', async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockRegisterUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newuser@example.com', name: 'New User' }),
    );
  });
});

describe('POST /api/auth/register — registerUser failures', () => {
  it('returns 400 when registerUser returns success: false', async () => {
    mockRegisterUser.mockResolvedValueOnce({ success: false, error: 'E-Mail bereits registriert' });
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/registriert/i);
  });

  it('returns 503 on DB connection error', async () => {
    mockRegisterUser.mockRejectedValueOnce(new Error('ECONNREFUSED to database'));
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(503);
  });

  it('returns 500 on unexpected error', async () => {
    mockRegisterUser.mockRejectedValueOnce(new Error('Unknown failure'));
    const response = await POST(makeRequest(VALID_BODY));
    expect(response.status).toBe(500);
  });
});
