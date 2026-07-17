/**
 * POST /api/admin/timecards/[id]/submit — submit a DRAFT card on behalf of
 * its owner (proxy entry, e.g. HR back-filling a past month for someone who
 * doesn't use the tool). Vier-Augen stays intact: the submitter cannot be
 * the sole reviewer unless super-admin — approval is a separate action by
 * the normal rules. Owner is notified.
 */

import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { timecards } from '@/db/schema'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiNotFound, apiSuccess } from '@/lib/api/helpers'
import { getTimecardByIdForReview, submitTimecard } from '@/lib/services/timecards'
import { formatTimecardPeriodLabel } from '@/lib/team/timecard-period-label'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

export const POST = withAdmin('timecards', async (
  _request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('Zeitkarten-ID ist erforderlich')

    const [row] = await db
      .select({ userId: timecards.userId, status: timecards.status })
      .from(timecards)
      .where(eq(timecards.id, id))
      .limit(1)
    if (!row) return apiNotFound('Zeitkarte')
    if (row.status !== 'draft' && row.status !== 'rejected') {
      return apiBadRequest('Nur Entwürfe können eingereicht werden.')
    }

    const card = await getTimecardByIdForReview(id)
    if (!card) return apiNotFound('Zeitkarte')
    if (card.entries.length === 0) return apiBadRequest('Zeitkarte hat keine Einträge.')

    const result = await submitTimecard(row.userId, {
      period_type: card.period_type as 'week' | 'month',
      period_start: card.period_start,
      period_end: card.period_end,
      notes: card.notes ?? null,
      entries: card.entries.map(e => ({
        work_date: e.work_date,
        start_time: e.start_time ?? null,
        end_time: e.end_time ?? null,
        break_minutes: e.break_minutes ?? 0,
        duration_minutes: e.duration_minutes,
        category: e.category,
        description: e.description ?? undefined,
        source: (e.source ?? 'manual') as 'manual' | 'ai_assisted' | 'template' | 'task_completion',
      })),
    })

    if (row.userId !== session.user.id) {
      const periodLabel = formatTimecardPeriodLabel(card.period_type, card.period_start, card.period_end)
      logActivity({
        actorId: session.user.id,
        action: 'submitted_timecard_for_user',
        subjectType: 'timecard',
        subjectId: id,
        subjectLabel: periodLabel,
      })
      await createNotification(row.userId, {
        type: NOTIFICATION_TYPES.TIMECARD_SUBMITTED,
        title: 'Zeitkarte für dich eingereicht',
        content: `Deine Zeitkarte für ${periodLabel} wurde von einem Teammitglied erfasst und zur Genehmigung eingereicht.`,
        related_type: RELATED_TYPES.TIMECARD,
        related_id: id,
      }).catch(err => logger.warn('Proxy submit notification failed', { error: err, id }))
    }

    return apiSuccess(result)
  } catch (error) {
    logger.error('Error submitting timecard on behalf', { error, actorId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht eingereicht werden')
  }
})
