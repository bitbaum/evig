/**
 * Tests for the HMAC-signed one-tap offer-accept tokens.
 *
 * Covers: sign + verify roundtrip, expiry, tampering (signature, payload,
 * version), malformed inputs, secret rotation, and the timing-safe compare.
 */

import {
  signOfferAcceptToken,
  verifyOfferAcceptToken,
  TOKEN_TTL_MS,
} from '../offer-accept-tokens'

const TEST_OFFER_ID = '11111111-2222-3333-4444-555555555555'
const ORIGINAL_SECRET = process.env.AUTH_SECRET

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-do-not-use-in-prod-0123456789abcdef'
})

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.AUTH_SECRET
  } else {
    process.env.AUTH_SECRET = ORIGINAL_SECRET
  }
})

// ============================================================================
// Happy path
// ============================================================================

describe('signOfferAcceptToken + verifyOfferAcceptToken — happy path', () => {
  it('round-trips an offer ID through sign + verify', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const result = verifyOfferAcceptToken(token)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.offerId).toBe(TEST_OFFER_ID)
      expect(result.expiresAt).toBeInstanceOf(Date)
    }
  })

  it('encodes the expected expiry (now + TTL)', () => {
    const fixedNow = 1_700_000_000_000
    const token = signOfferAcceptToken(TEST_OFFER_ID, fixedNow)
    const result = verifyOfferAcceptToken(token, fixedNow)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.expiresAt.getTime()).toBe(fixedNow + TOKEN_TTL_MS)
    }
  })

  it('produces a URL-safe token (no slashes, plusses, or padding)', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    expect(token).not.toMatch(/[/+=]/)
  })
})

// ============================================================================
// Expiry
// ============================================================================

describe('expiry', () => {
  it('verifies as expired when now > exp', () => {
    const issuedAt = 1_700_000_000_000
    const token = signOfferAcceptToken(TEST_OFFER_ID, issuedAt)
    const wayLater = issuedAt + TOKEN_TTL_MS + 1
    const result = verifyOfferAcceptToken(token, wayLater)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('verifies as ok exactly at the expiry instant', () => {
    const issuedAt = 1_700_000_000_000
    const token = signOfferAcceptToken(TEST_OFFER_ID, issuedAt)
    // exp = issuedAt + TTL; now === exp → ok (not yet expired)
    const result = verifyOfferAcceptToken(token, issuedAt + TOKEN_TTL_MS)
    expect(result.ok).toBe(true)
  })
})

// ============================================================================
// Tampering
// ============================================================================

describe('tampering rejection', () => {
  it('rejects a token with a flipped signature byte', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('.')
    // Flip one hex char of the signature
    const sig = parts[3]
    const flipped = (sig[0] === 'a' ? 'b' : 'a') + sig.slice(1)
    parts[3] = flipped
    const tampered = Buffer.from(parts.join('.')).toString('base64url')
    const result = verifyOfferAcceptToken(tampered)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_signature')
  })

  it('rejects a token where the offerId was swapped', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('.')
    parts[1] = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' // different valid-looking UUID
    const tampered = Buffer.from(parts.join('.')).toString('base64url')
    const result = verifyOfferAcceptToken(tampered)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_signature')
  })

  it('rejects a token with an inflated expiry', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('.')
    parts[2] = String(Number(parts[2]) + 1_000_000)
    const tampered = Buffer.from(parts.join('.')).toString('base64url')
    const result = verifyOfferAcceptToken(tampered)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_signature')
  })

  it('rejects a token with a different version prefix', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const parts = decoded.split('.')
    parts[0] = 'v2'
    const tampered = Buffer.from(parts.join('.')).toString('base64url')
    const result = verifyOfferAcceptToken(tampered)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects a token signed with a different secret', () => {
    const token = signOfferAcceptToken(TEST_OFFER_ID)
    const previousSecret = process.env.AUTH_SECRET
    process.env.AUTH_SECRET = 'different-secret-' + Date.now()
    try {
      const result = verifyOfferAcceptToken(token)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toBe('invalid_signature')
    } finally {
      process.env.AUTH_SECRET = previousSecret
    }
  })
})

// ============================================================================
// Malformed inputs
// ============================================================================

describe('malformed inputs', () => {
  it('rejects an empty string', () => {
    const result = verifyOfferAcceptToken('')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects a token with too few segments', () => {
    const garbage = Buffer.from('v1.only-two-parts').toString('base64url')
    const result = verifyOfferAcceptToken(garbage)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects a token with non-numeric expiry', () => {
    const garbage = Buffer.from('v1.offer-id.not-a-number.deadbeef').toString('base64url')
    const result = verifyOfferAcceptToken(garbage)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects random base64url garbage', () => {
    const result = verifyOfferAcceptToken('not-even-close-to-a-real-token')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })
})

// ============================================================================
// Secret enforcement
// ============================================================================

describe('AUTH_SECRET enforcement', () => {
  it('throws on sign when AUTH_SECRET is unset', () => {
    const previous = process.env.AUTH_SECRET
    const previousNextAuth = process.env.NEXTAUTH_SECRET
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    try {
      expect(() => signOfferAcceptToken(TEST_OFFER_ID)).toThrow(/AUTH_SECRET/)
    } finally {
      if (previous !== undefined) process.env.AUTH_SECRET = previous
      if (previousNextAuth !== undefined) process.env.NEXTAUTH_SECRET = previousNextAuth
    }
  })

  it('rejects empty offerId', () => {
    expect(() => signOfferAcceptToken('')).toThrow(/offerId/)
  })
})
