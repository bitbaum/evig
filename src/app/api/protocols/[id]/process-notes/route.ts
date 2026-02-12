/**
 * Protocol Process Notes API
 *
 * POST /api/protocols/[id]/process-notes - Process notes (JSON or free text)
 *
 * Created: 2026-02-10
 */

import { NextRequest } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { processNotesSchema } from '@/lib/schemas/protocols'
import { getProtocolById, processNotes } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * POST /api/protocols/[id]/process-notes
 * Process notes content (auto-detects JSON vs free text)
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
    const result = processNotesSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(
        'Notizen zu kurz (mindestens 20 Zeichen)',
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

    if (protocol.status !== 'draft' && protocol.status !== 'review') {
      return apiBadRequest(ERROR_MESSAGES.PROTOCOL_NOT_EDITABLE)
    }

    logger.info('Processing protocol notes', {
      protocolId,
      userId: dbUserId,
      contentLength: result.data.content.length,
    })

    const processingResult = await processNotes(protocolId, result.data.content)

    if (!processingResult.success) {
      return apiError(
        new Error(processingResult.error || 'Processing failed'),
        ERROR_MESSAGES.NOTES_PROCESSING_FAILED
      )
    }

    return apiSuccess({
      processed: true,
      model: processingResult.model,
      source: processingResult.source,
    })
  } catch (error) {
    logger.error('Error processing notes', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.NOTES_PROCESSING_FAILED)
  }
})
