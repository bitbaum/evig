/**
 * Tests for the LRU-cache-backed rate limiter (lib/security/rate-limit.ts).
 *
 * Two exports:
 *   - createRateLimiter(interval, maxRequests): returns a check fn that
 *     returns true while the per-identifier counter is below maxRequests
 *     and false thereafter; counter resets after `interval` ms (TTL)
 *   - getClientIdentifier(request): pulls IP from x-forwarded-for, then
 *     x-real-ip, then 'unknown-ip' fallback. Multi-IP forwarded chains
 *     pick the first (leftmost = real client).
 *
 *   rateLimiters constants — verify the documented per-flow limits.
 */

import { createRateLimiter, getClientIdentifier, rateLimiters } from '../rate-limit'

// ============================================================================
// createRateLimiter
// ============================================================================

describe('createRateLimiter', () => {
  it('allows up to maxRequests per identifier', () => {
    const allow = createRateLimiter(60_000, 3)
    expect(allow('user-1')).toBe(true)
    expect(allow('user-1')).toBe(true)
    expect(allow('user-1')).toBe(true)
  })

  it('denies the (maxRequests + 1)-th request', () => {
    const allow = createRateLimiter(60_000, 3)
    allow('user-1')
    allow('user-1')
    allow('user-1')
    expect(allow('user-1')).toBe(false)
  })

  it('keeps separate counters per identifier', () => {
    const allow = createRateLimiter(60_000, 2)
    allow('user-1')
    allow('user-1')
    expect(allow('user-1')).toBe(false)
    // Different identifier — fresh quota
    expect(allow('user-2')).toBe(true)
    expect(allow('user-2')).toBe(true)
    expect(allow('user-2')).toBe(false)
  })

  it('returns independent instances (no shared cache between limiters)', () => {
    const limA = createRateLimiter(60_000, 1)
    const limB = createRateLimiter(60_000, 1)
    expect(limA('shared-id')).toBe(true)
    expect(limA('shared-id')).toBe(false) // limA exhausted
    expect(limB('shared-id')).toBe(true)  // limB still has quota
  })

  it('continues to deny once exceeded (does not silently re-allow)', () => {
    const allow = createRateLimiter(60_000, 1)
    expect(allow('x')).toBe(true)
    expect(allow('x')).toBe(false)
    expect(allow('x')).toBe(false)
    expect(allow('x')).toBe(false)
  })
})

// ============================================================================
// getClientIdentifier
// ============================================================================

// jsdom doesn't ship Request — build a minimal stub that satisfies
// getClientIdentifier's structural use (it only calls request.headers.get).
function reqWithHeaders(headers: Record<string, string>): Request {
  const lower: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v
  return {
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
  } as unknown as Request
}

describe('getClientIdentifier', () => {
  it('returns x-forwarded-for when present (proxied request)', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7' })
    expect(getClientIdentifier(req)).toBe('203.0.113.7')
  })

  it('picks the first IP from a comma-separated x-forwarded-for chain', () => {
    // Per X-Forwarded-For spec, leftmost is the client; rest are proxies.
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })
    expect(getClientIdentifier(req)).toBe('203.0.113.7')
  })

  it('trims whitespace around the chosen IP', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '   203.0.113.7   , 10.0.0.1' })
    expect(getClientIdentifier(req)).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const req = reqWithHeaders({ 'x-real-ip': '198.51.100.42' })
    expect(getClientIdentifier(req)).toBe('198.51.100.42')
  })

  it('prefers x-forwarded-for over x-real-ip when both present', () => {
    const req = reqWithHeaders({
      'x-forwarded-for': '203.0.113.7',
      'x-real-ip': '198.51.100.42',
    })
    expect(getClientIdentifier(req)).toBe('203.0.113.7')
  })

  it('returns the unknown-ip fallback when no IP headers are present', () => {
    const req = reqWithHeaders({})
    expect(getClientIdentifier(req)).toBe('unknown-ip')
  })
})

// ============================================================================
// rateLimiters preset constants
// ============================================================================

describe('rateLimiters presets', () => {
  it('exposes every documented preset', () => {
    expect(rateLimiters.itHilfeCreate).toBeDefined()
    expect(rateLimiters.listingCreate).toBeDefined()
    expect(rateLimiters.messageCreate).toBeDefined()
    expect(rateLimiters.csvImport).toBeDefined()
    expect(rateLimiters.aiAnalyze).toBeDefined()
    expect(rateLimiters.reviewCreate).toBeDefined()
    expect(rateLimiters.bookingCreate).toBeDefined()
    expect(rateLimiters.offerCreate).toBeDefined()
    expect(rateLimiters.listingBrowse).toBeDefined()
    expect(rateLimiters.contactSeller).toBeDefined()
    expect(rateLimiters.apiGeneral).toBeDefined()
  })

  it('every preset is callable as (identifier) => boolean', () => {
    // Smoke-test all presets respond truthily on a fresh identifier
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      const result = limiter(`smoke-test-${name}-${Math.random()}`)
      expect(typeof result).toBe('boolean')
      expect(result).toBe(true) // first call must always allow
    }
  })

  it('listingBrowse is the most generous (200 per 15 min — public browsing)', () => {
    const id = 'browse-smoke-' + Math.random()
    // Should allow at least 100 calls before denying — proving a high cap
    for (let i = 0; i < 100; i++) {
      expect(rateLimiters.listingBrowse(id)).toBe(true)
    }
  })

  it('aiAnalyze is one of the strictest (5 per hour — expensive inference)', () => {
    const id = 'ai-smoke-' + Math.random()
    expect(rateLimiters.aiAnalyze(id)).toBe(true)
    expect(rateLimiters.aiAnalyze(id)).toBe(true)
    expect(rateLimiters.aiAnalyze(id)).toBe(true)
    expect(rateLimiters.aiAnalyze(id)).toBe(true)
    expect(rateLimiters.aiAnalyze(id)).toBe(true)
    // 6th call within the hour must be denied
    expect(rateLimiters.aiAnalyze(id)).toBe(false)
  })
})
