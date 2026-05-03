/**
 * Intake Voice Extraction API
 *
 * POST /api/admin/intake/extract-voice
 * Accepts audio file, transcribes via Whisper, extracts product data.
 * Reuses the shared extractProductFromText() pipeline.
 */

import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'
import { SERVICE_URLS } from '@/config/services'

export const POST = withAdmin('intake', async (request, session) => {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return apiBadRequest(ERROR_MESSAGES.NO_AUDIO_RECEIVED)
    }

    logger.info('Intake voice extraction started', {
      userId: session.user.id,
      audioSize: audioFile.size,
      audioType: audioFile.type,
    })

    // Step 1: Transcribe audio via Whisper
    const transcribeFormData = new FormData()
    transcribeFormData.append('audio', audioFile)

    const transcribeResponse = await fetch(
      `${SERVICE_URLS.TRANSCRIPTION}/transcribe?language=de`,
      {
        method: 'POST',
        body: transcribeFormData,
      }
    )

    if (!transcribeResponse.ok) {
      const transcribeError = await transcribeResponse.text()
      return apiError(new Error(transcribeError), 'Transkription fehlgeschlagen')
    }

    const transcription = await transcribeResponse.json()
    const transcribedText = transcription.text

    if (!transcribedText || transcribedText.trim() === '') {
      return apiBadRequest('Keine Sprache erkannt. Bitte erneut versuchen.')
    }

    logger.info('Intake transcription complete', {
      text: transcribedText,
      language: transcription.language,
    })

    // Step 2: Extract product data
    const extractionResult = await extractProductFromText(transcribedText, 'voice')

    if (!extractionResult.success) {
      return apiError(extractionResult.error, extractionResult.error || ERROR_MESSAGES.EXTRACTION_FAILED)
    }

    logger.info('Intake voice extraction complete', {
      userId: session.user.id,
      product: extractionResult.data.produktname,
    })

    return apiSuccess({
      transcription: transcribedText,
      data: extractionResult.data,
      metadata: extractionResult.metadata,
      model: extractionResult.model,
      sourceType: extractionResult.sourceType,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
