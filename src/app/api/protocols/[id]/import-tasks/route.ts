/**
 * Protocol Import Tasks API
 *
 * POST /api/protocols/[id]/import-tasks - Import task list (JSON or plain text)
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { importTasksSchema } from '@/lib/schemas/protocols'
import { getProtocolById, importTasks } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * POST /api/protocols/[id]/import-tasks
 * Import tasks from content (auto-detects JSON vs plain text)
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
    const result = importTasksSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(
        'Aufgabenliste zu kurz (mindestens 10 Zeichen)',
        result.error.flatten().fieldErrors
      )
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    const protocol = await getProtocolById(protocolId, dbUserId, isAdmin)
    if (!protocol) {
      return apiNotFound('Protokoll')
    }

    if (protocol.status !== PROTOCOL_STATUSES.DRAFT && protocol.status !== PROTOCOL_STATUSES.REVIEW) {
      return apiBadRequest(ERROR_MESSAGES.PROTOCOL_NOT_EDITABLE)
    }

    logger.info('Importing protocol tasks', {
      protocolId,
      userId: dbUserId,
      contentLength: result.data.content.length,
    })

    const importResult = await importTasks(protocolId, result.data.content, dbUserId)

    if (!importResult.success) {
      return apiError(
        new Error(importResult.error || 'Import failed'),
        ERROR_MESSAGES.TASKS_PROCESSING_FAILED
      )
    }

    return apiSuccess({
      imported: true,
      taskCount: importResult.taskCount,
      model: importResult.model,
      source: importResult.source,
    })
  } catch (error) {
    logger.error('Error importing tasks', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.TASKS_PROCESSING_FAILED)
  }
})
