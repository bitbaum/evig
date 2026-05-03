/**
 * Decision Task Proposal API
 *
 * POST /api/protocols/[id]/decisions/propose - Generate AI task proposals
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { closeDecisionSchema } from '@/lib/schemas/protocols'
import { generateTaskProposals } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest(ERROR_MESSAGES.PROTOCOL_ID_REQUIRED)

    const body = await request.json()
    // Reuse closeDecisionSchema — same shape (just action_item_id)
    const result = closeDecisionSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(ERROR_MESSAGES.VALIDATION_FAILED, result.error.flatten().fieldErrors)
    }

    const { action_item_id } = result.data

    const proposals = await generateTaskProposals(protocolId, action_item_id)

    return apiSuccess(proposals)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DECISION_NOT_APPROVED') {
        return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_APPROVED)
      }
      if (error.message === 'DECISION_NOT_FOUND') {
        return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_FOUND)
      }
      if (error.message === 'AI_PROPOSAL_FAILED') {
        return apiError(error, ERROR_MESSAGES.AI_PROPOSAL_FAILED)
      }
    }
    logger.error('Error generating task proposals', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.AI_PROPOSAL_FAILED)
  }
})
