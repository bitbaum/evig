'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import type { VoiceProductData } from '@/types/erfassung'

interface VoiceResult {
  transcription: string
  data: VoiceProductData
}

interface UseVoiceProductResult {
  isProcessing: boolean
  error: string | null
  processRecording: (audioBlob: Blob) => Promise<VoiceResult | null>
}

export function useVoiceProduct(): UseVoiceProductResult {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processRecording = useCallback(async (audioBlob: Blob): Promise<VoiceResult | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      logger.info('Processing voice recording', { size: audioBlob.size })

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

      return {
        transcription: result.data.transcription,
        data: result.data.data,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verarbeitung fehlgeschlagen'
      logger.error('Voice processing failed', { error: err })
      setError(message)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    error,
    processRecording,
  }
}
