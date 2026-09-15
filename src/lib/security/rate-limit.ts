import { slidingWindow, clientIp, MemoryStore, type Limiter } from 'limitkit';
import { logger } from '@/lib/logger';

/**
 * Rate limiting for every route in the app.
 *
 * The DECISION — window arithmetic, the refusal shape, which forwarded hop to
 * believe — is owned by `limitkit` (fleet SHARED.md). This file owns evig's
 * LIMIT VALUES and the call shapes its routes were written against, so
 * adopting the package changed no route. Keep it a shim: a local
 * re-implementation "just for one tweak" is how the shared version becomes the
 * stale version and the fix that lands upstream never reaches here.
 *
 * Adopted 2026-09-14, replacing two hand-rolled limiters — an LRU-cache counter
 * here and a bare-Map window in lib/auth/rate-limiter.ts (now lockout.ts,
 * which kept only the account-lockout code). What changed underneath, all of
 * it for the better:
 *   - sliding windows, instead of a TTL that restarted on every allowed hit;
 *   - a refusal counts nothing, so a hammered key recovers the moment the
 *     attacker stops, instead of locking everyone behind the same NAT out;
 *   - the client IP is the LAST X-Forwarded-For hop — the one Caddy wrote —
 *     not the first, which the client controls and could vary per request to
 *     mint a fresh bucket every time (a limiter that cannot trip is not one);
 *   - a bounded store per limiter, so memory cannot grow with stranger IPs.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Creates a limiter: `maxRequests` per `interval` ms per identifier, answered
 * as a plain boolean. Each limiter owns its store — keys are raw identifiers
 * (a user id, an IP), so two limiters sharing a store would share hits.
 */
export function createRateLimiter(interval: number, maxRequests: number) {
  const limiter = slidingWindow({ limit: maxRequests, windowMs: interval }, new MemoryStore());

  return (identifier: string): boolean => {
    const result = limiter.check(identifier);
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        maxRequests,
        interval,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
    return result.allowed;
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // IT-Hilfe: 5 requests per hour per user
  itHilfeCreate: createRateLimiter(ONE_HOUR_MS, 5),

  // Marketplace listings: 10 per hour per user
  listingCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Messages: 20 per hour per user
  messageCreate: createRateLimiter(ONE_HOUR_MS, 20),

  // CSV import: 5 per hour per user
  csvImport: createRateLimiter(ONE_HOUR_MS, 5),

  // AI product analysis: 5 per hour per user (expensive inference)
  aiAnalyze: createRateLimiter(ONE_HOUR_MS, 5),

  // Staff photo intake: 60 per hour. An intake operator photographs many
  // devices in a session; the public 5/hour ceiling would block real work
  // after the first handful. Still bounded so a stuck retry loop can't hammer
  // the vision providers.
  erfassungImage: createRateLimiter(ONE_HOUR_MS, 60),

  // Reviews: 10 per hour per user
  reviewCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Repairer bookings: 5 per hour per user
  bookingCreate: createRateLimiter(ONE_HOUR_MS, 5),

  // Workshop registrations (free path): 5 per hour per user
  workshopRegister: createRateLimiter(ONE_HOUR_MS, 5),

  // Listing reports: 10 per hour per user (defence in depth on top of the
  // one-report-per-listing UNIQUE constraint)
  listingReport: createRateLimiter(ONE_HOUR_MS, 10),

  // IT-Hilfe offers: 10 per hour per user
  offerCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Marketplace browse: 200 per 15 minutes per IP (public, generous)
  listingBrowse: createRateLimiter(FIFTEEN_MINUTES_MS, 200),

  // Contact seller: 10 per hour per user
  contactSeller: createRateLimiter(ONE_HOUR_MS, 10),
  listingQuestion: createRateLimiter(ONE_HOUR_MS, 10),

  // Public vote submit: 10 per hour per IP (unauthenticated, prevents vote spam)
  voteSubmit: createRateLimiter(ONE_HOUR_MS, 10),

  // Public vote-advisor: 5 per hour per IP. Anonymous LLM call that bills
  // upstream (Groq → OpenRouter → Ollama via callWithFallback). Without
  // a limit a script can drain the AI budget in minutes.
  voteAdvisorIp: createRateLimiter(ONE_HOUR_MS, 5),

  // Public vote-advisor global cap: 50 calls/hour across ALL IPs. The
  // per-IP limit assumes one identifier per attacker; a small botnet could
  // still rack up cost. The store is bounded too (oldest keys are evicted
  // past 5 000), so per-IP alone is not a budget safety net. This second-tier
  // cap is the budget backstop — once 50 advisor calls have happened in the
  // last hour, the endpoint refuses additional calls regardless of source IP.
  voteAdvisorGlobal: createRateLimiter(ONE_HOUR_MS, 50),

  // Project contributions: 5 per hour per IP (unauthenticated, prevents spam)
  projectContribute: createRateLimiter(ONE_HOUR_MS, 5),

  // Password change: 5 attempts per hour per user. Defends against current-
  // password brute-force via a hijacked session — the endpoint reveals
  // right/wrong on each attempt, so unlimited attempts let a session-thief
  // recover the user's actual password.
  passwordChange: createRateLimiter(ONE_HOUR_MS, 5),

  // HR job applications: 10 per hour per email/IP
  jobApplicationCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Hirn public chat: 20 per hour per user. Every message is a billed LLM
  // call, so logged-in users get a tighter budget than staff.
  hirnChatUser: createRateLimiter(ONE_HOUR_MS, 20),

  // Hirn admin chat: 60 per hour per staff member (working tool, generous).
  hirnChatStaff: createRateLimiter(ONE_HOUR_MS, 60),

  // General API: 100 requests per 15 minutes per IP
  apiGeneral: createRateLimiter(FIFTEEN_MINUTES_MS, 100),
};

// =============================================================================
// Typed limits for the public forms and auth flows
//
// Moved here from lib/auth/rate-limiter.ts, where they were the only consumer
// of AUTH_CONFIG.rateLimit. Same numbers, one file for every limit value.
// =============================================================================

export type RateLimitType = 'login' | 'register' | 'passwordReset' | 'newsletter' | 'submission';

export const AUTH_RATE_LIMITS: Record<RateLimitType, { windowMs: number; maxAttempts: number }> = {
  // Verification-code attempts (verify-code route). Was "5 per 15 minutes,
  // then a 30-minute block" — the block being the one thing limitkit refuses
  // to model, because a refused attempt extending its own punishment is how a
  // steady attacker locks a NAT's worth of real users out for good. 5 per
  // sliding 30 minutes admits the same 5 attempts per half hour in the steady
  // state, without the punitive extension.
  login: { windowMs: THIRTY_MINUTES_MS, maxAttempts: 5 },
  // 5 registrations per hour per IP (also guards resend-code)
  register: { windowMs: ONE_HOUR_MS, maxAttempts: 5 },
  // 3 password-reset requests per hour per IP
  passwordReset: { windowMs: ONE_HOUR_MS, maxAttempts: 3 },
  // 5 newsletter subscriptions per hour per IP (also guards membership apply)
  newsletter: { windowMs: ONE_HOUR_MS, maxAttempts: 5 },
  // 10 form submissions per hour per IP (inquiry, dropoff, blog)
  submission: { windowMs: ONE_HOUR_MS, maxAttempts: 10 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch ms when the window opens again. */
  resetAt: number;
  /** Seconds until the next attempt is allowed; only set on a refusal. */
  retryAfter?: number;
}

const typedLimiters = Object.fromEntries(
  (Object.keys(AUTH_RATE_LIMITS) as RateLimitType[]).map((type) => {
    const { maxAttempts, windowMs } = AUTH_RATE_LIMITS[type];
    return [type, slidingWindow({ limit: maxAttempts, windowMs }, new MemoryStore())];
  }),
) as Record<RateLimitType, Limiter>;

/**
 * Check `identifier` (an IP, an email, or a combination) against a typed limit.
 */
export function checkRateLimit(identifier: string, type: RateLimitType): RateLimitResult {
  const result = typedLimiters[type].check(identifier);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    retryAfter: result.allowed ? undefined : result.retryAfterSeconds,
  };
}

/**
 * Client identity for keying a limiter: the forwarded hop Caddy wrote, then
 * x-real-ip, then "unknown" — which throttles the anonymous bucket
 * collectively, the right failure mode for the abuse this exists to blunt.
 */
export function getClientIdentifier(request: Pick<Request, 'headers'>): string {
  return clientIp(request.headers);
}
