import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

export interface SuggestionPayload {
  suggestion: string
  contact?: string
  scope: string
  selectedElements: { selector?: string; elementType?: string; elementText?: string; text?: string }[]
  pageUrl?: string
  page?: string
  url?: string
  pageTitle?: string
  pageSection?: string
  timestamp: string
}

/**
 * Submits a suggestion to /api/suggestions.
 * Returns true on success, false on failure (sets errorMessage on failure).
 */
export async function submitSuggestionToAPI(
  payload: SuggestionPayload,
  setError: (msg: string) => void
): Promise<boolean> {
  try {
    const result = await apiFetch<unknown>('/api/suggestions', {
      method: 'POST',
      body: payload,
    })

    if (!result.success) {
      logger.error('Error submitting suggestion', { error: result.error })
      setError('Fehler beim Senden. Bitte versuche es später erneut.')
      return false
    }

    return true
  } catch {
    setError('Fehler beim Senden. Bitte versuche es später erneut.')
    return false
  }
}
