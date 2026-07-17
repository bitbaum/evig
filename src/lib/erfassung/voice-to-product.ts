import { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'
import { transcribeAudio } from '@/lib/transcription/transcribe'
import type { ValidSession } from '@/lib/api/middleware'

/**
 * Shared voice→product pipeline: audio blob → Whisper transcription → AI product
 * extraction → structured form data. Used by the `erfassung/voice` route (the
 * former duplicate `intake/extract-voice` route was removed when capture was
 * consolidated at /admin/intake/capture).
 */
export async function voiceToProductResponse(request: NextRequest, session: ValidSession) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return apiBadRequest(ERROR_MESSAGES.NO_AUDIO_RECEIVED)
    }

    logger.info('Voice-to-product started', {
      userId: session.user.id,
      audioSize: audioFile.size,
      audioType: audioFile.type,
    })

    // Step 1: transcribe (Groq Whisper first, local faster-whisper fallback).
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

    logger.info('Transcription complete', {
      provider: transcription.provider,
      model: transcription.model,
    })

    // Step 2: extract product data via the shared AI service.
    const extractionResult = await extractProductFromText(transcribedText, 'voice')
    if (!extractionResult.success) {
      return apiError(extractionResult.error, extractionResult.error || ERROR_MESSAGES.EXTRACTION_FAILED)
    }

    logger.info('Voice-to-product complete', {
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
}
