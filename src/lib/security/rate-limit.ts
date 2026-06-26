import { LRUCache } from 'lru-cache';
import { logger } from '@/lib/logger';

/**
 * Time-window constants for rate limiters.
 *
 * Keep these in milliseconds (the LRUCache `ttl` unit). One named constant
 * per window means a single edit point if we want to widen or tighten the
 * default protection — and stops the file from reading like a wall of
 * unrelated `60 * 60 * 1000` literals.
 */
const ONE_HOUR_MS = 60 * 60 * 1000
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

/**
 * Creates a rate limiter using LRU cache
 *
 * @param interval - Time window in milliseconds
 * @param maxRequests - Maximum requests allowed in the time window
 * @returns Function to check if request is allowed
 */
export function createRateLimiter(interval: number, maxRequests: number) {
  const cache = new LRUCache<string, number>({
    max: 500, // Max number of unique identifiers to track
    ttl: interval // Time-to-live matches the interval
  });

  return (identifier: string): boolean => {
    const count = cache.get(identifier) || 0;

    if (count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count,
        maxRequests,
        interval
      });
      return false;
    }

    cache.set(identifier, count + 1);
    return true;
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

  // Reviews: 10 per hour per user
  reviewCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Repairer bookings: 5 per hour per user
  bookingCreate: createRateLimiter(ONE_HOUR_MS, 5),

  // IT-Hilfe offers: 10 per hour per user
  offerCreate: createRateLimiter(ONE_HOUR_MS, 10),

  // Marketplace browse: 200 per 15 minutes per IP (public, generous)
  listingBrowse: createRateLimiter(FIFTEEN_MINUTES_MS, 200),

  // Contact seller: 10 per hour per user
  contactSeller: createRateLimiter(ONE_HOUR_MS, 10),

  // Public vote submit: 10 per hour per IP (unauthenticated, prevents vote spam)
  voteSubmit: createRateLimiter(ONE_HOUR_MS, 10),

  // Public vote-advisor: 5 per hour per IP. Anonymous LLM call that bills
  // upstream (Groq → OpenRouter → Ollama via callWithFallback). Without
  // a limit a script can drain the AI budget in minutes.
  voteAdvisorIp: createRateLimiter(ONE_HOUR_MS, 5),

  // Public vote-advisor global cap: 50 calls/hour across ALL IPs. The
  // per-IP limit assumes one identifier per attacker; a small botnet could
  // still rack up cost. The LRU also evicts at 500 unique IDs, so per-IP
  // alone is not a budget safety net. This second-tier cap is the budget
  // backstop — once 50 advisor calls have happened in the last hour, the
  // endpoint refuses additional calls regardless of source IP.
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

  // General API: 100 requests per 15 minutes per IP
  apiGeneral: createRateLimiter(FIFTEEN_MINUTES_MS, 100)
};

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in development)
  return 'unknown-ip';
}
