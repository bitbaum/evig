/**
 * Security Audit Logging System
 *
 * Provides comprehensive logging for security-relevant events:
 * - Authentication attempts (success/failure)
 * - Password changes
 * - Role changes
 * - Session management
 * - Suspicious activity detection
 */

import { db } from '@/db'
import { authAuditLog } from '@/db/schema'
import { eq, and, inArray, gte, lte, desc, sql, getTableName } from 'drizzle-orm'
import { logger } from '@/lib/logger'

// Table name ref for raw SQL in interval queries
const auditTable = getTableName(authAuditLog)

// =============================================================================
// Types
// =============================================================================

export type AuditEventType =
  // Authentication events
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_expired'
  | 'session_refresh'

  // Registration events
  | 'register_success'
  | 'register_failure'
  | 'email_verification_sent'
  | 'email_verified'

  // Password events
  | 'password_reset_requested'
  | 'password_reset_success'
  | 'password_changed'
  | 'password_change_failed'

  // Account events
  | 'account_locked'
  | 'account_unlocked'
  | 'account_disabled'
  | 'account_enabled'
  | 'role_changed'
  | 'permissions_changed'

  // Security events
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'ip_blocked'
  | 'token_revoked'
  | 'csrf_failure'

  // Admin events
  | 'admin_action'
  | 'user_impersonation_start'
  | 'user_impersonation_end'

  // Compliance events (DSG / GDPR)
  | 'user_deleted'
  | 'data_exported'
  | 'data_export'  // legacy alias used by /api/user/export-data raw INSERT — keep until that route is refactored to use logDataExport()
  | 'content_moderated'

export interface AuditLogEntry {
  id?: string
  event_type: AuditEventType
  user_id: string | null
  email?: string
  ip_address: string
  user_agent: string
  details: Record<string, unknown>
  severity: 'info' | 'warning' | 'critical'
  created_at?: Date
}

// =============================================================================
// In-Memory Buffer for High-Performance Logging
// =============================================================================

const auditBuffer: AuditLogEntry[] = []
const BUFFER_SIZE = 100
const FLUSH_INTERVAL = 5000 // 5 seconds

let flushTimer: NodeJS.Timeout | null = null

/**
 * Start the flush timer
 */
function startFlushTimer(): void {
  if (flushTimer) return

  flushTimer = setInterval(async () => {
    await flushAuditBuffer()
  }, FLUSH_INTERVAL)
}

/**
 * Flush audit buffer to database
 */
async function flushAuditBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return

  const entries = auditBuffer.splice(0, auditBuffer.length)

  try {
    // Batch insert using Drizzle
    await db.insert(authAuditLog).values(
      entries.map(entry => ({
        eventType: entry.event_type,
        userId: entry.user_id,
        ipAddress: entry.ip_address,
        userAgent: entry.user_agent,
        details: entry.details,
        severity: entry.severity,
      }))
    )
  } catch (error) {
    // On error, put entries back in buffer (at the front)
    logger.error('Failed to flush audit log', { error, entryCount: entries.length })
    auditBuffer.unshift(...entries)

    // Log to logger as fallback
    for (const entry of entries) {
      logger.warn('[AUDIT FALLBACK]', { entry })
    }
  }
}

// =============================================================================
// Main Audit Functions
// =============================================================================

/**
 * Log a security event
 * Non-blocking - events are buffered and written asynchronously
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
  auditBuffer.push(entry)

  // Start timer if not running
  startFlushTimer()

  // Flush if buffer is full
  if (auditBuffer.length >= BUFFER_SIZE) {
    flushAuditBuffer().catch((error) => logger.error('Failed to flush audit buffer', { error }))
  }

  // Log critical events immediately
  if (entry.severity === 'critical') {
    logger.warn('[AUDIT CRITICAL]', { entry })
  }
}

/**
 * Log a security event and wait for it to be written
 * Use for critical events that must be persisted before continuing
 */
export async function logAuditEventSync(
  entry: Omit<AuditLogEntry, 'id' | 'created_at'>
): Promise<void> {
  // Mirror critical events to the logger immediately — sync is used for
  // compliance-critical writes (super-admin grants, user deletions, data
  // exports). If the DB write fails we still want a log trail.
  if (entry.severity === 'critical') {
    logger.warn('[AUDIT CRITICAL]', { entry })
  }

  try {
    await db.insert(authAuditLog).values({
      eventType: entry.event_type,
      userId: entry.user_id,
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      details: entry.details,
      severity: entry.severity,
    })
  } catch (error) {
    logger.error('Failed to write audit log', { error, entry })
    // Log to logger as fallback
    logger.warn('[AUDIT FALLBACK]', { entry })
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

interface AuditContext {
  userId?: string | null
  email?: string
  ipAddress: string
  userAgent: string
}

/**
 * Log successful login
 */
export function logLoginSuccess(ctx: AuditContext): void {
  logAuditEvent({
    event_type: 'login_success',
    user_id: ctx.userId || null,
    email: ctx.email,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { email: ctx.email },
    severity: 'info',
  })
}

/**
 * Log failed login attempt
 */
export function logLoginFailure(ctx: AuditContext, reason: string): void {
  logAuditEvent({
    event_type: 'login_failure',
    user_id: ctx.userId || null,
    email: ctx.email,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { email: ctx.email, reason },
    severity: 'warning',
  })
}

/**
 * Log logout
 */
export function logLogout(ctx: AuditContext): void {
  logAuditEvent({
    event_type: 'logout',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: {},
    severity: 'info',
  })
}

/**
 * Log successful registration
 */
export function logRegistration(ctx: AuditContext): void {
  logAuditEvent({
    event_type: 'register_success',
    user_id: ctx.userId || null,
    email: ctx.email,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { email: ctx.email },
    severity: 'info',
  })
}

/**
 * Log password change
 */
export function logPasswordChange(ctx: AuditContext, method: 'reset' | 'change'): void {
  logAuditEvent({
    event_type: method === 'reset' ? 'password_reset_success' : 'password_changed',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { method },
    severity: 'info',
  })
}

/**
 * Log account lockout
 */
export function logAccountLocked(ctx: AuditContext, duration: number): void {
  logAuditEvent({
    event_type: 'account_locked',
    user_id: ctx.userId || null,
    email: ctx.email,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { email: ctx.email, duration_ms: duration },
    severity: 'warning',
  })
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  ctx: AuditContext,
  limitType: string,
  limit: number
): void {
  logAuditEvent({
    event_type: 'rate_limit_exceeded',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { limitType, limit },
    severity: 'warning',
  })
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  ctx: AuditContext,
  description: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    event_type: 'suspicious_activity',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { description, ...details },
    severity: 'critical',
  })
}

/**
 * Log role change
 */
export function logRoleChange(
  ctx: AuditContext,
  targetUserId: string,
  oldRole: string,
  newRole: string
): void {
  logAuditEvent({
    event_type: 'role_changed',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { targetUserId, oldRole, newRole },
    severity: 'warning',
  })
}

/**
 * Log admin action
 */
export function logAdminAction(
  ctx: AuditContext,
  action: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    event_type: 'admin_action',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { action, ...details },
    severity: 'info',
  })
}

/**
 * Log permissions change.
 *
 * Returns a promise resolving when the audit row is committed. Callers
 * that must guarantee the log is durable before the response goes back
 * (permission grants/revocations, super-admin changes) should await this.
 * Buffered fast-path remains available via logAuditEvent for non-critical
 * paths.
 */
export async function logPermissionsChange(
  ctx: AuditContext,
  targetUserId: string,
  targetEmail: string,
  oldPermissions: string[],
  newPermissions: string[]
): Promise<void> {
  await logAuditEventSync({
    event_type: 'permissions_changed',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: {
      targetUserId,
      targetEmail,
      oldPermissions,
      newPermissions,
      added: newPermissions.filter(p => !oldPermissions.includes(p)),
      removed: oldPermissions.filter(p => !newPermissions.includes(p)),
    },
    severity: 'warning',
  })
}

/**
 * Log a user-account deletion. Sync write — compliance-critical (DSG / GDPR
 * Art. 17 right-to-erasure proof).
 */
export async function logUserDeletion(
  ctx: AuditContext,
  targetUserId: string,
  targetEmail: string,
  reason: 'admin_delete' | 'self_delete' | 'gdpr_request',
): Promise<void> {
  await logAuditEventSync({
    event_type: 'user_deleted',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { targetUserId, targetEmail, reason },
    severity: 'critical',
  })
}

/**
 * Log a data-export request (GDPR/DSG portability). Records who requested
 * what — both for proving compliance and detecting abuse (mass-exfiltration).
 */
export async function logDataExport(
  ctx: AuditContext,
  targetUserId: string,
  exportType: 'self' | 'admin' | 'gdpr_request',
  bytesExported?: number,
): Promise<void> {
  await logAuditEventSync({
    event_type: 'data_exported',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { targetUserId, exportType, bytesExported },
    severity: 'warning',
  })
}

/**
 * Log a content-moderation decision (approve / reject of user-submitted
 * blog posts, listings, workshops, etc.). Async / buffered — not
 * security-critical, just need-to-have for moderation audit.
 */
export function logContentDecision(
  ctx: AuditContext,
  contentType: string,
  contentId: string,
  decision: 'approved' | 'rejected' | 'edited',
  note?: string,
): void {
  logAuditEvent({
    event_type: 'content_moderated',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: { contentType, contentId, decision, note },
    severity: 'info',
  })
}

/**
 * Log super admin status change. Sync write — super-admin grants/revokes
 * are compliance-critical and must not be lost in a buffer.
 */
export async function logSuperAdminChange(
  ctx: AuditContext,
  targetUserId: string,
  targetEmail: string,
  newStatus: boolean
): Promise<void> {
  await logAuditEventSync({
    event_type: 'role_changed',
    user_id: ctx.userId || null,
    ip_address: ctx.ipAddress,
    user_agent: ctx.userAgent,
    details: {
      targetUserId,
      targetEmail,
      action: newStatus ? 'grant_super_admin' : 'revoke_super_admin',
      newSuperAdminStatus: newStatus,
    },
    severity: 'critical', // Super admin changes are critical
  })
}

// =============================================================================
// Query Functions
// =============================================================================

interface AuditQueryOptions {
  userId?: string
  eventType?: AuditEventType | AuditEventType[]
  severity?: 'info' | 'warning' | 'critical'
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(
  options: AuditQueryOptions = {}
): Promise<AuditLogEntry[]> {
  const conditions = []

  if (options.userId) {
    conditions.push(eq(authAuditLog.userId, options.userId))
  }

  if (options.eventType) {
    if (Array.isArray(options.eventType)) {
      conditions.push(inArray(authAuditLog.eventType, options.eventType))
    } else {
      conditions.push(eq(authAuditLog.eventType, options.eventType))
    }
  }

  if (options.severity) {
    conditions.push(eq(authAuditLog.severity, options.severity))
  }

  if (options.ipAddress) {
    conditions.push(eq(authAuditLog.ipAddress, options.ipAddress))
  }

  if (options.startDate) {
    conditions.push(gte(authAuditLog.createdAt, options.startDate.toISOString()))
  }

  if (options.endDate) {
    conditions.push(lte(authAuditLog.createdAt, options.endDate.toISOString()))
  }

  const limitVal = options.limit || 100
  const offsetVal = options.offset || 0

  const rows = await db
    .select()
    .from(authAuditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(authAuditLog.createdAt))
    .limit(limitVal)
    .offset(offsetVal)

  return rows.map(row => ({
    id: row.id,
    event_type: row.eventType as AuditEventType,
    user_id: row.userId,
    ip_address: row.ipAddress,
    user_agent: row.userAgent ?? '',
    details: (row.details ?? {}) as Record<string, unknown>,
    severity: row.severity as 'info' | 'warning' | 'critical',
    created_at: row.createdAt ? new Date(row.createdAt) : undefined,
  }))
}

/**
 * Get recent suspicious activity for an IP
 */
export async function getRecentSuspiciousActivity(
  ipAddress: string,
  hours: number = 24
): Promise<AuditLogEntry[]> {
  // Validate hours to prevent abuse (1-168 hours = 1 week max)
  const safeHours = Math.max(1, Math.min(168, Math.floor(hours)))
  const result = await db.execute<{
    id: string
    event_type: string
    user_id: string | null
    ip_address: string
    user_agent: string | null
    details: Record<string, unknown>
    severity: string
    created_at: string
  }>(sql`
    SELECT * FROM ${sql.raw(auditTable)}
    WHERE ip_address = ${ipAddress}
      AND severity IN ('warning', 'critical')
      AND created_at > NOW() - INTERVAL '1 hour' * ${safeHours}
    ORDER BY created_at DESC
    LIMIT 100
  `)
  return result.rows.map(row => ({
    id: row.id,
    event_type: row.event_type as AuditEventType,
    user_id: row.user_id,
    ip_address: row.ip_address,
    user_agent: row.user_agent ?? '',
    details: (row.details ?? {}) as Record<string, unknown>,
    severity: row.severity as 'info' | 'warning' | 'critical',
    created_at: row.created_at ? new Date(row.created_at) : undefined,
  }))
}

/**
 * Get failed login attempts for a user
 */
export async function getFailedLoginAttempts(
  userId: string,
  hours: number = 24
): Promise<number> {
  // Validate hours to prevent abuse (1-168 hours = 1 week max)
  const safeHours = Math.max(1, Math.min(168, Math.floor(hours)))
  const result = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*) as count FROM ${sql.raw(auditTable)}
    WHERE user_id = ${userId}
      AND event_type = 'login_failure'
      AND created_at > NOW() - INTERVAL '1 hour' * ${safeHours}
  `)
  return parseInt(result.rows[0]?.count || '0', 10)
}

// =============================================================================
// Cleanup on process exit
// =============================================================================

process.on('beforeExit', async () => {
  if (flushTimer) {
    clearInterval(flushTimer)
  }
  await flushAuditBuffer()
})
