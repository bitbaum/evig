/**
 * Tests for the limitkit-backed rate limiter (lib/security/rate-limit.ts).
 *
 * The window algorithm is limitkit's and tested there; what is pinned HERE is
 * evig's contract on top of it:
 *   - createRateLimiter(interval, maxRequests): a check fn that returns true
 *     while the per-identifier count is below maxRequests and false after
 *   - checkRateLimit(identifier, type): the typed limits the auth/public
 *     forms use, with the {allowed, remaining, resetAt, retryAfter} shape
 *   - getClientIdentifier(request): the LAST x-forwarded-for hop (written by
 *     our own proxy), then x-real-ip, then 'unknown'
 *   - rateLimiters / AUTH_RATE_LIMITS constants — the documented limits
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  AUTH_RATE_LIMITS,
  checkRateLimit,
  createRateLimiter,
  getClientIdentifier,
  rateLimiters,
} from '../rate-limit';

// ============================================================================
// The class-ender: one place decides which forwarded hop to believe
// ============================================================================

describe('nothing re-derives the client IP from the raw header', () => {
  // getClientIdentifier (limitkit) is the single place allowed to read
  // x-forwarded-for. Every hand-rolled copy of that read has been the same
  // bug: the first hop, or the whole header, is text the CALLER typed, so a
  // limiter keyed on it gets a fresh bucket per request and cannot trip, and
  // an audit row holding it records the caller's own claim as evidence.
  const SRC = join(process.cwd(), 'src');
  const ALLOWED = [join('src', 'lib', 'security', 'rate-limit.ts')];

  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
    });

  it('no file outside lib/security/rate-limit.ts reads x-forwarded-for', () => {
    const offenders = sourceFiles(SRC)
      .map((file) => file.replace(process.cwd() + '/', ''))
      .filter(
        (file) =>
          !ALLOWED.includes(file) &&
          /['"]x-forwarded-for['"]/i.test(readFileSync(join(process.cwd(), file), 'utf8')),
      );

    expect(offenders).toEqual([]);
  });
});

// ============================================================================
// createRateLimiter
// ============================================================================

describe('createRateLimiter', () => {
  it('allows up to maxRequests per identifier', () => {
    const allow = createRateLimiter(60_000, 3);
    expect(allow('user-1')).toBe(true);
    expect(allow('user-1')).toBe(true);
    expect(allow('user-1')).toBe(true);
  });

  it('denies the (maxRequests + 1)-th request', () => {
    const allow = createRateLimiter(60_000, 3);
    allow('user-1');
    allow('user-1');
    allow('user-1');
    expect(allow('user-1')).toBe(false);
  });

  it('keeps separate counters per identifier', () => {
    const allow = createRateLimiter(60_000, 2);
    allow('user-1');
    allow('user-1');
    expect(allow('user-1')).toBe(false);
    // Different identifier — fresh quota
    expect(allow('user-2')).toBe(true);
    expect(allow('user-2')).toBe(true);
    expect(allow('user-2')).toBe(false);
  });

  it('returns independent instances (no shared store between limiters)', () => {
    const limA = createRateLimiter(60_000, 1);
    const limB = createRateLimiter(60_000, 1);
    expect(limA('shared-id')).toBe(true);
    expect(limA('shared-id')).toBe(false); // limA exhausted
    expect(limB('shared-id')).toBe(true); // limB still has quota
  });

  it('continues to deny once exceeded (does not silently re-allow)', () => {
    const allow = createRateLimiter(60_000, 1);
    expect(allow('x')).toBe(true);
    expect(allow('x')).toBe(false);
    expect(allow('x')).toBe(false);
    expect(allow('x')).toBe(false);
  });
});

// ============================================================================
// checkRateLimit (typed limits)
// ============================================================================

describe('checkRateLimit', () => {
  // Unique identifiers per test: the typed limiters are module singletons.
  let testId = 0;
  const uniqueId = () => `rate-test-${++testId}-${Date.now()}`;

  it('allows the first request with the full shape', () => {
    const result = checkRateLimit(uniqueId(), 'login');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(AUTH_RATE_LIMITS.login.maxAttempts - 1);
    expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
    expect(result.retryAfter).toBeUndefined();
  });

  it('blocks after maxAttempts with remaining 0 and a real retryAfter', () => {
    const id = uniqueId();
    for (let i = 0; i < AUTH_RATE_LIMITS.login.maxAttempts; i++) {
      expect(checkRateLimit(id, 'login').allowed).toBe(true);
    }
    const blocked = checkRateLimit(id, 'login');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('keys each type separately', () => {
    const id = uniqueId();
    for (let i = 0; i < AUTH_RATE_LIMITS.passwordReset.maxAttempts; i++) {
      checkRateLimit(id, 'passwordReset');
    }
    expect(checkRateLimit(id, 'passwordReset').allowed).toBe(false);
    expect(checkRateLimit(id, 'register').allowed).toBe(true);
  });

  it('verification-code attempts: 5 per window of at least 30 minutes', () => {
    // Was "5 per 15 min then a 30-min block" in AUTH_CONFIG; the sliding
    // 30-minute window keeps the steady-state rate (5 per half hour).
    expect(AUTH_RATE_LIMITS.login.maxAttempts).toBe(5);
    expect(AUTH_RATE_LIMITS.login.windowMs).toBeGreaterThanOrEqual(30 * 60 * 1000);
  });
});

// ============================================================================
// getClientIdentifier
// ============================================================================

// jsdom doesn't ship Request — build a minimal stub that satisfies
// getClientIdentifier's structural use (it only calls request.headers.get).
function reqWithHeaders(headers: Record<string, string>): Request {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v;
  return {
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe('getClientIdentifier', () => {
  it('returns x-forwarded-for when present (proxied request)', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7' });
    expect(getClientIdentifier(req)).toBe('203.0.113.7');
  });

  it('picks the LAST hop of a chain — the one our proxy appended', () => {
    // A proxy APPENDS to X-Forwarded-For, so the leftmost entries are whatever
    // the client sent and only the rightmost is unforgeable.
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' });
    expect(getClientIdentifier(req)).toBe('10.0.0.2');
  });

  it('a client-supplied first hop cannot mint a fresh bucket', () => {
    const allow = createRateLimiter(60_000, 1);
    const spoofed = (fake: string) =>
      allow(getClientIdentifier(reqWithHeaders({ 'x-forwarded-for': `${fake}, 198.51.100.9` })));
    expect(spoofed('1.1.1.1')).toBe(true);
    expect(spoofed('2.2.2.2')).toBe(false);
  });

  it('trims whitespace around the chosen IP', () => {
    const req = reqWithHeaders({ 'x-forwarded-for': '203.0.113.7,   10.0.0.1   ' });
    expect(getClientIdentifier(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const req = reqWithHeaders({ 'x-real-ip': '198.51.100.42' });
    expect(getClientIdentifier(req)).toBe('198.51.100.42');
  });

  it('prefers x-forwarded-for over x-real-ip when both present', () => {
    const req = reqWithHeaders({
      'x-forwarded-for': '203.0.113.7',
      'x-real-ip': '198.51.100.42',
    });
    expect(getClientIdentifier(req)).toBe('203.0.113.7');
  });

  it('returns the unknown fallback when no IP headers are present', () => {
    const req = reqWithHeaders({});
    expect(getClientIdentifier(req)).toBe('unknown');
  });
});

// ============================================================================
// rateLimiters preset constants
// ============================================================================

describe('rateLimiters presets', () => {
  it('exposes every documented preset', () => {
    expect(rateLimiters.itHilfeCreate).toBeDefined();
    expect(rateLimiters.listingCreate).toBeDefined();
    expect(rateLimiters.messageCreate).toBeDefined();
    expect(rateLimiters.csvImport).toBeDefined();
    expect(rateLimiters.aiAnalyze).toBeDefined();
    expect(rateLimiters.reviewCreate).toBeDefined();
    expect(rateLimiters.bookingCreate).toBeDefined();
    expect(rateLimiters.offerCreate).toBeDefined();
    expect(rateLimiters.listingBrowse).toBeDefined();
    expect(rateLimiters.contactSeller).toBeDefined();
    expect(rateLimiters.apiGeneral).toBeDefined();
  });

  it('every preset is callable as (identifier) => boolean', () => {
    // Smoke-test all presets respond truthily on a fresh identifier
    for (const [name, limiter] of Object.entries(rateLimiters)) {
      const result = limiter(`smoke-test-${name}-${Math.random()}`);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // first call must always allow
    }
  });

  it('listingBrowse is the most generous (200 per 15 min — public browsing)', () => {
    const id = 'browse-smoke-' + Math.random();
    // Should allow at least 100 calls before denying — proving a high cap
    for (let i = 0; i < 100; i++) {
      expect(rateLimiters.listingBrowse(id)).toBe(true);
    }
  });

  it('aiAnalyze is one of the strictest (5 per hour — expensive inference)', () => {
    const id = 'ai-smoke-' + Math.random();
    expect(rateLimiters.aiAnalyze(id)).toBe(true);
    expect(rateLimiters.aiAnalyze(id)).toBe(true);
    expect(rateLimiters.aiAnalyze(id)).toBe(true);
    expect(rateLimiters.aiAnalyze(id)).toBe(true);
    expect(rateLimiters.aiAnalyze(id)).toBe(true);
    // 6th call within the hour must be denied
    expect(rateLimiters.aiAnalyze(id)).toBe(false);
  });
});
