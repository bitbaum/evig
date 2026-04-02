/**
 * Cron: Auto-close decisions past their voting deadline
 *
 * GET /api/cron/close-decisions
 *
 * Checks for decisions in 'voting' status with a voting_deadline in the past,
 * and transitions them to 'closed'. Protected by CRON_SECRET.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { decisions } from '@/db/schema'
import { and, eq, lt, isNotNull, sql } from 'drizzle-orm'
import { transitionDecision } from '@/lib/services/decisions'
import { notifyAllStaff } from '@/lib/services/notifications'
import { logger } from '@/lib/logger'

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
    // Find decisions past their voting deadline
    const expiredDecisions = await db
      .select({
        id: decisions.id,
        title: decisions.title,
        createdBy: decisions.createdBy,
      })
      .from(decisions)
      .where(
        and(
          eq(decisions.status, 'voting'),
          isNotNull(decisions.votingDeadline),
          lt(decisions.votingDeadline, sql`NOW()`)
        )
      )

    let closed = 0
    const errors: string[] = []

    for (const decision of expiredDecisions) {
      try {
        const result = await transitionDecision(
          decision.id,
          'closed',
          decision.createdBy,
          { outcomeSummary: 'Automatisch geschlossen (Frist abgelaufen)' }
        )

        if (!('error' in result)) {
          closed++

          await notifyAllStaff({
            type: 'decision_closed',
            title: `Abstimmung abgelaufen: ${decision.title}`,
            content: 'Die Abstimmungsfrist ist abgelaufen. Die Entscheidung wurde automatisch geschlossen.',
            related_type: 'decision',
            related_id: decision.id,
          })
        } else {
          errors.push(`${decision.id}: ${result.error}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        errors.push(`${decision.id}: ${msg}`)
        logger.error('Failed to auto-close decision', { decisionId: decision.id, error: err })
      }
    }

    logger.info('Cron: close-decisions completed', {
      found: expiredDecisions.length,
      closed,
      errors: errors.length,
    })

    return Response.json({
      success: true,
      found: expiredDecisions.length,
      closed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('Cron: close-decisions failed', { error })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
