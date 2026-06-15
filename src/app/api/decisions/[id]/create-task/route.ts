/**
 * Create Follow-up Task from Decision API
 *
 * POST /api/decisions/[id]/create-task
 *
 * Links a closed protocol-spawned decision to a new task via protocol_action_links.
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createFollowUpTaskFromDecision } from '@/lib/services/protocol-decision-tasks'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

function mapServiceError(error: unknown): ReturnType<typeof apiBadRequest> | null {
  if (!(error instanceof Error)) return null

  switch (error.message) {
    case 'DECISION_NOT_FOUND':
      return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_FOUND)
    case 'DECISION_NOT_CLOSED':
      return apiBadRequest('Entscheidung muss abgeschlossen sein, bevor eine Aufgabe erstellt werden kann.')
    case 'DECISION_CANCELLED':
      return apiBadRequest('Abgebrochene Entscheidungen können keine Folgeaufgabe erzeugen.')
    case 'DECISION_NOT_PROTOCOL_LINKED':
      return apiBadRequest('Diese Entscheidung ist nicht mit einem Protokoll verknüpft.')
    case 'DECISION_NOT_APPROVED':
      return apiBadRequest(ERROR_MESSAGES.DECISION_NOT_APPROVED)
    case 'TASKS_ALREADY_CREATED':
      return apiBadRequest(ERROR_MESSAGES.TASKS_ALREADY_CREATED)
    default:
      return null
  }
}

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const decisionId = context?.params?.id
    if (!decisionId) return apiBadRequest(ERROR_MESSAGES.DECISION_ID_REQUIRED)

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const result = await createFollowUpTaskFromDecision(decisionId, dbUserId)

    logger.info('Decision follow-up task created via API', {
      decisionId,
      taskId: result.taskId,
      userId: dbUserId,
    })

    return apiSuccess(result, 201)
  } catch (error) {
    const mapped = mapServiceError(error)
    if (mapped) return mapped

    logger.error('Error creating follow-up task from decision', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Erstellen der Folgeaufgabe')
  }
})
