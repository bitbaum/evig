/**
 * Decision Transition API
 *
 * POST /api/decisions/[id]/transition - Change decision status
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { transitionDecisionSchema } from '@/lib/schemas/decisions'
import { transitionDecision } from '@/lib/services/decisions'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const body = await request.json()
    const parsed = transitionDecisionSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest(
        parsed.error.issues[0]?.message || ERROR_MESSAGES.ALL_FIELDS_REQUIRED
      )
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const result = await transitionDecision(decisionId, parsed.data.status, dbUserId, {
      cancelReason: parsed.data.cancelReason,
      outcomeSummary: parsed.data.outcomeSummary,
    })

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Entscheidung')
      if (result.error === 'invalid_transition') return apiBadRequest(ERROR_MESSAGES.DECISION_INVALID_TRANSITION)
    }

    logger.info('Decision transitioned', {
      decisionId,
      newStatus: parsed.data.status,
      userId: dbUserId,
    })
    return apiSuccess(result.decision)
  } catch (error) {
    logger.error('Error transitioning decision', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
