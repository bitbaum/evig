'use client'

/**
 * Voice Status Message
 *
 * Displays context-sensitive status hints and messages.
 */

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('components.voiceStatusMessage')
  return (
    <>
      {/* Status hint */}
      <div className="text-center mt-4 text-sm text-text-secondary dark:text-text-muted">
        {state === 'idle' && t('idle')}
        {state === 'recording' && (
          <span className="text-error-600">
            {t('recording')}
          </span>
        )}
        {state === 'paused' && (
          <span className="text-warning-600">{t('paused')}</span>
        )}
        {state === 'stopped' && t('stopped')}
      </div>

      {/* Transcription result */}
      {transcribedText && state === 'success' && (
        <div className="text-sm text-action bg-action-muted px-4 py-3 rounded-lg mt-4">
          <span className="font-medium">{t('recognized')}</span> {transcribedText}
        </div>
      )}

      {/* Error message */}
      {errorMessage && state === 'error' && (
        <div className="text-sm text-error-700 bg-error-50 dark:bg-error-900/20 dark:text-error-300 px-4 py-3 rounded-lg mt-4">
          {errorMessage}
        </div>
      )}
    </>
  )
}
