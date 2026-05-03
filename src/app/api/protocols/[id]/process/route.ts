/**
 * Protocol Process API
 *
 * POST /api/protocols/[id]/process - Submit transcript for AI processing
 *
 * Created: 2026-02-10
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { processTranscriptSchema } from '@/lib/schemas/protocols'
import { getProtocolById, processTranscript } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

/**
 * POST /api/protocols/[id]/process
 * Submit transcript for AI structuring
 */
export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest(ERROR_MESSAGES.PROTOCOL_ID_REQUIRED)

    const body = await request.json()
    const result = processTranscriptSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest(
        ERROR_MESSAGES.TRANSCRIPT_TOO_SHORT,
        result.error.flatten().fieldErrors
      )
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup

    const isAdmin = isSuperAdmin(session.user.email)

    // Verify protocol exists and user has access
    const protocol = await getProtocolById(protocolId, dbUserId, isAdmin)
    if (!protocol) {
      return apiNotFound('Protokoll')
    }

    if (protocol.status !== PROTOCOL_STATUSES.DRAFT && protocol.status !== PROTOCOL_STATUSES.REVIEW) {
      return apiBadRequest(ERROR_MESSAGES.PROTOCOL_NOT_EDITABLE)
    }

    logger.info('Processing protocol transcript', {
      protocolId,
      userId: dbUserId,
      transcriptLength: result.data.raw_transcript.length,
    })

    const processingResult = await processTranscript(protocolId, result.data.raw_transcript)

    if (!processingResult.success) {
      logger.warn('Protocol transcript processing failed', {
        protocolId,
        userId: dbUserId,
        code: processingResult.code,
        retryable: processingResult.retryable,
        error: processingResult.error,
      })

      return NextResponse.json({
        success: false,
        error: processingResult.error || ERROR_MESSAGES.PROCESSING_FAILED,
        code: processingResult.code || 'UNKNOWN',
        retryable: processingResult.retryable ?? true,
      }, {
        status: processingResult.retryable ? 503 : 422,
      })
    }

    return apiSuccess({
      processed: true,
      model: processingResult.model,
    })
  } catch (error) {
    logger.error('Error processing transcript', { error, userId: session.user.id })
    return apiError(error, ERROR_MESSAGES.PROCESSING_FAILED)
  }
})
