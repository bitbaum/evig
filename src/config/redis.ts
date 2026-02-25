/**
 * Redis configuration
 * 
 * Single Source of Truth for Redis configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const REDIS_CONFIG = {
  URL: process.env.REDIS_URL || '',
  ENABLE_RATE_LIMITER: process.env.ENABLE_REDIS_RATE_LIMITER === 'true',
} as const;

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!REDIS_CONFIG.URL;
}
