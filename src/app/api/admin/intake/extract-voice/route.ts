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
import { transcribeAudio } from '@/lib/transcription/transcribe'

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
    // Groq Whisper first (works on prod), local faster-whisper fallback.
    let transcription
    try {
      transcription = await transcribeAudio(audioFile, { language: 'de', filename: audioFile.name })
    } catch (transcribeError) {
      return apiError(transcribeError, 'Transkription fehlgeschlagen')
    }
    const transcribedText = transcription.text

    if (!transcribedText || transcribedText.trim() === '') {
      return apiBadRequest('Keine Sprache erkannt. Bitte erneut versuchen.')
    }

    logger.info('Intake transcription complete', {
      text: transcribedText,
      provider: transcription.provider,
      model: transcription.model,
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
