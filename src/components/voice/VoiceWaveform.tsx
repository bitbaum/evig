'use client'

/**
 * Voice Waveform Visualization
 *
 * Displays a visual representation of recording progress.
 */

import type { RecorderState } from './types'

interface VoiceWaveformProps {
  recordingTime: number
  maxDuration: number
  state: RecorderState
}

export function VoiceWaveform({ recordingTime, maxDuration, state }: VoiceWaveformProps) {
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
                ? 'bg-error-500 animate-pulse'
                : state === 'paused'
                  ? 'bg-warning-500'
                  : 'bg-primary-500'
              : 'bg-neutral-300 dark:bg-neutral-600'
          }`}
        />
      ))}
    </div>
  )
}
