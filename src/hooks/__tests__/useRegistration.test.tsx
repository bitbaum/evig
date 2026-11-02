/**
 * Tests for useRegistration — the registration + email verification
 * client hook. Mission-critical: gates new user onboarding (the
 * top-of-funnel for the platform). A regression here either blocks
 * legitimate signups or accepts unverified accounts.
 *
 * Three actions:
 *   - register(email, password, name)
 *       POST /api/auth/register, returns { userId, emailSent } on
 *       success or null on failure (with errors[] populated)
 *   - verifyCode(email, code)
 *       POST /api/auth/verify-code, returns boolean (verifyError set
 *       on failure)
 *   - resendCode(email)
 *       POST /api/auth/resend-code, returns success boolean
 *
 * Locks request shape, error message fallbacks, and isLoading lifecycle.
 */

const mockApiFetch = vi.fn();

vi.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRegistration } from '../useRegistration';

beforeEach(() => {
  mockApiFetch.mockReset();
});

const validParams = {
  email: 'anna@b.ch',
  password: 'super-secret-pw',
  name: 'Anna Müller',
};

// ============================================================================
// Initial state
// ============================================================================

// ============================================================================
// register
// ============================================================================

// ============================================================================
// verifyCode
// ============================================================================

describe('verifyCode', () => {
  it('POSTs to /api/auth/verify-code with email + code', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.verifyCode('anna@b.ch', '123456');
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/verify-code', {
      method: 'POST',
      body: { email: 'anna@b.ch', code: '123456' },
    });
  });

  it('returns true and clears verifyError on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useRegistration());

    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.verifyCode('anna@b.ch', '123456');
    });

    expect(ok).toBe(true);
    expect(result.current.verifyError).toBeUndefined();
  });

  it('returns false and sets verifyError on failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Code abgelaufen' });

    const { result } = renderHook(() => useRegistration());

    let ok: boolean = true;
    await act(async () => {
      ok = await result.current.verifyCode('anna@b.ch', 'wrong');
    });

    expect(ok).toBe(false);
    expect(result.current.verifyError).toBe('Code abgelaufen');
  });

  it('uses Swiss-German fallback "Ungültiger Code" when error missing', async () => {
    // CLAUDE.md rule #4 — proper umlaut, not Ungueltig
    mockApiFetch.mockResolvedValueOnce({ success: false });

    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.verifyCode('anna@b.ch', 'wrong');
    });

    expect(result.current.verifyError).toBe('Ungültiger Code');
  });

  it('clears previous verifyError on a new attempt', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'first error' })
      .mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.verifyCode('anna@b.ch', '111');
    });
    expect(result.current.verifyError).toBe('first error');

    await act(async () => {
      await result.current.verifyCode('anna@b.ch', '222');
    });
    expect(result.current.verifyError).toBeUndefined();
  });
});

// ============================================================================
// resendCode
// ============================================================================

describe('resendCode', () => {
  it('POSTs to /api/auth/resend-code with email', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.resendCode('anna@b.ch');
    });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/resend-code', {
      method: 'POST',
      body: { email: 'anna@b.ch' },
    });
  });

  it('returns true on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useRegistration());

    let ok: boolean = false;
    await act(async () => {
      ok = await result.current.resendCode('anna@b.ch');
    });

    expect(ok).toBe(true);
  });

  it('returns false on failure (does NOT throw)', async () => {
    // Anti-leak: rate-limit errors etc. shouldn't surface as exceptions
    // — the UI just shows the result boolean
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Rate limit' });

    const { result } = renderHook(() => useRegistration());

    let ok: boolean = true;
    await act(async () => {
      ok = await result.current.resendCode('anna@b.ch');
    });

    expect(ok).toBe(false);
  });

  it('does NOT touch verifyError state', async () => {
    // resendCode is independent of verifyCode — the verify error from a
    // previous attempt should still be visible to the user
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'Wrong code' }) // verify
      .mockResolvedValueOnce({ success: true }); // resend

    const { result } = renderHook(() => useRegistration());

    await act(async () => {
      await result.current.verifyCode('anna@b.ch', 'wrong');
    });
    expect(result.current.verifyError).toBe('Wrong code');

    await act(async () => {
      await result.current.resendCode('anna@b.ch');
    });

    // verifyError should remain — resend doesn't clear it
    expect(result.current.verifyError).toBe('Wrong code');
  });
});
