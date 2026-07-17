/**
 * POST /api/admin/timecards/for-user — create-or-get a month card for
 * ANOTHER team member ("erfassen im Namen von", timecards permission).
 * Body: { user_id, month: 'YYYY-MM' }. Returns the card id; the caller
 * opens the review drawer to enter the days. Auditable: activity-logged,
 * and every entry edit goes through the audited approver-edit path.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers'
import { getOrCreateTimecardForUser } from '@/lib/services/timecards'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

const bodySchema = z.object({
  user_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
})

export const POST = withAdmin('timecards', async (request: NextRequest, session: ValidSession) => {
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe')

    const card = await getOrCreateTimecardForUser(parsed.data.user_id, {
      period_type: 'month',
      period_date: `${parsed.data.month}-01`,
    })

    if (parsed.data.user_id !== session.user.id) {
      logActivity({
        actorId: session.user.id,
        action: 'opened_timecard_for_user',
        subjectType: 'timecard',
        subjectId: card.id,
        subjectLabel: parsed.data.month,
      })
    }

    return apiSuccess({ id: card.id, status: card.status })
  } catch (error) {
    logger.error('Error creating timecard for user', { error, actorId: session.user.id })
    return apiError(error, 'Zeitkarte konnte nicht erstellt werden')
  }
})
