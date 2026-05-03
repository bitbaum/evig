/**
 * Decision Participation API
 *
 * GET /api/decisions/[id]/votes/participation - Get participation status
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getParticipationStatus } from '@/lib/services/decisions'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest(ERROR_MESSAGES.DECISION_ID_REQUIRED)

    const result = await getParticipationStatus(decisionId)
    if (!result) return apiNotFound('Entscheidung')

    return apiSuccess(result)
  } catch (error) {
    logger.error('Error fetching participation status', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
