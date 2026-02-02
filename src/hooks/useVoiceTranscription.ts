'use client'

/**
 * Voice Transcription Hook
 *
 * Handles submitting audio for transcription via API.
 */

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { VoiceProductData, AIFieldMetadata } from '@/types/erfassung'

interface UseVoiceTranscriptionProps {
  onTranscription?: (text: string) => void
  onTranscriptionComplete?: (data: VoiceProductData, metadata?: AIFieldMetadata) => void
  onError?: (error: string) => void
  onSuccess?: () => void
}

interface UseVoiceTranscriptionReturn {
  transcribedText: string | null
  setTranscribedText: (text: string | null) => void
  isProcessing: boolean
  submitForTranscription: (audioBlob: Blob) => Promise<boolean>
}

export function useVoiceTranscription({
  onTranscription,
  onTranscriptionComplete,
  onError,
  onSuccess,
}: UseVoiceTranscriptionProps): UseVoiceTranscriptionReturn {
  const [transcribedText, setTranscribedText] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const submitForTranscription = useCallback(async (audioBlob: Blob): Promise<boolean> => {
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/admin/erfassung/voice', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unbekannter Fehler')
      }

      setTranscribedText(result.transcription)
      onTranscription?.(result.transcription)
      onTranscriptionComplete?.(result.data, result.metadata as AIFieldMetadata)
      onSuccess?.()

      logger.info('Voice transcription completed', {
        product: result.data?.produktname,
      })

      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Verarbeitung fehlgeschlagen'
      logger.error('Voice processing failed', { error })
      onError?.(message)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [onTranscription, onTranscriptionComplete, onError, onSuccess])

  return {
    transcribedText,
    setTranscribedText,
    isProcessing,
    submitForTranscription,
  }
}
