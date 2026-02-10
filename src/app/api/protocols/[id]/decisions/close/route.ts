/**
 * Decision Close API
 *
 * POST /api/protocols/[id]/decisions/close - Manually close a decision
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { closeDecisionSchema } from '@/lib/schemas/protocols'
import { closeDecision } from '@/lib/services/protocols'
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
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const body = await request.json()
    const result = closeDecisionSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const { action_item_id } = result.data

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const outcome = await closeDecision(protocolId, action_item_id, dbUserId)

    return apiSuccess(outcome)
  } catch (error) {
    if (error instanceof Error && error.message === 'DECISION_ALREADY_CLOSED') {
      return apiBadRequest(ERROR_MESSAGES.DECISION_ALREADY_CLOSED)
    }
    logger.error('Error closing decision', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Schliessen der Abstimmung')
  }
})
