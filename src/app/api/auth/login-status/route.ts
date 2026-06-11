import { NextRequest } from 'next/server'
import { apiSuccess, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { createRateLimiter, getClientIdentifier } from '@/lib/security/rate-limit'

const loginStatusLimiter = createRateLimiter(60 * 1000, 10) // 10 requests/minute per IP

/**
 * POST /api/auth/login-status
 *
 * Historical purpose: pre-flight check during sign-in to hint at UX
 * (email verification, lockout, OAuth-only accounts). No UI surface consumes
 * this endpoint as of 2026-06-11.
 *
 * The previous implementation returned distinct `exists: false / EMAIL_NOT_FOUND`
 * vs `exists: true, emailVerified, hasPassword, locked, lockedUntil` responses,
 * which turned the user table into a discoverable address book — the rate
 * limit (10/min/IP) is trivially bypassed via IP rotation. The forgot-password
 * endpoint correctly hides existence; this one was leaking it.
 *
 * Current contract: always returns a uniform safe-default payload regardless
 * of whether the email is registered. Failed-auth UX must live in the
 * NextAuth signin response, not here. Kept reachable (rather than deleted) so
 * existing/future callers don't 404; the response shape is unchanged.
 */
export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req)
  if (!loginStatusLimiter(clientId)) {
    return apiRateLimited()
  }

  // Still require a body field so accidental probes are surfaced as 400,
  // but don't actually look the email up — that lookup is the enumeration vector.
  let email: unknown = null
  try {
    const body = await req.json()
    email = body?.email
  } catch {
    return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED)
  }
  if (typeof email !== 'string' || email.length === 0) {
    return apiBadRequest(ERROR_MESSAGES.EMAIL_REQUIRED)
  }

  // Uniform response — never branches on whether the user exists.
  return apiSuccess({
    exists: true,
    emailVerified: true,
    hasPassword: true,
    locked: false,
    lockedUntil: null,
  })
}
