'use client'

/**
 * VoiceProductInput Component
 *
 * A microphone button that records audio and sends it to the voice API
 * for transcription and product data extraction.
 *
 * Usage:
 *   <VoiceProductInput onProductData={(data) => fillForm(data)} />
 */

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { useVoiceProduct } from '@/hooks/useVoiceProduct'
import type { VoiceProductData } from '@/types/erfassung'

// Re-export for convenience
export type { VoiceProductData } from '@/types/erfassung'

interface VoiceProductInputProps {
  onProductData: (data: VoiceProductData) => void
  onTranscription?: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error'

export function VoiceProductInput({
  onProductData,
  onTranscription,
  onError,
  disabled = false,
  className = '',
}: VoiceProductInputProps) {
  const t = useTranslations('components.voice')
  const { isProcessing: isVoiceProcessing, error: voiceError, processRecording: processVoiceRecording } = useVoiceProduct()
  const [state, setState] = useState<RecordingState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcribedText, setTranscribedText] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Process recording via the hook
  const processRecording = useCallback(async () => {
    const audioBlob = new Blob(audioChunksRef.current, {
      type: mediaRecorderRef.current?.mimeType || 'audio/webm',
    })

    const result = await processVoiceRecording(audioBlob)

    if (result) {
      setTranscribedText(result.transcription)
      onTranscription?.(result.transcription)
      onProductData(result.data)
      setState('success')

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setState('idle')
      }, 3000)
    } else {
      setErrorMessage(voiceError || t('errorProcessing'))
      setState('error')
      onError?.(voiceError || t('errorProcessing'))
    }
  }, [t, processVoiceRecording, voiceError, onProductData, onTranscription, onError])

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null)
      setTranscribedText(null)

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Process the recording
        await processRecording()
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setState('recording')

      logger.info('Voice recording started')
    } catch (error) {
      logger.error('Failed to start recording', { error })
      setErrorMessage(t('errorMicrophone'))
      setState('error')
      onError?.(t('errorMicrophone'))
    }
  }, [t, onError, processRecording])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('processing')
    }
  }, [state])

  const handleClick = () => {
    if (state === 'recording') {
      stopRecording()
    } else if (state === 'idle' || state === 'error' || state === 'success') {
      startRecording()
    }
  }

  // Button styling based on state
  const getButtonStyle = () => {
    switch (state) {
      case 'recording':
        return 'bg-error-500 hover:bg-error-600 text-white animate-pulse'
      case 'processing':
        return 'bg-warning-500 text-white cursor-wait'
      case 'success':
        return 'bg-primary-500 hover:bg-primary-600 text-white'
      case 'error':
        return 'bg-error-100 hover:bg-error-200 text-error-700 border-error-300 dark:bg-error-900/30 dark:hover:bg-error-900/40 dark:text-error-300'
      default:
        return 'bg-primary-100 hover:bg-primary-200 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:hover:bg-primary-900/40 dark:text-primary-300'
    }
  }

  const getIcon = () => {
    switch (state) {
      case 'recording':
        return <MicOff className="w-5 h-5" />
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Mic className="w-5 h-5" />
    }
  }

  const getLabel = () => {
    switch (state) {
      case 'recording':
        return t('stateRecording')
      case 'processing':
        return t('stateProcessing')
      case 'success':
        return t('stateSuccess')
      case 'error':
        return t('stateError')
      default:
        return t('stateIdle')
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleClick}
        disabled={disabled || state === 'processing'}
        className={`flex items-center gap-2 ${getButtonStyle()}`}
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </Button>

      {/* Transcription preview */}
      {transcribedText && state === 'success' && (
        <div className="text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-md dark:bg-primary-900/20 dark:text-primary-300">
          <span className="font-medium">{t('transcribedPrefix')}</span> {transcribedText}
        </div>
      )}

      {/* Error message */}
      {errorMessage && state === 'error' && (
        <div className="text-sm text-error-700 bg-error-50 px-3 py-2 rounded-md dark:bg-error-900/20 dark:text-error-300">
          {errorMessage}
        </div>
      )}

      {/* Recording hint */}
      {state === 'recording' && (
        <div className="text-sm text-neutral-600">
          {t('recordingHint')}
        </div>
      )}
    </div>
  )
}
