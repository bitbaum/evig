'use client'

/**
 * Voice Timer Display
 *
 * Displays current recording/playback time and progress bar.
 */

import type { RecorderState } from './types'

interface VoiceTimerProps {
  currentTime: number
  maxDuration: number
  state: RecorderState
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function VoiceTimer({ currentTime, maxDuration, state }: VoiceTimerProps) {
  const progressPercent = (currentTime / maxDuration) * 100

  return (
    <>
      {/* Timer display */}
      <div className="text-center mb-4">
        <span className="text-2xl font-mono text-text-primary">
          {formatTime(currentTime)}
        </span>
        <span className="text-text-secondary dark:text-text-muted">
          {' '}
          / {formatTime(maxDuration)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2 mb-6">
        <div
          className={`h-2 rounded-full transition-all duration-100 ${
            state === 'recording'
              ? 'bg-error-500'
              : state === 'paused'
                ? 'bg-warning-500'
                : 'bg-action'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </>
  )
}

export { formatTime }
