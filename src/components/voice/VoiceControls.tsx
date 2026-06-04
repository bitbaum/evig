'use client'

/**
 * Voice Recording Controls
 *
 * Control buttons for different recording states.
 */

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
import type { RecorderState } from './types'

interface VoiceControlsProps {
  state: RecorderState
  disabled?: boolean
  isPlaying: boolean
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onDiscard: () => void
  onTogglePlayback: () => void
  onSubmit: () => void
}

export function VoiceControls({
  state,
  disabled,
  isPlaying,
  onStart,
  onStop,
  onPause,
  onResume,
  onDiscard,
  onTogglePlayback,
  onSubmit,
}: VoiceControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Idle state: Show record button */}
      {state === 'idle' && (
        <Button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className="w-16 h-16 rounded-full bg-error-500 hover:bg-error-600 text-white"
        >
          <Mic className="w-8 h-8" />
        </Button>
      )}

      {/* Recording state: Show pause and stop */}
      {state === 'recording' && (
        <>
          <Button
            type="button"
            onClick={onPause}
            variant="outline"
            className="w-12 h-12 rounded-full"
          >
            <Pause className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={onStop}
            className="w-16 h-16 rounded-full bg-error-500 hover:bg-error-600 text-white animate-pulse"
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
            onClick={onResume}
            variant="outline"
            className="w-12 h-12 rounded-full"
          >
            <Play className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={onStop}
            variant="warning"
            className="w-16 h-16 rounded-full"
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
            onClick={onDiscard}
            variant="outline"
            className="w-12 h-12 rounded-full text-error-600 border-error-300 hover:bg-error-50 dark:hover:bg-error-900/20"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            onClick={onTogglePlayback}
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
            onClick={onSubmit}
            variant="primary"
            className="w-16 h-16 rounded-full"
          >
            <Send className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Processing state */}
      {state === 'processing' && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-warning-500 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <span className="text-sm text-text-secondary dark:text-text-muted">
            Verarbeite...
          </span>
        </div>
      )}

      {/* Success state */}
      {state === 'success' && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-action flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <span className="text-sm text-action">Erkannt!</span>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <>
          <Button
            type="button"
            onClick={onDiscard}
            variant="outline"
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-error-600" />
          </div>
        </>
      )}
    </div>
  )
}
