/**
 * Account lockout after repeated failed logins.
 *
 * Lockouts are persisted in user_lockouts via the DB helpers below; the
 * in-memory helpers are the fallback when the DB is unavailable while
 * recording a failed login, and the unit under test.
 *
 * Request rate limiting used to live in this file too (as rate-limiter.ts);
 * it moved to lib/security/rate-limit.ts on 2026-09-14 when both hand-rolled
 * limiters were replaced by limitkit. Lockout is not rate limiting: it is a
 * per-account, progressively longer, DB-backed state that a login must clear.
 */

import { AUTH_CONFIG } from './config';
import { db } from '@/db';
import { userLockouts } from '@/db/schema';
import { eq, sql, getTableName } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { RATE_LIMIT_LOCKOUT_CAP_MS } from '@/config/security';

// Table name ref for raw SQL in complex upsert
const lockoutsTable = getTableName(userLockouts);

// =============================================================================
// Types
// =============================================================================

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil?: number;
  lockoutCount: number; // For progressive lockout
  lastAttempt: number;
}

// =============================================================================
// In-Memory Storage (for single-instance deployments)
// =============================================================================

const lockoutStore = new Map<string, LockoutEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of lockoutStore.entries()) {
    // Keep lockout history for 24 hours
    if (entry.lastAttempt < now - RATE_LIMIT_LOCKOUT_CAP_MS) {
      lockoutStore.delete(key);
    }
  }
}, 60 * 1000); // Run every minute

// =============================================================================
// Account Lockout Functions
// =============================================================================

interface LockoutResult {
  locked: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
  retryAfter?: number;
}

/**
 * Record a failed login attempt
 * @param identifier - User email or ID
 * @returns Lockout status after recording the attempt
 */
export function recordFailedAttempt(identifier: string): LockoutResult {
  // In-memory fallback (single instance). For multi-instance, use DB or Redis versions below.
  const config = AUTH_CONFIG.lockout;
  const now = Date.now();
  const key = `lockout:${identifier}`;

  let entry = lockoutStore.get(key) || {
    failedAttempts: 0,
    lockoutCount: 0,
    lastAttempt: now,
  };

  // Check if currently locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // Clear lockout if expired
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    // Keep lockout count for progressive lockout
    entry.failedAttempts = 0;
    entry.lockedUntil = undefined;
  }

  // Increment failed attempts
  entry.failedAttempts++;
  entry.lastAttempt = now;

  // Check if should lock
  if (entry.failedAttempts >= config.maxFailedAttempts) {
    entry.lockoutCount++;

    // Progressive lockout: double duration each time
    const multiplier = config.progressiveLockout ? Math.pow(2, entry.lockoutCount - 1) : 1;
    const lockoutDuration = config.lockoutDuration * multiplier;

    // Cap at 24 hours
    entry.lockedUntil = now + Math.min(lockoutDuration, RATE_LIMIT_LOCKOUT_CAP_MS);

    lockoutStore.set(key, entry);

    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  lockoutStore.set(key, entry);

  return {
    locked: false,
    remainingAttempts: config.maxFailedAttempts - entry.failedAttempts,
  };
}

/**
 * Check if an account is locked
 */
export function isAccountLocked(identifier: string): LockoutResult {
  const now = Date.now();
  const key = `lockout:${identifier}`;
  const entry = lockoutStore.get(key);

  if (!entry) {
    return {
      locked: false,
      remainingAttempts: AUTH_CONFIG.lockout.maxFailedAttempts,
    };
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, AUTH_CONFIG.lockout.maxFailedAttempts - entry.failedAttempts),
  };
}

/**
 * Reset account lockout (e.g., after successful login)
 */
export function resetLockout(identifier: string): void {
  const key = `lockout:${identifier}`;
  lockoutStore.delete(key);
}

/**
 * Clear all failed attempts for an account
 * Use after successful password reset
 */
export function clearFailedAttempts(identifier: string): void {
  const key = `lockout:${identifier}`;
  const entry = lockoutStore.get(key);
  if (entry) {
    entry.failedAttempts = 0;
    entry.lockedUntil = undefined;
    lockoutStore.set(key, entry);
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
  ipAddress: string,
): Promise<LockoutResult> {
  const config = AUTH_CONFIG.lockout;
  const now = new Date();

  try {
    // Get or create lockout record (complex upsert with CASE expressions)
    const result = await db.execute<{
      failed_attempts: number;
      locked_until: string | null;
      lockout_count: number;
    }>(sql`
      INSERT INTO ${sql.raw(lockoutsTable)} (user_id, ip_address, failed_attempts, last_attempt)
      VALUES (${userId}, ${ipAddress}, 1, ${now.toISOString()})
      ON CONFLICT (user_id)
      DO UPDATE SET
        failed_attempts = CASE
          WHEN ${sql.raw(lockoutsTable)}.locked_until < ${now.toISOString()} THEN 1
          ELSE ${sql.raw(lockoutsTable)}.failed_attempts + 1
        END,
        last_attempt = ${now.toISOString()},
        locked_until = CASE
          WHEN ${sql.raw(lockoutsTable)}.locked_until < ${now.toISOString()} THEN NULL
          ELSE ${sql.raw(lockoutsTable)}.locked_until
        END
      RETURNING failed_attempts, locked_until, lockout_count
    `);

    const record = result.rows[0];

    // Check if should lock
    if (record.failed_attempts >= config.maxFailedAttempts) {
      const newLockoutCount = (record.lockout_count || 0) + 1;
      const multiplier = config.progressiveLockout ? Math.pow(2, newLockoutCount - 1) : 1;
      const lockoutUntil = new Date(
        now.getTime() + Math.min(config.lockoutDuration * multiplier, RATE_LIMIT_LOCKOUT_CAP_MS),
      );

      await db
        .update(userLockouts)
        .set({
          lockedUntil: lockoutUntil.toISOString(),
          lockoutCount: newLockoutCount,
        })
        .where(eq(userLockouts.userId, userId));

      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: lockoutUntil.getTime(),
        retryAfter: Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000),
      };
    }

    // Check if currently locked
    if (record.locked_until && new Date(record.locked_until) > now) {
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil: new Date(record.locked_until).getTime(),
        retryAfter: Math.ceil((new Date(record.locked_until).getTime() - now.getTime()) / 1000),
      };
    }

    return {
      locked: false,
      remainingAttempts: config.maxFailedAttempts - record.failed_attempts,
    };
  } catch (error) {
    // If database fails, fall back to in-memory
    logger.error('Database lockout error, falling back to in-memory', { error, userId, ipAddress });
    return recordFailedAttempt(`${userId}:${ipAddress}`);
  }
}

/**
 * Check persistent account lockout state before password validation.
 */
export async function isAccountLockedDb(userId: string): Promise<LockoutResult> {
  const config = AUTH_CONFIG.lockout;
  const now = new Date();

  try {
    const rows = await db
      .select({
        failedAttempts: userLockouts.failedAttempts,
        lockedUntil: userLockouts.lockedUntil,
      })
      .from(userLockouts)
      .where(eq(userLockouts.userId, userId))
      .limit(1);

    const record = rows[0];
    if (!record) {
      return { locked: false, remainingAttempts: config.maxFailedAttempts };
    }

    if (record.lockedUntil && new Date(record.lockedUntil) > now) {
      const lockedUntil = new Date(record.lockedUntil).getTime();
      return {
        locked: true,
        remainingAttempts: 0,
        lockedUntil,
        retryAfter: Math.ceil((lockedUntil - now.getTime()) / 1000),
      };
    }

    return {
      locked: false,
      remainingAttempts: Math.max(0, config.maxFailedAttempts - record.failedAttempts),
    };
  } catch (error) {
    logger.error('Database lockout read error, falling back to in-memory', { error, userId });
    return isAccountLocked(`${userId}:login`);
  }
}

/**
 * Clear lockout from database after successful login
 */
export async function clearLockoutDb(userId: string): Promise<void> {
  try {
    await db
      .update(userLockouts)
      .set({
        failedAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(userLockouts.userId, userId));
  } catch (error) {
    logger.error('Error clearing lockout from database', { error, userId });
  }
}
