/**
 * Tests for the security audit logger (lib/auth/audit.ts).
 *
 * Mission-critical: this is the security audit trail. The convenience
 * functions (logLoginSuccess, logSuspiciousActivity, logSuperAdminChange,
 * etc.) each shape an AuditLogEntry with the right event_type + severity
 * and feed it through the buffered writer.
 *
 * Buffer behavior (from logAuditEvent):
 *   - non-critical entries → pushed to in-memory buffer, flushed every 5s
 *     OR when the buffer reaches 100 entries
 *   - critical entries → buffered AND immediately mirrored to logger.warn
 *     (so we don't lose them if the process dies before the flush tick)
 *
 * Each test resets modules so the buffer starts empty.
 */

jest.mock('@/db', () => ({
  db: { insert: jest.fn() },
}))

jest.mock('@/db/schema', () => ({
  authAuditLog: { _: 'authAuditLog' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  desc: jest.fn(),
  sql: Object.assign(jest.fn(), { raw: jest.fn() }),
  getTableName: jest.fn(() => 'auth_audit_log'),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const FLUSH_INTERVAL_MS = 5000

const ctx = {
  userId: 'user-1',
  email: 'a@b.ch',
  ipAddress: '127.0.0.1',
  userAgent: 'jest-runner',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface AuditTestModule {
  logAuditEvent: typeof import('../audit').logAuditEvent
  logAuditEventSync: typeof import('../audit').logAuditEventSync
  logLoginSuccess: typeof import('../audit').logLoginSuccess
  logLoginFailure: typeof import('../audit').logLoginFailure
  logLogout: typeof import('../audit').logLogout
  logRegistration: typeof import('../audit').logRegistration
  logPasswordChange: typeof import('../audit').logPasswordChange
  logAccountLocked: typeof import('../audit').logAccountLocked
  logRateLimitExceeded: typeof import('../audit').logRateLimitExceeded
  logSuspiciousActivity: typeof import('../audit').logSuspiciousActivity
  logRoleChange: typeof import('../audit').logRoleChange
  logAdminAction: typeof import('../audit').logAdminAction
  logPermissionsChange: typeof import('../audit').logPermissionsChange
  logSuperAdminChange: typeof import('../audit').logSuperAdminChange
}

let audit: AuditTestModule
let valuesSpy: jest.Mock
let loggerWarn: jest.Mock

beforeEach(() => {
  jest.useFakeTimers()
  jest.resetModules()

  // Re-establish mocks after resetModules (factories re-run on next require)
  jest.doMock('@/db', () => {
    valuesSpy = jest.fn().mockResolvedValue([])
    return {
      db: { insert: jest.fn(() => ({ values: valuesSpy })) },
    }
  })

  audit = require('../audit') as AuditTestModule
  loggerWarn = (jest.requireMock('@/lib/logger').logger.warn as jest.Mock)
  loggerWarn.mockClear()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

/** Advance past the flush interval and drain the resulting promise tick. */
async function flush(): Promise<void> {
  jest.advanceTimersByTime(FLUSH_INTERVAL_MS)
  // Wait for the async flushAuditBuffer to resolve
  await Promise.resolve()
  await Promise.resolve()
}

/** Get the last entry from the most recent batch insert. */
function lastFlushedEntry(): Record<string, unknown> {
  expect(valuesSpy).toHaveBeenCalled()
  const lastCall = valuesSpy.mock.calls[valuesSpy.mock.calls.length - 1][0]
  return lastCall[lastCall.length - 1]
}

// ============================================================================
// logAuditEvent — buffer behavior
// ============================================================================

describe('logAuditEvent', () => {
  it('buffers non-critical entries and flushes after FLUSH_INTERVAL', async () => {
    audit.logAuditEvent({
      event_type: 'login_success',
      user_id: 'u1',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: { email: 'a@b.ch' },
      severity: 'info',
    })

    expect(valuesSpy).not.toHaveBeenCalled()
    await flush()
    expect(valuesSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT mirror non-critical events to logger.warn immediately', () => {
    audit.logAuditEvent({
      event_type: 'login_success',
      user_id: 'u1',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: {},
      severity: 'info',
    })
    expect(loggerWarn).not.toHaveBeenCalled()
  })

  it('mirrors critical events to logger.warn IMMEDIATELY (before flush)', () => {
    audit.logAuditEvent({
      event_type: 'suspicious_activity',
      user_id: 'u1',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: { description: 'something is wrong' },
      severity: 'critical',
    })
    expect(loggerWarn).toHaveBeenCalledWith('[AUDIT CRITICAL]', expect.objectContaining({
      entry: expect.objectContaining({ severity: 'critical' }),
    }))
  })

  it('translates AuditLogEntry snake_case fields to Drizzle camelCase on flush', async () => {
    audit.logAuditEvent({
      event_type: 'login_success',
      user_id: 'u1',
      ip_address: '10.0.0.1',
      user_agent: 'browser',
      details: { foo: 'bar' },
      severity: 'info',
    })
    await flush()

    expect(lastFlushedEntry()).toEqual({
      eventType: 'login_success',
      userId: 'u1',
      ipAddress: '10.0.0.1',
      userAgent: 'browser',
      details: { foo: 'bar' },
      severity: 'info',
    })
  })

  it('a single flush batches all buffered entries together', async () => {
    audit.logAuditEvent({ event_type: 'login_success', user_id: 'a', ip_address: '1.1.1.1', user_agent: 'x', details: {}, severity: 'info' })
    audit.logAuditEvent({ event_type: 'logout', user_id: 'b', ip_address: '2.2.2.2', user_agent: 'y', details: {}, severity: 'info' })
    audit.logAuditEvent({ event_type: 'register_success', user_id: 'c', ip_address: '3.3.3.3', user_agent: 'z', details: {}, severity: 'info' })
    await flush()

    expect(valuesSpy).toHaveBeenCalledTimes(1)
    expect(valuesSpy.mock.calls[0][0]).toHaveLength(3)
  })
})

// ============================================================================
// logAuditEventSync — direct (non-buffered) write
// ============================================================================

describe('logAuditEventSync', () => {
  it('inserts immediately without going through the buffer', async () => {
    await audit.logAuditEventSync({
      event_type: 'password_changed',
      user_id: 'u1',
      ip_address: '127.0.0.1',
      user_agent: 'jest',
      details: { method: 'reset' },
      severity: 'info',
    })

    expect(valuesSpy).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'password_changed',
      userId: 'u1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      details: { method: 'reset' },
      severity: 'info',
    }))
  })
})

// ============================================================================
// Convenience functions — verify event_type + severity contract
// ============================================================================

describe('logLoginSuccess', () => {
  it('writes event_type=login_success severity=info with email in details', async () => {
    audit.logLoginSuccess(ctx)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'login_success',
      severity: 'info',
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'jest-runner',
      details: { email: 'a@b.ch' },
    })
  })

  it('userId=null when ctx.userId is missing', async () => {
    audit.logLoginSuccess({ ipAddress: '1.1.1.1', userAgent: 'x' })
    await flush()
    expect(lastFlushedEntry()).toMatchObject({ userId: null })
  })
})

describe('logLoginFailure', () => {
  it('writes event_type=login_failure severity=warning with reason in details', async () => {
    audit.logLoginFailure(ctx, 'wrong_password')
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'login_failure',
      severity: 'warning',
      details: { email: 'a@b.ch', reason: 'wrong_password' },
    })
  })
})

describe('logLogout', () => {
  it('writes event_type=logout severity=info with empty details', async () => {
    audit.logLogout(ctx)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'logout',
      severity: 'info',
      details: {},
    })
  })
})

describe('logRegistration', () => {
  it('writes event_type=register_success severity=info with email', async () => {
    audit.logRegistration(ctx)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'register_success',
      severity: 'info',
      details: { email: 'a@b.ch' },
    })
  })
})

describe('logPasswordChange', () => {
  it('method="reset" → password_reset_success', async () => {
    audit.logPasswordChange(ctx, 'reset')
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'password_reset_success',
      severity: 'info',
      details: { method: 'reset' },
    })
  })

  it('method="change" → password_changed', async () => {
    audit.logPasswordChange(ctx, 'change')
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'password_changed',
      severity: 'info',
      details: { method: 'change' },
    })
  })
})

describe('logAccountLocked', () => {
  it('writes event_type=account_locked severity=warning with duration in ms', async () => {
    audit.logAccountLocked(ctx, 60000)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'account_locked',
      severity: 'warning',
      details: { email: 'a@b.ch', duration_ms: 60000 },
    })
  })
})

describe('logRateLimitExceeded', () => {
  it('writes event_type=rate_limit_exceeded severity=warning with limit metadata', async () => {
    audit.logRateLimitExceeded(ctx, 'login', 5)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'rate_limit_exceeded',
      severity: 'warning',
      details: { limitType: 'login', limit: 5 },
    })
  })
})

// ─── Critical-severity events ────────────────────────────────────────────────

describe('logSuspiciousActivity', () => {
  it('writes event_type=suspicious_activity severity=CRITICAL', async () => {
    audit.logSuspiciousActivity(ctx, 'multiple failed logins from new IP')
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'suspicious_activity',
      severity: 'critical',
      details: { description: 'multiple failed logins from new IP' },
    })
  })

  it('mirrors to logger.warn immediately (critical → no waiting for flush)', () => {
    audit.logSuspiciousActivity(ctx, 'CSRF token mismatch')
    expect(loggerWarn).toHaveBeenCalledWith('[AUDIT CRITICAL]', expect.objectContaining({
      entry: expect.objectContaining({
        event_type: 'suspicious_activity',
        severity: 'critical',
      }),
    }))
  })

  it('merges optional details into the description', async () => {
    audit.logSuspiciousActivity(ctx, 'unusual pattern', { route: '/admin', count: 12 })
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      details: { description: 'unusual pattern', route: '/admin', count: 12 },
    })
  })
})

describe('logRoleChange', () => {
  it('writes event_type=role_changed severity=warning with old/new role + targetUserId', async () => {
    audit.logRoleChange(ctx, 'target-1', 'user', 'admin')
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'role_changed',
      severity: 'warning',
      details: { targetUserId: 'target-1', oldRole: 'user', newRole: 'admin' },
    })
  })
})

describe('logAdminAction', () => {
  it('writes event_type=admin_action severity=info with action + spread details', async () => {
    audit.logAdminAction(ctx, 'delete_user', { targetId: 't1' })
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'admin_action',
      severity: 'info',
      details: { action: 'delete_user', targetId: 't1' },
    })
  })

  it('details spread does NOT lose the action key', async () => {
    // Edge: caller-supplied 'action' in details would clobber if order is wrong
    audit.logAdminAction(ctx, 'create_user', { other: 'value' })
    await flush()
    const last = lastFlushedEntry()
    expect(last.details).toMatchObject({ action: 'create_user', other: 'value' })
  })
})

describe('logPermissionsChange', () => {
  it('writes added + removed diff between old and new permissions', async () => {
    audit.logPermissionsChange(
      ctx,
      'target-1',
      'target@b.ch',
      ['products', 'workshops'],         // old
      ['products', 'users', 'finances'], // new
    )
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'permissions_changed',
      severity: 'warning',
      details: {
        targetUserId: 'target-1',
        targetEmail: 'target@b.ch',
        oldPermissions: ['products', 'workshops'],
        newPermissions: ['products', 'users', 'finances'],
        added: ['users', 'finances'],
        removed: ['workshops'],
      },
    })
  })

  it('empty added/removed when permissions are identical', async () => {
    audit.logPermissionsChange(ctx, 't1', 't@b.ch', ['products'], ['products'])
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      details: { added: [], removed: [] },
    })
  })

  it('handles empty old → all newPermissions are "added"', async () => {
    audit.logPermissionsChange(ctx, 't1', 't@b.ch', [], ['products', 'users'])
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      details: { added: ['products', 'users'], removed: [] },
    })
  })

  it('handles empty new → all oldPermissions are "removed"', async () => {
    audit.logPermissionsChange(ctx, 't1', 't@b.ch', ['products', 'users'], [])
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      details: { added: [], removed: ['products', 'users'] },
    })
  })
})

describe('logSuperAdminChange', () => {
  it('grant → severity=critical, action=grant_super_admin, newSuperAdminStatus=true', async () => {
    audit.logSuperAdminChange(ctx, 'target-1', 'target@b.ch', true)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      eventType: 'role_changed',
      severity: 'critical',
      details: {
        targetUserId: 'target-1',
        targetEmail: 'target@b.ch',
        action: 'grant_super_admin',
        newSuperAdminStatus: true,
      },
    })
  })

  it('revoke → severity=critical, action=revoke_super_admin, newSuperAdminStatus=false', async () => {
    audit.logSuperAdminChange(ctx, 'target-1', 'target@b.ch', false)
    await flush()
    expect(lastFlushedEntry()).toMatchObject({
      severity: 'critical',
      details: {
        action: 'revoke_super_admin',
        newSuperAdminStatus: false,
      },
    })
  })

  it('super-admin changes mirror to logger.warn immediately (critical)', () => {
    // Privilege escalation must be logged eagerly — if the process dies
    // before the 5s flush, the audit trail still has it
    audit.logSuperAdminChange(ctx, 'target-1', 'target@b.ch', true)
    expect(loggerWarn).toHaveBeenCalledWith('[AUDIT CRITICAL]', expect.anything())
  })
})
