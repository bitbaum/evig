/**
 * Decision Votes API
 *
 * GET  /api/decisions/[id]/votes - Get votes for a decision
 * POST /api/decisions/[id]/votes - Submit or update vote
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { getVotes, submitVote } from '@/lib/services/decisions'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const GET = withAuth<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const result = await getVotes(decisionId, dbUserId)
    if ('error' in result) return apiNotFound('Entscheidung')

    return apiSuccess(result)
  } catch (error) {
    logger.error('Error fetching votes', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const POST = withAuth<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest('Entscheidungs-ID erforderlich')

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const body = await request.json()
    const result = await submitVote(decisionId, dbUserId, body)

    if ('error' in result) {
      if (result.error === 'not_found') return apiNotFound('Entscheidung')
      if (result.error === 'not_voting_phase') return apiBadRequest(ERROR_MESSAGES.VOTE_NOT_IN_VOTING_PHASE)
      if (result.error === 'not_participant') return apiBadRequest(ERROR_MESSAGES.VOTE_NOT_PARTICIPANT)
      if (result.error === 'invalid_data') {
        return apiBadRequest('message' in result ? (result.message as string) : ERROR_MESSAGES.VOTE_INVALID_DATA)
      }
    }

    logger.info('Vote submitted', { decisionId, userId: dbUserId })
    return apiSuccess(result.vote)
  } catch (error) {
    logger.error('Error submitting vote', { error })
    return apiError(error, ERROR_MESSAGES.VOTE_SUBMIT_FAILED)
  }
})
