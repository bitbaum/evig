/**
 * Decision Task Creation API
 *
 * POST /api/protocols/[id]/decisions/create-tasks - Create tasks from AI proposals
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { closeDecisionSchema } from '@/lib/schemas/protocols'
import { createProposedTasks } from '@/lib/services/protocols'
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

    const taskResult = await createProposedTasks(protocolId, action_item_id, dbUserId)

    return apiSuccess(taskResult, 201)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TASKS_ALREADY_CREATED') {
        return apiBadRequest(ERROR_MESSAGES.TASKS_ALREADY_CREATED)
      }
      if (error.message === 'DECISION_NOT_APPROVED') {
        return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_APPROVED)
      }
    }
    logger.error('Error creating decision tasks', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Erstellen der Aufgaben')
  }
})
