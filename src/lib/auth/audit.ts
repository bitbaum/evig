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

import { query } from './db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'

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
    // Batch insert for performance
    const values = entries.map((entry, i) => {
      const offset = i * 7
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
    }).join(', ')

    const params = entries.flatMap(entry => [
      entry.event_type,
      entry.user_id,
      entry.ip_address,
      entry.user_agent,
      JSON.stringify(entry.details),
      entry.severity,
      new Date(),
    ])

    await query(
      `INSERT INTO ${TABLE_NAMES.AUTH_AUDIT_LOG} (event_type, user_id, ip_address, user_agent, details, severity, created_at)
       VALUES ${values}`,
      params
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
  try {
    await query(
      `INSERT INTO ${TABLE_NAMES.AUTH_AUDIT_LOG} (event_type, user_id, ip_address, user_agent, details, severity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        entry.event_type,
        entry.user_id,
        entry.ip_address,
        entry.user_agent,
        JSON.stringify(entry.details),
        entry.severity,
      ]
    )
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
 * Log permissions change
 */
export function logPermissionsChange(
  ctx: AuditContext,
  targetUserId: string,
  targetEmail: string,
  oldPermissions: string[],
  newPermissions: string[]
): void {
  logAuditEvent({
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
 * Log super admin status change
 */
export function logSuperAdminChange(
  ctx: AuditContext,
  targetUserId: string,
  targetEmail: string,
  newStatus: boolean
): void {
  logAuditEvent({
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
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (options.userId) {
    conditions.push(`user_id = $${paramIndex++}`)
    params.push(options.userId)
  }

  if (options.eventType) {
    if (Array.isArray(options.eventType)) {
      conditions.push(`event_type = ANY($${paramIndex++})`)
      params.push(options.eventType)
    } else {
      conditions.push(`event_type = $${paramIndex++}`)
      params.push(options.eventType)
    }
  }

  if (options.severity) {
    conditions.push(`severity = $${paramIndex++}`)
    params.push(options.severity)
  }

  if (options.ipAddress) {
    conditions.push(`ip_address = $${paramIndex++}`)
    params.push(options.ipAddress)
  }

  if (options.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`)
    params.push(options.startDate)
  }

  if (options.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`)
    params.push(options.endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = options.limit || 100
  const offset = options.offset || 0

  const result = await query<AuditLogEntry>(
    `SELECT * FROM ${TABLE_NAMES.AUTH_AUDIT_LOG}
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  )

  return result.rows
}

/**
 * Get recent suspicious activity for an IP
 */
export async function getRecentSuspiciousActivity(
  ipAddress: string,
  hours: number = 24
): Promise<AuditLogEntry[]> {
  // Validate hours to prevent SQL injection (1-168 hours = 1 week max)
  const safeHours = Math.max(1, Math.min(168, Math.floor(hours)))
  const result = await query<AuditLogEntry>(
    `SELECT * FROM ${TABLE_NAMES.AUTH_AUDIT_LOG}
     WHERE ip_address = $1
       AND severity IN ('warning', 'critical')
       AND created_at > NOW() - INTERVAL '1 hour' * $2
     ORDER BY created_at DESC
     LIMIT 100`,
    [ipAddress, safeHours]
  )
  return result.rows
}

/**
 * Get failed login attempts for a user
 */
export async function getFailedLoginAttempts(
  userId: string,
  hours: number = 24
): Promise<number> {
  // Validate hours to prevent SQL injection (1-168 hours = 1 week max)
  const safeHours = Math.max(1, Math.min(168, Math.floor(hours)))
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.AUTH_AUDIT_LOG}
     WHERE user_id = $1
       AND event_type = 'login_failure'
       AND created_at > NOW() - INTERVAL '1 hour' * $2`,
    [userId, safeHours]
  )
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
