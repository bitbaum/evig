import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { isSuperAdmin } from '@/lib/permissions'
import { getProtocolById, processTranscript } from '@/lib/services/protocols'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { logger } from '@/lib/logger'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import { WHISPER_MODELS } from '@/config/transcription'
import { SERVICE_URLS } from '@/config/services'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest('Protokoll-ID erforderlich')

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return apiBadRequest('Keine Audiodatei empfangen')
    }

    const validationError = validateAudioUpload(audioFile)
    if (validationError) {
      return apiBadRequest(validationError)
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

    logger.info('Processing protocol audio', {
      protocolId,
      userId: dbUserId,
      audioSize: audioFile.size,
      audioType: audioFile.type,
    })

    const transcribeFormData = new FormData()
    transcribeFormData.append('audio', audioFile)

    const requestedModel = formData.get('model') as string | null
    const validModel = WHISPER_MODELS.find(m => m.id === requestedModel)
    const modelParam = validModel ? `&model=${validModel.id}` : ''

    const transcribeResponse = await fetch(`${SERVICE_URLS.TRANSCRIPTION}/transcribe?language=de${modelParam}`, {
      method: 'POST',
      body: transcribeFormData,
    })

    if (!transcribeResponse.ok) {
      const errorBody = await transcribeResponse.text()
      logger.error('Protocol audio transcription failed', {
        protocolId,
        userId: dbUserId,
        status: transcribeResponse.status,
        errorBody,
      })

      return NextResponse.json({
        success: false,
        error: 'Transkription fehlgeschlagen. Bitte erneut versuchen.',
        code: 'TRANSCRIPTION_FAILED',
        retryable: true,
      }, { status: 503 })
    }

    const transcription = await transcribeResponse.json() as { text?: string }
    const transcribedText = transcription.text?.trim()

    if (!transcribedText) {
      return NextResponse.json({
        success: false,
        error: 'Keine Sprache erkannt. Bitte deutlicher sprechen oder eine andere Aufnahme verwenden.',
        code: 'EMPTY_TRANSCRIPTION',
        retryable: true,
      }, { status: 422 })
    }

    const processingResult = await processTranscript(protocolId, transcribedText)

    if (!processingResult.success) {
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
      transcriptLength: transcribedText.length,
    })
  } catch (error) {
    logger.error('Error processing protocol audio', { error, userId: session.user.id })
    return apiError(error, 'Fehler bei der Audio-Verarbeitung')
  }
})
