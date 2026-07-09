'use client'

/**
 * Voice Recording Hook
 *
 * Handles the recording state machine including:
 * - Starting/stopping recording
 * - Pause/resume functionality
 * - Timer management
 * - Audio blob creation
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'

/** Mic recorder state machine — owned here (this hook is the recorder SSOT). */
export type RecorderState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'success'
  | 'error'

interface UseVoiceRecordingProps {
  maxDuration: number
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void
  onError?: (error: string) => void
}

interface UseVoiceRecordingReturn {
  state: RecorderState
  setState: (state: RecorderState) => void
  recordingTime: number
  errorMessage: string | null
  setErrorMessage: (message: string | null) => void
  audioUrl: string | null
  audioBlobRef: React.MutableRefObject<Blob | null>
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  discardRecording: () => void
}

export function useVoiceRecording({
  maxDuration,
  onRecordingComplete,
  onError,
}: UseVoiceRecordingProps): UseVoiceRecordingReturn {
  const [state, setState] = useState<RecorderState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  const recordingTimeRef = useRef(0)
  const shouldAutoStopRef = useRef(false)

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
      setRecordingTime(0)
      setAudioUrl(null)

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
    audioBlobRef.current = null
    setState('idle')
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Auto-stop when max duration is reached
  // Use setTimeout to avoid synchronous setState within effect (React best practice)
  useEffect(() => {
    if (shouldAutoStopRef.current && state === 'recording') {
      shouldAutoStopRef.current = false
      // Defer to next tick to avoid synchronous setState in effect body
      const timeoutId = setTimeout(() => {
        stopRecording()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [recordingTime, state, stopRecording])

  return {
    state,
    setState,
    recordingTime,
    errorMessage,
    setErrorMessage,
    audioUrl,
    audioBlobRef,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    discardRecording,
  }
}
