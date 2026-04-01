'use client'

/**
 * Voice Status Message
 *
 * Displays context-sensitive status hints and messages.
 */

import type { RecorderState } from './types'

interface VoiceStatusMessageProps {
  state: RecorderState
  transcribedText: string | null
  errorMessage: string | null
}

export function VoiceStatusMessage({
  state,
  transcribedText,
  errorMessage,
}: VoiceStatusMessageProps) {
  return (
    <>
      {/* Status hint */}
      <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
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

      {/* Transcription result */}
      {transcribedText && state === 'success' && (
        <div className="text-sm text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-300 px-4 py-3 rounded-lg mt-4">
          <span className="font-medium">Erkannt:</span> {transcribedText}
        </div>
      )}

      {/* Error message */}
      {errorMessage && state === 'error' && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 px-4 py-3 rounded-lg mt-4">
          {errorMessage}
        </div>
      )}
    </>
  )
}
