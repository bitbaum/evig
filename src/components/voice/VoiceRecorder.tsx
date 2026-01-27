'use client'

/**
 * VoiceRecorder Component
 *
 * Refactored to use extracted hooks and components for better maintainability.
 * Original 563 lines -> ~100 lines
 *
 * Hooks extracted:
 * - useVoiceRecording
 * - useAudioPlayback
 * - useVoiceTranscription
 *
 * Components extracted:
 * - VoiceWaveform
 * - VoiceTimer
 * - VoiceControls
 * - VoiceStatusMessage
 *
 * Features:
 * - Recording timer (MM:SS)
 * - Max duration (2 minutes default)
 * - Pause/Resume capability
 * - Waveform visualization
 * - Playback preview before submission
 */

import { useCallback } from 'react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { useAudioPlayback } from '@/hooks/useAudioPlayback'
import { useVoiceTranscription } from '@/hooks/useVoiceTranscription'
import { VoiceWaveform } from './VoiceWaveform'
import { VoiceTimer } from './VoiceTimer'
import { VoiceControls } from './VoiceControls'
import { VoiceStatusMessage } from './VoiceStatusMessage'
import type { VoiceRecorderProps } from './types'

export function VoiceRecorder({
  onRecordingComplete,
  onTranscriptionComplete,
  onTranscription,
  onError,
  maxDuration = 120,
  disabled = false,
  className = '',
}: VoiceRecorderProps) {
  // Recording state and actions
  const {
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
  } = useVoiceRecording({
    maxDuration,
    onRecordingComplete,
    onError,
  })

  // Playback state and actions
  const { isPlaying, playbackTime, togglePlayback, resetPlayback } = useAudioPlayback(audioUrl)

  // Transcription
  const {
    transcribedText,
    setTranscribedText,
    submitForTranscription: submitTranscription,
  } = useVoiceTranscription({
    onTranscription,
    onTranscriptionComplete,
    onError: (message) => {
      setErrorMessage(message)
      setState('error')
    },
    onSuccess: () => {
      setState('success')
      // Reset after 3 seconds
      setTimeout(() => {
        discardRecording()
        resetPlayback()
        setTranscribedText(null)
      }, 3000)
    },
  })

  // Submit handler that uses the audioBlob from recording
  const handleSubmit = useCallback(async () => {
    if (!audioBlobRef.current) return
    setState('processing')
    await submitTranscription(audioBlobRef.current)
  }, [audioBlobRef, setState, submitTranscription])

  // Handle discard with playback reset
  const handleDiscard = useCallback(() => {
    discardRecording()
    resetPlayback()
    setTranscribedText(null)
  }, [discardRecording, resetPlayback, setTranscribedText])

  // Determine display time
  const displayTime = state === 'stopped' && isPlaying ? playbackTime : recordingTime

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main recording area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Waveform visualization */}
        <div className="mb-4">
          <VoiceWaveform
            recordingTime={recordingTime}
            maxDuration={maxDuration}
            state={state}
          />
        </div>

        {/* Timer and progress */}
        <VoiceTimer
          currentTime={displayTime}
          maxDuration={maxDuration}
          state={state}
        />

        {/* Control buttons */}
        <VoiceControls
          state={state}
          disabled={disabled}
          isPlaying={isPlaying}
          onStart={startRecording}
          onStop={stopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onDiscard={handleDiscard}
          onTogglePlayback={togglePlayback}
          onSubmit={handleSubmit}
        />

        {/* Status messages */}
        <VoiceStatusMessage
          state={state}
          transcribedText={transcribedText}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
