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
        <span className="text-2xl font-mono text-gray-900 dark:text-white">
          {formatTime(currentTime)}
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
    </>
  )
}

export { formatTime }
