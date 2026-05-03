/**
 * API: Voice-to-Product Erfassung
 *
 * POST /api/admin/erfassung/voice
 * Accepts audio file, transcribes it, and returns structured product data.
 *
 * Flow:
 * 1. Receive audio blob from browser
 * 2. Send to local Whisper transcription service
 * 3. Send transcribed text to shared AI extraction service
 * 4. Return ErfassungFormData ready to fill the form
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'
import { SERVICE_URLS } from '@/config/services'

export const POST = withAdmin('products', async (request, session) => {
  try {
    // Get audio from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return apiBadRequest(ERROR_MESSAGES.NO_AUDIO_RECEIVED)
    }

    logger.info('Voice erfassung started', {
      userId: session.user.id,
      audioSize: audioFile.size,
      audioType: audioFile.type,
    })

    // Step 1: Transcribe audio
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

    logger.info('Transcription complete', {
      text: transcribedText,
      language: transcription.language,
      duration: transcription.duration_processing,
    })

    // Step 2: Extract product data using shared AI service
    const extractionResult = await extractProductFromText(transcribedText, 'voice')

    if (!extractionResult.success) {
      return apiError(extractionResult.error, extractionResult.error || 'Extraktionsfehler')
    }

    logger.info('Voice erfassung complete', {
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
    return apiError(error, 'Interner Serverfehler')
  }
})
