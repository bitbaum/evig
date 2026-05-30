/**
 * Cron: Auto-expire IT-Hilfe requests past their deadline
 *
 * GET /api/cron/close-it-hilfe-requests
 *
 * Transitions every OPEN request with `expires_at < NOW()` to status
 * EXPIRED. Mirrors the cron-secret + telemetry pattern of
 * /api/cron/close-decisions. Bulk UPDATE — no per-row state-machine
 * validation needed; the cron owns this transition end-to-end.
 *
 * Offers attached to an expiring request stay PENDING (matches the
 * existing `request_expires_at` rendering in /it-hilfe/my/offers which
 * already badges them "Abgelaufen" based on the timestamp).
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { itHilfeRequests } from '@/db/schema'
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'

export async function GET(request: NextRequest) {
  // Verify cron secret (skip in dev if not set)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const expired = await db
      .update(itHilfeRequests)
      .set({
        status: REQUEST_STATUS.EXPIRED,
        updatedAt: sql`NOW()`,
      })
      .where(
        and(
          eq(itHilfeRequests.status, REQUEST_STATUS.OPEN),
          isNotNull(itHilfeRequests.expiresAt),
          lt(itHilfeRequests.expiresAt, sql`NOW()`),
        ),
      )
      .returning({ id: itHilfeRequests.id })

    logger.info('Cron: close-it-hilfe-requests completed', {
      expired: expired.length,
    })

    return Response.json({
      success: true,
      expired: expired.length,
    })
  } catch (error) {
    logger.error('Cron: close-it-hilfe-requests failed', { error })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
