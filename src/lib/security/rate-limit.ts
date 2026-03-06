import { LRUCache } from 'lru-cache';
import { logger } from '@/lib/logger';

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
  itHilfeCreate: createRateLimiter(60 * 60 * 1000, 5),

  // Marketplace listings: 10 per hour per user
  listingCreate: createRateLimiter(60 * 60 * 1000, 10),

  // Messages: 20 per hour per user
  messageCreate: createRateLimiter(60 * 60 * 1000, 20),

  // CSV import: 5 per hour per user
  csvImport: createRateLimiter(60 * 60 * 1000, 5),

  // AI product analysis: 5 per hour per user (expensive inference)
  aiAnalyze: createRateLimiter(60 * 60 * 1000, 5),

  // Reviews: 10 per hour per user
  reviewCreate: createRateLimiter(60 * 60 * 1000, 10),

  // Repairer bookings: 5 per hour per user
  bookingCreate: createRateLimiter(60 * 60 * 1000, 5),

  // IT-Hilfe offers: 10 per hour per user
  offerCreate: createRateLimiter(60 * 60 * 1000, 10),

  // Marketplace browse: 200 per 15 minutes per IP (public, generous)
  listingBrowse: createRateLimiter(15 * 60 * 1000, 200),

  // Contact seller: 10 per hour per user
  contactSeller: createRateLimiter(60 * 60 * 1000, 10),

  // General API: 100 requests per 15 minutes per IP
  apiGeneral: createRateLimiter(15 * 60 * 1000, 100)
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
