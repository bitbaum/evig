/**
 * Rate Limiting and Account Lockout System
 *
 * Provides protection against:
 * - Brute force attacks
 * - Credential stuffing
 * - API abuse
 *
 * Uses in-memory storage with optional Redis backend for production.
 */

import { AUTH_CONFIG } from './config'
import { query } from './db'
import { getRedis } from './redis'
import { logger } from '@/lib/logger'
import { isRedisConfigured, REDIS_CONFIG } from '@/config/redis'

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
  blockedUntil?: number
}

interface LockoutEntry {
  failedAttempts: number
  lockedUntil?: number
  lockoutCount: number  // For progressive lockout
  lastAttempt: number
}

// =============================================================================
// In-Memory Storage (for single-instance deployments)
// =============================================================================

const rateLimitStore = new Map<string, RateLimitEntry>()
const lockoutStore = new Map<string, LockoutEntry>()
const ENABLE_REDIS = isRedisConfigured() && REDIS_CONFIG.ENABLE_RATE_LIMITER

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }

  for (const [key, entry] of lockoutStore.entries()) {
    // Keep lockout history for 24 hours
    if (entry.lastAttempt < now - 24 * 60 * 60 * 1000) {
      lockoutStore.delete(key)
    }
  }
}, 60 * 1000) // Run every minute

// =============================================================================
// Rate Limiting Functions
// =============================================================================

export type RateLimitType = 'login' | 'register' | 'passwordReset'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number  // Seconds until retry allowed
}

/**
 * Check if a request is rate limited
 * @param identifier - User identifier (IP, email, or combination)
 * @param type - Type of rate limit to check
 */
export function checkRateLimit(identifier: string, type: RateLimitType): RateLimitResult {
  // Redis-backed path
  // This synchronous signature requires async under-the-hood. To preserve
  // backward compatibility, we optimistically no-op to in-memory if Redis is not ready.
  // Consumers that need strict guarantees should use an async variant (future).
  // Here we do a best-effort: if Redis configured, we schedule an async update
  // and compute allowed using local heuristics. For correctness across instances,
  // prefer enabling Redis and switching to API endpoints that enforce it server-side.

  const config = AUTH_CONFIG.rateLimit[type]
  const key = `${type}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Check if currently blocked
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
    }
  }

  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    }
  }

  // Check if within limits
  const remaining = Math.max(0, config.maxAttempts - entry.count - 1)
  const allowed = entry.count < config.maxAttempts

  if (allowed) {
    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)
  } else {
    // Block for additional time
    if ('blockDuration' in config && config.blockDuration) {
      entry.blockedUntil = now + config.blockDuration
      rateLimitStore.set(key, entry)
    }
  }

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful action)
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`
  rateLimitStore.delete(key)
}

// =============================================================================
// Account Lockout Functions
// =============================================================================

interface LockoutResult {
  locked: boolean
  remainingAttempts: number
  lockedUntil?: number
  retryAfter?: number
}

/**
 * Record a failed login attempt
 * @param identifier - User email or ID
 * @returns Lockout status after recording the attempt
 */
export function recordFailedAttempt(identifier: string): LockoutResult {
  // In-memory fallback (single instance). For multi-instance, use DB or Redis versions below.
  const config = AUTH_CONFIG.lockout
  const now = Date.now()
  const key = `lockout:${identifier}`

  let entry = lockoutStore.get(key) || {
    failedAttempts: 0,
    lockoutCount: 0,
    lastAttempt: now,
  }

  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  // Clear lockout if expired
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    // Keep lockout count for progressive lockout
    entry.failedAttempts = 0
    entry.lockedUntil = undefined
  }

  // Increment failed attempts
  entry.failedAttempts++
  entry.lastAttempt = now

  // Check if should lock
  if (entry.failedAttempts >= config.maxFailedAttempts) {
    entry.lockoutCount++

    // Progressive lockout: double duration each time
    const multiplier = config.progressiveLockout
      ? Math.pow(2, entry.lockoutCount - 1)
      : 1
    const lockoutDuration = config.lockoutDuration * multiplier

    // Cap at 24 hours
    entry.lockedUntil = now + Math.min(lockoutDuration, 24 * 60 * 60 * 1000)

    lockoutStore.set(key, entry)

    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  lockoutStore.set(key, entry)

  return {
    locked: false,
    remainingAttempts: config.maxFailedAttempts - entry.failedAttempts,
  }
}

/**
 * Check if an account is locked
 */
export function isAccountLocked(identifier: string): LockoutResult {
  const now = Date.now()
  const key = `lockout:${identifier}`
  const entry = lockoutStore.get(key)

  if (!entry) {
    return {
      locked: false,
      remainingAttempts: AUTH_CONFIG.lockout.maxFailedAttempts,
    }
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, AUTH_CONFIG.lockout.maxFailedAttempts - entry.failedAttempts),
  }
}

/**
 * Reset account lockout (e.g., after successful login)
 */
export function resetLockout(identifier: string): void {
  const key = `lockout:${identifier}`
  lockoutStore.delete(key)
}

/**
 * Clear all failed attempts for an account
 * Use after successful password reset
 */
export function clearFailedAttempts(identifier: string): void {
  const key = `lockout:${identifier}`
  const entry = lockoutStore.get(key)
  if (entry) {
    entry.failedAttempts = 0
    entry.lockedUntil = undefined
    lockoutStore.set(key, entry)
  }
}

// =============================================================================
// Database-backed Lockout (for persistent lockout across restarts)
// =============================================================================

/**
 * Record failed login attempt in database
 * Use this for persistent lockout tracking
 */
export async function recordFailedAttemptDb(
  userId: string,
  ipAddress: string
): Promise<LockoutResult> {
  const config = AUTH_CONFIG.lockout
  const now = new Date()

  try {
    // Get or create lockout record
    const result = await query<{
      failed_attempts: number
      locked_until: Date | null
      lockout_count: number
    }>(
      `INSERT INTO user_lockouts (user_id, ip_address, failed_attempts, last_attempt)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         failed_attempts = CASE
           WHEN user_lockouts.locked_until < $3 THEN 1
           ELSE user_lockouts.failed_attempts + 1
         END,
         last_attempt = $3,
         locked_until = CASE
           WHEN user_lockouts.locked_until < $3 THEN NULL
           ELSE user_lockouts.locked_until
         END
       RETURNING failed_attempts, locked_until, lockout_count`,
      [userId, ipAddress, now]
    )

    const record = result.rows[0]

    // Check if should lock
    if (record.failed_attempts >= config.maxFailedAttempts) {
      const newLockoutCount = (record.lockout_count || 0) + 1
      const multiplier = config.progressiveLockout ? Math.pow(2, newLockoutCount - 1) : 1
      const lockoutUntil = new Date(now.getTime() + Math.min(config.lockoutDuration * multiplier, 24 * 60 * 60 * 1000))

      await query(
        `UPDATE user_lockouts
         SET locked_until = $1, lockout_count = $2
         WHERE user_id = $3`,
        [lockoutUntil, newLockoutCount, userId]
      )

      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: lockoutUntil.getTime(),
        retryAfter: Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000),
      }
    }

    // Check if currently locked
    if (record.locked_until && new Date(record.locked_until) > now) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: new Date(record.locked_until).getTime(),
        retryAfter: Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / 1000),
      }
    }

    return {
      locked: false,
      remainingAttempts: config.maxFailedAttempts - record.failed_attempts,
    }
  } catch (error) {
    // If database fails, fall back to in-memory
    logger.error('Database lockout error, falling back to in-memory', { error, userId, ipAddress })
    return recordFailedAttempt(`${userId}:${ipAddress}`)
  }
}

/**
 * Clear lockout from database after successful login
 */
export async function clearLockoutDb(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE user_lockouts
       SET failed_attempts = 0, locked_until = NULL
       WHERE user_id = $1`,
      [userId]
    )
  } catch (error) {
    logger.error('Error clearing lockout from database', { error, userId })
  }
}

// =============================================================================
// Middleware Helper
// =============================================================================

/**
 * Get client IP from request headers
 * Handles proxies and load balancers
 */
export function getClientIp(headers: Headers): string {
  // Check various headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take first IP in chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  return 'unknown'
}

/**
 * Create rate limit key from request
 * Combines IP and optionally email for more granular limiting
 */
export function createRateLimitKey(
  ip: string,
  email?: string,
  type: RateLimitType = 'login'
): string {
  if (email) {
    return `${ip}:${email.toLowerCase()}`
  }
  return ip
}

// =============================================================================
// Redis-backed implementations (optional, multi-instance safe)
// =============================================================================

/**
 * Redis-backed rate limit check (atomic INCR with TTL)
 */
export async function checkRateLimitRedis(identifier: string, type: RateLimitType): Promise<RateLimitResult> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return checkRateLimit(identifier, type)

  const config = AUTH_CONFIG.rateLimit[type]
  const base = `rate:${type}:${identifier}`
  const blockKey = `${base}:block`

  const now = Date.now()
  // If blocked
  const blockTtlMs = await redis.pttl(blockKey)
  if (blockTtlMs > 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + blockTtlMs,
      retryAfter: Math.ceil(blockTtlMs / 1000),
    }
  }

  // Increment attempts within window
  const count = await redis.incr(base)
  if (count === 1) {
    await redis.expire(base, Math.ceil(config.windowMs / 1000))
  }
  const remaining = Math.max(0, config.maxAttempts - count)
  const ttlMs = await redis.pttl(base)

  if (count > config.maxAttempts) {
    if ('blockDuration' in config && (config as any).blockDuration) {
      await redis.set(blockKey, '1', 'EX', Math.ceil((config as any).blockDuration / 1000))
    }
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + Math.max(ttlMs, 0),
      retryAfter: Math.ceil(Math.max(ttlMs, 0) / 1000),
    }
  }

  return {
    allowed: true,
    remaining,
    resetAt: now + Math.max(ttlMs, 0),
  }
}

export async function resetRateLimitRedis(identifier: string, type: RateLimitType): Promise<void> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return resetRateLimit(identifier, type)
  const base = `rate:${type}:${identifier}`
  const blockKey = `${base}:block`
  await redis.del(base)
  await redis.del(blockKey)
}

/**
 * Redis-backed lockout tracking
 */
export async function recordFailedAttemptRedis(identifier: string): Promise<LockoutResult> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return recordFailedAttempt(identifier)

  const config = AUTH_CONFIG.lockout
  const now = Date.now()
  const key = `lockout:${identifier}`

  const raw = await redis.get(key)
  const entry: LockoutEntry = raw ? JSON.parse(raw) : { failedAttempts: 0, lockoutCount: 0, lastAttempt: now }

  // If currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  // Clear lock if expired
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    entry.failedAttempts = 0
    entry.lockedUntil = undefined
  }

  entry.failedAttempts++
  entry.lastAttempt = now

  if (entry.failedAttempts >= config.maxFailedAttempts) {
    entry.lockoutCount++
    const multiplier = config.progressiveLockout ? Math.pow(2, entry.lockoutCount - 1) : 1
    const lockoutDuration = Math.min(config.lockoutDuration * multiplier, 24 * 60 * 60 * 1000)
    entry.lockedUntil = now + lockoutDuration
  }

  await redis.set(key, JSON.stringify(entry))

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, config.maxFailedAttempts - entry.failedAttempts),
  }
}

export async function isAccountLockedRedis(identifier: string): Promise<LockoutResult> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return isAccountLocked(identifier)
  const now = Date.now()
  const raw = await redis.get(`lockout:${identifier}`)
  if (!raw) return { locked: false, remainingAttempts: AUTH_CONFIG.lockout.maxFailedAttempts }
  const entry: LockoutEntry = JSON.parse(raw)
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }
  return { locked: false, remainingAttempts: Math.max(0, AUTH_CONFIG.lockout.maxFailedAttempts - entry.failedAttempts) }
}

export async function resetLockoutRedis(identifier: string): Promise<void> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return resetLockout(identifier)
  await redis.del(`lockout:${identifier}`)
}

export async function clearFailedAttemptsRedis(identifier: string): Promise<void> {
  const redis = ENABLE_REDIS ? await getRedis() : null
  if (!redis) return clearFailedAttempts(identifier)
  await redis.del(`lockout:${identifier}`)
}
