/**
 * Protocol Process Sources API — unified endpoint.
 *
 * POST /api/protocols/[id]/process-sources
 *
 * Replaces the trio:
 *   /process        (text transcript JSON body)
 *   /process-audio  (single audio FormData)
 *   /process-notes  (text notes JSON body)
 *
 * Accepts FormData with any combination of:
 *   - audio       — optional File (single)
 *   - text        — optional string (the textarea content)
 *   - textFile    — optional File (zero or many; FormData allows
 *                   duplicate keys via getAll)
 *   - whisper_model — optional string (validated against WHISPER_MODELS)
 *
 * At least one of (audio, text, textFile) must be supplied. Audio is
 * transcribed first, text inputs are read; the combined string is
 * passed to the existing AI structuring service.
 *
 * Why unified: the old "pick one source" UX forced users to choose
 * between a recording and notes for the same meeting. Real meetings
 * have both. This endpoint concatenates them with named separators so
 * the LLM has full context.
 */

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
import { validateTextUpload } from '@/lib/protocols/upload'
import { transcribeAudio, TranscriptionUnavailableError } from '@/lib/transcription/transcribe'

type RouteParams = { id: string }

// Minimum combined transcript length to send to the LLM. Aligned with
// the existing processTranscriptSchema rule. Below this the AI returns
// junk, so reject early with a clearer message.
const MIN_COMBINED_TRANSCRIPT_LENGTH = 50

export const POST = withAdmin<RouteParams>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const protocolId = context?.params?.id
    if (!protocolId) return apiBadRequest(ERROR_MESSAGES.PROTOCOL_ID_REQUIRED)

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error
    const { dbUserId } = userLookup
    const isAdmin = isSuperAdmin(session.user.email)

    const protocol = await getProtocolById(protocolId, dbUserId, isAdmin)
    if (!protocol) return apiNotFound('Protokoll')
    if (protocol.status !== PROTOCOL_STATUSES.DRAFT && protocol.status !== PROTOCOL_STATUSES.REVIEW) {
      return apiBadRequest(ERROR_MESSAGES.PROTOCOL_NOT_EDITABLE)
    }

    // ─── Parse FormData ──────────────────────────────────────────────
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const textInput = (formData.get('text') as string | null)?.trim() ?? ''
    const textFiles = formData.getAll('textFile').filter((v): v is File => v instanceof File)
    const requestedModel = formData.get('whisper_model') as string | null

    if (!audioFile && !textInput && textFiles.length === 0) {
      return apiBadRequest('Mindestens eine Quelle erforderlich (Audio, Text oder Datei).')
    }

    // ─── Validate each source individually ────────────────────────────
    if (audioFile) {
      const audioError = validateAudioUpload(audioFile)
      if (audioError) return apiBadRequest(audioError)
    }
    for (const tf of textFiles) {
      const textError = validateTextUpload(tf)
      if (textError) return apiBadRequest(`${tf.name}: ${textError}`)
    }

    // ─── Build the combined transcript ───────────────────────────────
    const parts: string[] = []

    // 1. Audio transcription (if present). The transcribe-service call
    // pattern is intentionally duplicated from /process-audio for now —
    // when that endpoint is retired (deferred to cleanup script), this
    // becomes the only copy.
    let transcribedText: string | undefined
    if (audioFile) {
      let transcription
      try {
        // Groq Whisper first (works on prod), local faster-whisper fallback.
        transcription = await transcribeAudio(audioFile, {
          language: 'de',
          localModel: requestedModel ?? undefined,
          filename: audioFile.name,
        })
      } catch (error) {
        logger.error('Protocol audio transcription failed', {
          protocolId,
          userId: dbUserId,
          error: String(error),
        })
        // TranscriptionUnavailableError carries a user-actionable message
        // (e.g. "Datei zu gross, max. 24 MB") — pass it through instead of
        // collapsing every cause into the same generic string.
        const message = error instanceof TranscriptionUnavailableError && error.message
          ? error.message
          : 'Transkription fehlgeschlagen. Bitte erneut versuchen.'
        return NextResponse.json({
          success: false,
          error: message,
          code: 'TRANSCRIPTION_FAILED',
          retryable: true,
        }, { status: 503 })
      }

      transcribedText = transcription.text
      logger.info('Protocol audio transcribed', {
        protocolId,
        provider: transcription.provider,
        model: transcription.model,
      })

      if (!transcribedText) {
        return NextResponse.json({
          success: false,
          error: 'Keine Sprache erkannt. Bitte deutlicher sprechen oder eine andere Aufnahme verwenden.',
          code: 'EMPTY_TRANSCRIPTION',
          retryable: true,
        }, { status: 422 })
      }
      parts.push(`--- Audio-Transkript: ${audioFile.name} ---\n${transcribedText}`)
    }

    // 2. Textarea content (manual notes — typed inline)
    if (textInput) {
      parts.push(`--- Notizen ---\n${textInput}`)
    }

    // 3. Uploaded text files — concatenated in drop order
    for (const tf of textFiles) {
      const content = (await tf.text()).trim()
      if (content) parts.push(`--- Datei: ${tf.name} ---\n${content}`)
    }

    const combined = parts.join('\n\n').trim()

    if (combined.length < MIN_COMBINED_TRANSCRIPT_LENGTH) {
      return apiBadRequest(
        `Kombinierter Inhalt zu kurz (mindestens ${MIN_COMBINED_TRANSCRIPT_LENGTH} Zeichen). Bitte mehr Material liefern.`,
      )
    }

    logger.info('Processing protocol from multi-source upload', {
      protocolId,
      userId: dbUserId,
      hasAudio: !!audioFile,
      hasTextInput: !!textInput,
      textFileCount: textFiles.length,
      combinedLength: combined.length,
    })

    // ─── Hand off to the AI structuring service ───────────────────────
    const processingResult = await processTranscript(protocolId, combined)

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
      sources: {
        audio: !!audioFile,
        textInput: !!textInput,
        textFiles: textFiles.length,
      },
      transcriptLength: combined.length,
    })
  } catch (error) {
    logger.error('Error in /process-sources', { error, userId: session.user.id })
    return apiError(error, 'Fehler bei der Verarbeitung der Quellen')
  }
})
