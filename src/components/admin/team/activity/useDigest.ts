'use client'

/**
 * Digest Hook
 *
 * Data fetching hook for activity digest/summary
 */

import { useState, useEffect, useCallback } from 'react'
import type { DigestSummary } from './types'

// ============================================================================
// Digest
// ============================================================================

interface UseDigestReturn {
  digest: DigestSummary | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDigest(since?: string, until?: string, department?: string): UseDigestReturn {
  const [digest, setDigest] = useState<DigestSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDigest = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (since) params.set('since', since)
      if (until) params.set('until', until)
      if (department) params.set('department', department)

      const response = await fetch(`/api/admin/team/digest?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Laden')
      }

      setDigest(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [since, until, department])

  useEffect(() => {
    fetchDigest()
  }, [fetchDigest])

  return { digest, loading, error, refetch: fetchDigest }
}
