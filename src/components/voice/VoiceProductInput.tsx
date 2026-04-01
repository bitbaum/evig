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
      setErrorMessage(voiceError || 'Verarbeitung fehlgeschlagen')
      setState('error')
      onError?.(voiceError || 'Verarbeitung fehlgeschlagen')
    }
  }, [processVoiceRecording, voiceError, onProductData, onTranscription, onError])

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
      setErrorMessage('Mikrofon konnte nicht aktiviert werden')
      setState('error')
      onError?.('Mikrofon konnte nicht aktiviert werden')
    }
  }, [onError, processRecording])

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
        return 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
      case 'processing':
        return 'bg-yellow-500 text-white cursor-wait'
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'error':
        return 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
      default:
        return 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300'
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
        return 'Stopp'
      case 'processing':
        return 'Verarbeite...'
      case 'success':
        return 'Erkannt!'
      case 'error':
        return 'Fehler'
      default:
        return 'Diktieren'
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
        <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          <span className="font-medium">Erkannt:</span> {transcribedText}
        </div>
      )}

      {/* Error message */}
      {errorMessage && state === 'error' && (
        <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Recording hint */}
      {state === 'recording' && (
        <div className="text-sm text-gray-600">
          Sprich jetzt... z.B. &quot;Dell Latitude 7470, guter Zustand, 280 Franken&quot;
        </div>
      )}
    </div>
  )
}
