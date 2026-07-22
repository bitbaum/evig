/**
 * Cron — prune `auth_audit_log` entries older than 180 days.
 *
 * Audit-log retention policy: 180 days is the default. Critical events
 * (super-admin changes, user deletions) get severity=critical and are
 * preserved indefinitely — the WHERE filter excludes them.
 *
 * Triggered daily at 02:00 UTC by a systemd timer on the self-hosted box
 * (revampit-cron@prune-audit-log.timer → scripts/ops/run-cron.sh).
 * Protected by CRON_SECRET (Authorization: Bearer ...) — external callers
 * without the secret get 401.
 *
 * Idempotent — running twice in the same window is a no-op.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { authAuditLog } from '@/db/schema'
import { and, lt, ne, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

const RETENTION_DAYS = 180

export async function GET(request: NextRequest) {
  // Authenticate via CRON_SECRET (Authorization: Bearer ...). When CRON_SECRET
  // is unset (local dev), the check is skipped — matches the other cron routes
  // and scripts/ops/run-cron.sh. Reject anything else to avoid arbitrary
  // external triggers.
  const cronSecret = process.env.CRON_SECRET
  const authorized =
    !cronSecret ||
    request.headers.get('authorization') === `Bearer ${cronSecret}`

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await db
      .delete(authAuditLog)
      .where(
        and(
          lt(authAuditLog.createdAt, sql`NOW() - INTERVAL '${sql.raw(String(RETENTION_DAYS))} days'`),
          // Preserve critical events forever — super-admin changes, deletions,
          // any future compliance event we flag as severity='critical'.
          ne(authAuditLog.severity, 'critical'),
        ),
      )
      .returning({ id: authAuditLog.id })

    logger.info('Audit log pruned', {
      retentionDays: RETENTION_DAYS,
      rowsDeleted: result.length,
    })

    return NextResponse.json({
      success: true,
      pruned: result.length,
      retentionDays: RETENTION_DAYS,
    })
  } catch (error) {
    logger.error('Audit log prune failed', { error })
    return NextResponse.json(
      { error: 'prune_failed', detail: error instanceof Error ? error.message : 'unknown' },
      { status: 500 },
    )
  }
}
