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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'

// Transcription service URL
const TRANSCRIPTION_URL = process.env.TRANSCRIPTION_URL || 'http://localhost:5111'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    // Check permission - erfassung is part of products section
    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung für Produkterfassung')
    }

    // Get audio from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return apiBadRequest('Keine Audiodatei empfangen')
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
      `${TRANSCRIPTION_URL}/transcribe?language=de`,
      {
        method: 'POST',
        body: transcribeFormData,
      }
    )

    if (!transcribeResponse.ok) {
      const error = await transcribeResponse.text()
      logger.error('Transcription failed', { error })
      return NextResponse.json(
        { success: false, error: 'Transkription fehlgeschlagen', details: error },
        { status: 500 }
      )
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
      logger.error('Product extraction failed', {
        error: extractionResult.error,
        transcription: transcribedText,
      })
      return NextResponse.json(
        {
          success: false,
          error: extractionResult.error,
          transcription: transcribedText,
          rawResponse: extractionResult.rawResponse,
        },
        { status: 500 }
      )
    }

    logger.info('Voice erfassung complete', {
      userId: session.user.id,
      product: extractionResult.data.produktname,
    })

    return NextResponse.json({
      success: true,
      transcription: transcribedText,
      data: extractionResult.data,
      metadata: extractionResult.metadata,
      model: extractionResult.model,
      sourceType: extractionResult.sourceType,
    })
  } catch (error) {
    logger.error('Voice erfassung error', { error })
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
