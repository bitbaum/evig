'use client'

/**
 * Digest Hook
 *
 * Data fetching hook for activity digest/summary
 */

import { useCallback } from 'react'
import { useSwrFetch } from '@/lib/api/swr'
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
  const params = new URLSearchParams()
  if (since) params.set('since', since)
  if (until) params.set('until', until)
  if (department) params.set('department', department)

  const { data, error, isLoading, mutate } = useSwrFetch<DigestSummary>(
    `/api/admin/team/digest?${params.toString()}`,
  )

  const refetch = useCallback(async () => {
    await mutate()
  }, [mutate])

  return {
    digest: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}
