/**
 * Protocol Action Links API
 *
 * GET /api/protocols/[id]/actions - Get action links for a protocol
 * POST /api/protocols/[id]/actions - Create task from action item
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { linkActionSchema } from '@/lib/schemas/protocols'
import { getActionLinks, linkActionItemToTask } from '@/lib/services/protocols'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * GET /api/protocols/[id]/actions
 */
export const GET = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const links = await getActionLinks(protocolId)

    return apiSuccess(links)
  } catch (error) {
    logger.error('Error fetching action links', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Verknüpfungen')
  }
})

/**
 * POST /api/protocols/[id]/actions
 * Create a task from an action item
 */
export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const body = await request.json()
    const result = linkActionSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const { action_item_id, link_type, task_data } = result.data

    if (link_type === 'decision') {
      return apiBadRequest('Entscheidungssystem ist noch in Entwicklung')
    }

    if (!task_data) {
      return apiBadRequest('Aufgabendaten erforderlich')
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const { taskId, linkId } = await linkActionItemToTask(
      protocolId,
      action_item_id,
      task_data,
      dbUserId
    )

    logger.info('Action item linked to task', {
      protocolId,
      actionItemId: action_item_id,
      taskId,
    })

    return apiSuccess({ taskId, linkId }, 201)
  } catch (error) {
    logger.error('Error linking action item', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Erstellen der Verknüpfung')
  }
})
