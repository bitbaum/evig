/**
 * Decision Vote API
 *
 * POST /api/protocols/[id]/decisions/vote - Cast/toggle a vote
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { decisionVoteSchema } from '@/lib/schemas/protocols'
import { castDecisionVote } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAuth<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const body = await request.json()
    const result = decisionVoteSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const { action_item_id, vote_type } = result.data

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const voteResult = await castDecisionVote(
      protocolId,
      action_item_id,
      dbUserId,
      vote_type as 'up' | 'down',
    )

    return apiSuccess(voteResult)
  } catch (error) {
    if (error instanceof Error && error.message === 'DECISION_ALREADY_CLOSED') {
      return apiBadRequest(ERROR_MESSAGES.DECISION_ALREADY_CLOSED)
    }
    logger.error('Error casting decision vote', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.VOTE_FAILED)
  }
})
