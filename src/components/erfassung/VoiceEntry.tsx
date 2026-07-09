'use client'

/**
 * VoiceEntry — record a spoken product description, transcribe + extract it,
 * and hand the structured fields to the form.
 *
 * SSOT composition (no bespoke recording logic here):
 *   useVoiceRecording  — mic state machine → audio Blob (the recorder SSOT)
 *   useVoiceProduct    — Blob → POST /api/admin/erfassung/voice → product data
 *
 * The erfassung "Sprache" tab renders this; intake can adopt it later to retire
 * its inline MediaRecorder copy.
 */

import { useCallback, useState } from 'react'
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { useVoiceProduct } from '@/hooks/useVoiceProduct'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'

/** Max spoken description length — a product description is short; caps runaway recordings. */
const MAX_RECORDING_SECONDS = 120

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface VoiceEntryProps {
  onProductData: (data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => void
  onError?: (error: string) => void
  onDataFilled?: () => void
}

export function VoiceEntry({ onProductData, onError, onDataFilled }: VoiceEntryProps) {
  const t = useTranslations('components.erfassung.voiceEntry')
  const [transcription, setTranscription] = useState<string | null>(null)

  const { isProcessing, processRecording } = useVoiceProduct()

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      setTranscription(null)
      const result = await processRecording(audioBlob)
      if (!result) {
        onError?.(t('errorGeneric'))
        return
      }
      setTranscription(result.transcription)
      onProductData(result.data as Partial<ErfassungFormData>, result.metadata)
      onDataFilled?.()
    },
    [processRecording, onProductData, onError, onDataFilled, t],
  )

  const { state, recordingTime, errorMessage, startRecording, stopRecording } = useVoiceRecording({
    maxDuration: MAX_RECORDING_SECONDS,
    onRecordingComplete: handleRecordingComplete,
    onError: msg => onError?.(msg),
  })

  const isRecording = state === 'recording'
  const busy = isProcessing || state === 'processing'

  return (
    <div className="space-y-3">
      {busy ? (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-action-muted px-4 py-3 text-sm text-action">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('processing')}
        </div>
      ) : isRecording ? (
        <Button
          type="button"
          variant="destructive-outline"
          onClick={stopRecording}
          className="flex w-full animate-pulse items-center justify-center gap-2 rounded-lg border-2 border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-900/20 dark:text-error-400"
        >
          <Square className="h-5 w-5 fill-current" />
          {t('stop')} · {formatSeconds(recordingTime)}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-default px-4 py-3 text-sm text-text-secondary hover:border-action"
        >
          <Mic className="h-5 w-5" />
          {t('start')}
        </Button>
      )}

      {!isRecording && !busy && (
        <p className="text-xs text-text-tertiary">{t('hint')}</p>
      )}

      {transcription && !busy && (
        <p className="rounded-sm bg-surface-raised p-2 text-xs text-text-tertiary">
          {t('transcription', { text: transcription })}
        </p>
      )}

      {(errorMessage || state === 'error') && !busy && (
        <p className="flex items-center gap-1.5 text-xs text-error-600 dark:text-error-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMessage || t('errorGeneric')}
        </p>
      )}
    </div>
  )
}
