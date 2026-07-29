/** Error banner slice — processing error message plus retry hint when retryable. */

import { AlertCircle } from 'lucide-react'

interface ProtocolErrorBannerProps {
  error: string
  initialProcessingError?: { message: string; retryable: boolean } | null
}

export function ProtocolErrorBanner({ error, initialProcessingError }: ProtocolErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p>{error}</p>
        {initialProcessingError?.retryable && (
          <p className="text-sm mt-1 opacity-80">
            Nutze &ldquo;Erneut verarbeiten&rdquo; weiter unten, um es erneut zu versuchen.
          </p>
        )}
      </div>
    </div>
  )
}
