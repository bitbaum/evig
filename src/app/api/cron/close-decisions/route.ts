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
import { notifyAllStaff, notifyUsers } from '@/lib/services/notifications'
import { resolveEligibleUserIds } from '@/lib/services/decisions-voting'
import { asArray } from '@/lib/services/decisions-crud'
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
    // Send 24h deadline reminders to non-voters for decisions expiring tomorrow
    try {
      const upcomingDecisions = await db
        .select({
          id: decisions.id,
          title: decisions.title,
          votingDeadline: decisions.votingDeadline,
          participantScope: decisions.participantScope,
          invitedParticipants: decisions.invitedParticipants,
        })
        .from(decisions)
        .where(
          and(
            eq(decisions.status, 'voting'),
            isNotNull(decisions.votingDeadline),
            // Deadline is between 23h and 25h from now (window for daily cron)
            sql`voting_deadline BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'`
          )
        )

      for (const decision of upcomingDecisions) {
        try {
          const scope = decision.participantScope ?? 'all_staff'
          const invited = asArray<string>(decision.invitedParticipants, [])
          const eligibleIds = await resolveEligibleUserIds(scope, invited)

          // Find who hasn't voted yet
          const votedResult = await db.execute(
            sql`SELECT user_id FROM decision_votes WHERE decision_id = ${decision.id}`
          )
          const votedIds = new Set(
            (votedResult.rows as Array<{ user_id: string }>).map(r => r.user_id)
          )
          const nonVoterIds = eligibleIds.filter(id => !votedIds.has(id))

          if (nonVoterIds.length > 0) {
            await notifyUsers(nonVoterIds, {
              type: 'decision_deadline',
              title: `Abstimmung endet morgen: ${decision.title}`,
              content: `Die Abstimmungsfrist für "${decision.title}" endet morgen. Bitte gib noch deine Stimme ab.`,
              related_type: 'decision',
              related_id: decision.id,
              metadata: {
                decisionId: decision.id,
                votingDeadline: decision.votingDeadline ?? '',
              },
            })
          }
        } catch (err) {
          logger.error('Failed to send deadline reminder', { decisionId: decision.id, error: err })
        }
      }

      if (upcomingDecisions.length > 0) {
        logger.info('Cron: deadline reminders sent', { count: upcomingDecisions.length })
      }
    } catch (err) {
      logger.error('Cron: deadline reminder check failed', { error: err })
    }

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
            metadata: { decisionId: decision.id },
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
