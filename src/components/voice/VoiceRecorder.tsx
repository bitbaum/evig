'use client'

/**
 * VoiceRecorder Component
 *
 * Enhanced ChatGPT-style voice recording UI with:
 * - Recording timer (MM:SS)
 * - Max duration (2 minutes default)
 * - Pause/Resume capability
 * - Waveform visualization placeholder
 * - Playback preview before submission
 *
 * Usage:
 *   <VoiceRecorder
 *     onRecordingComplete={(blob, duration) => handleBlob(blob)}
 *     onTranscriptionComplete={(data) => fillForm(data)}
 *   />
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Mic,
  Pause,
  Play,
  Square,
  RotateCcw,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import type { VoiceProductData } from '@/types/erfassung'

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void
  onTranscriptionComplete?: (data: VoiceProductData) => void
  onTranscription?: (text: string) => void
  onError?: (error: string) => void
  maxDuration?: number // seconds, default 120
  disabled?: boolean
  className?: string
}

type RecorderState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'success'
  | 'error'

export function VoiceRecorder({
  onRecordingComplete,
  onTranscriptionComplete,
  onTranscription,
  onError,
  maxDuration = 120,
  disabled = false,
  className = '',
}: VoiceRecorderProps) {
  // Recording state
  const [state, setState] = useState<RecorderState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcribedText, setTranscribedText] = useState<string | null>(null)

  // Playback state
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const recordingTimeRef = useRef(0)
  const shouldAutoStopRef = useRef(false)

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null)
      setTranscribedText(null)
      setRecordingTime(0)
      setAudioUrl(null)
      setPlaybackTime(0)

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      })
      streamRef.current = stream

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

      mediaRecorder.onstop = () => {
        // Create blob for playback
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        })
        audioBlobRef.current = audioBlob
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        // Notify parent
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, recordingTimeRef.current)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setState('recording')
      recordingTimeRef.current = 0
      shouldAutoStopRef.current = false

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 0.1
        setRecordingTime(recordingTimeRef.current)

        // Set flag for auto-stop when max duration reached
        if (recordingTimeRef.current >= maxDuration) {
          shouldAutoStopRef.current = true
        }
      }, 100)

      logger.info('Voice recording started')
    } catch (error) {
      logger.error('Failed to start recording', { error })
      setErrorMessage('Mikrofon konnte nicht aktiviert werden')
      setState('error')
      onError?.('Mikrofon konnte nicht aktiviert werden')
    }
  }, [maxDuration, onError, onRecordingComplete])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (
      mediaRecorderRef.current &&
      (state === 'recording' || state === 'paused')
    ) {
      mediaRecorderRef.current.stop()
      setState('stopped')
      logger.info('Voice recording stopped', { duration: recordingTimeRef.current })
    }
  }, [state])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      setState('paused')
      logger.info('Voice recording paused')
    }
  }, [state])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 0.1
          if (newTime >= maxDuration) {
            stopRecording()
            return prev
          }
          return newTime
        })
      }, 100)
      setState('recording')
      logger.info('Voice recording resumed')
    }
  }, [state, maxDuration, stopRecording])

  // Discard and re-record
  const discardRecording = useCallback(() => {
    cleanup()
    setRecordingTime(0)
    setAudioUrl(null)
    setPlaybackTime(0)
    audioBlobRef.current = null
    setState('idle')
  }, [cleanup])

  // Play/Pause playback
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying, audioUrl])

  // Submit for transcription
  const submitForTranscription = useCallback(async () => {
    if (!audioBlobRef.current) return

    setState('processing')
    try {
      const formData = new FormData()
      formData.append('audio', audioBlobRef.current, 'recording.webm')

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
      onTranscriptionComplete?.(result.data)
      setState('success')

      logger.info('Voice transcription completed', {
        product: result.data?.produktname,
      })

      // Reset after 3 seconds
      setTimeout(() => {
        discardRecording()
      }, 3000)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Verarbeitung fehlgeschlagen'
      logger.error('Voice processing failed', { error })
      setErrorMessage(message)
      setState('error')
      onError?.(message)
    }
  }, [onTranscription, onTranscriptionComplete, onError, discardRecording])

  // Handle audio playback events
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      audioRef.current = new Audio(audioUrl)

      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime || 0)
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Auto-stop when max duration is reached
  useEffect(() => {
    if (shouldAutoStopRef.current && state === 'recording') {
      shouldAutoStopRef.current = false
      stopRecording()
    }
  }, [recordingTime, state, stopRecording])

  // Progress percentage
  const progressPercent = (recordingTime / maxDuration) * 100

  // Waveform visualization (placeholder dots)
  const renderWaveform = () => {
    const dots = 16
    const activeDots = Math.ceil((recordingTime / maxDuration) * dots)

    return (
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-150 ${
              i < activeDots
                ? state === 'recording'
                  ? 'bg-red-500 animate-pulse'
                  : state === 'paused'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main recording area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Waveform visualization */}
        <div className="mb-4">{renderWaveform()}</div>

        {/* Timer display */}
        <div className="text-center mb-4">
          <span className="text-2xl font-mono text-gray-900 dark:text-white">
            {formatTime(
              state === 'stopped' && isPlaying ? playbackTime : recordingTime
            )}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {' '}
            / {formatTime(maxDuration)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className={`h-2 rounded-full transition-all duration-100 ${
              state === 'recording'
                ? 'bg-red-500'
                : state === 'paused'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4">
          {/* Idle state: Show record button */}
          {state === 'idle' && (
            <Button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <Mic className="w-8 h-8" />
            </Button>
          )}

          {/* Recording state: Show pause and stop */}
          {state === 'recording' && (
            <>
              <Button
                type="button"
                onClick={pauseRecording}
                variant="outline"
                className="w-12 h-12 rounded-full"
              >
                <Pause className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white animate-pulse"
              >
                <Square className="w-6 h-6" />
              </Button>
              <div className="w-12" /> {/* Spacer for balance */}
            </>
          )}

          {/* Paused state: Show resume and stop */}
          {state === 'paused' && (
            <>
              <Button
                type="button"
                onClick={resumeRecording}
                variant="outline"
                className="w-12 h-12 rounded-full"
              >
                <Play className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Square className="w-6 h-6" />
              </Button>
              <div className="w-12" /> {/* Spacer for balance */}
            </>
          )}

          {/* Stopped state: Show playback, discard, and send */}
          {state === 'stopped' && (
            <>
              <Button
                type="button"
                onClick={discardRecording}
                variant="outline"
                className="w-12 h-12 rounded-full text-red-600 border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={togglePlayback}
                variant="outline"
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <Button
                type="button"
                onClick={submitForTranscription}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Send className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Processing state */}
          {state === 'processing' && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Verarbeite...
              </span>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm text-green-600">Erkannt!</span>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <>
              <Button
                type="button"
                onClick={discardRecording}
                variant="outline"
                className="w-12 h-12 rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </>
          )}
        </div>

        {/* Status hint */}
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          {state === 'idle' && 'Klicke zum Aufnehmen'}
          {state === 'recording' && (
            <span className="text-red-600">
              Sprich jetzt... z.B. &quot;Dell Latitude 7470, guter Zustand, 280
              Franken&quot;
            </span>
          )}
          {state === 'paused' && (
            <span className="text-yellow-600">Aufnahme pausiert</span>
          )}
          {state === 'stopped' && 'Anhören und absenden oder neu aufnehmen'}
        </div>
      </div>

      {/* Transcription result */}
      {transcribedText && state === 'success' && (
        <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 px-4 py-3 rounded-lg">
          <span className="font-medium">Erkannt:</span> {transcribedText}
        </div>
      )}

      {/* Error message */}
      {errorMessage && state === 'error' && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
