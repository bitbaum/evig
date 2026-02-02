/**
 * Voice recorder types
 *
 * Shared types for voice recording components.
 */

import type { VoiceProductData, AIFieldMetadata } from '@/types/erfassung'

export type RecorderState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'success'
  | 'error'

export interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void
  onTranscriptionComplete?: (data: VoiceProductData, metadata?: AIFieldMetadata) => void
  onTranscription?: (text: string) => void
  onError?: (error: string) => void
  maxDuration?: number // seconds, default 120
  disabled?: boolean
  className?: string
}

export interface RecordingState {
  state: RecorderState
  recordingTime: number
  errorMessage: string | null
  transcribedText: string | null
}

export interface PlaybackState {
  audioUrl: string | null
  isPlaying: boolean
  playbackTime: number
}

export interface RecordingActions {
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  discardRecording: () => void
}

export interface PlaybackActions {
  togglePlayback: () => void
}

export interface TranscriptionActions {
  submitForTranscription: () => Promise<void>
}
