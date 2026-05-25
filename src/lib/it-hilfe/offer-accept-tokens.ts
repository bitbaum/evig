/**
 * HMAC-signed tokens for one-tap IT-Hilfe offer acceptance via email.
 *
 * Stateless: no DB lookup on verify. Signed with AUTH_SECRET. Payload binds
 * the offer ID and expiry; signature prevents tampering.
 *
 * One-use is enforced not by the token itself but by the business state of
 * the offer it points to — the accept handler checks the offer's status,
 * and once accepted/rejected/withdrawn, replaying the token does nothing
 * useful. This is intentional: it keeps tokens replayable for ~7 days while
 * the offer is still PENDING, so a user can re-click an email if they lose
 * the open tab.
 */

import { createHmac, timingSafeEqual } from 'crypto'

const TOKEN_VERSION = 'v1'
export const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET (or NEXTAUTH_SECRET) is required to sign offer-accept tokens')
  }
  return secret
}

function computeSignature(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest()
}

/**
 * Sign a one-tap accept token for the given offer ID.
 * Token expires `TOKEN_TTL_MS` after `now`.
 */
export function signOfferAcceptToken(offerId: string, now: number = Date.now()): string {
  if (!offerId) throw new Error('offerId is required')
  const exp = now + TOKEN_TTL_MS
  const payload = `${TOKEN_VERSION}.${offerId}.${exp}`
  const sig = computeSignature(payload, getSecret()).toString('hex')
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

export type VerifyResult =
  | { ok: true; offerId: string; expiresAt: Date }
  | { ok: false; reason: 'malformed' | 'expired' | 'invalid_signature' }

/**
 * Verify a token. Returns the offer ID on success, or a reason on failure.
 *
 * The handler should additionally confirm the offer's status is still
 * PENDING before applying any state change — token verification alone
 * does NOT guarantee the offer is still acceptable.
 */
export function verifyOfferAcceptToken(token: string, now: number = Date.now()): VerifyResult {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'malformed' }
  }

  let decoded: string
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const parts = decoded.split('.')
  if (parts.length !== 4) return { ok: false, reason: 'malformed' }

  const [version, offerId, expStr, sigHex] = parts
  if (version !== TOKEN_VERSION) return { ok: false, reason: 'malformed' }
  if (!offerId) return { ok: false, reason: 'malformed' }

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp <= 0) return { ok: false, reason: 'malformed' }

  let providedSig: Buffer
  try {
    providedSig = Buffer.from(sigHex, 'hex')
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const payload = `${version}.${offerId}.${exp}`
  const expectedSig = computeSignature(payload, getSecret())

  if (providedSig.length !== expectedSig.length) {
    return { ok: false, reason: 'invalid_signature' }
  }
  if (!timingSafeEqual(providedSig, expectedSig)) {
    return { ok: false, reason: 'invalid_signature' }
  }

  if (now > exp) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, offerId, expiresAt: new Date(exp) }
}
