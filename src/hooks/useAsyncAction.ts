'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApiResult { success: boolean; error?: string }

/**
 * One place for the "run a mutating API call, track busy + error, refresh on
 * success" pattern that every admin action component repeated. `busy` holds the
 * KEY of the in-flight action (so a list can disable just the affected row);
 * `run` returns whether it succeeded, so callers can close a form only on success.
 */
export function useAsyncAction() {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (key: string, fn: () => Promise<ApiResult>): Promise<boolean> => {
      setBusy(key)
      setError(null)
      const res = await fn()
      setBusy(null)
      if (!res.success) {
        setError(res.error || 'Aktion fehlgeschlagen')
        return false
      }
      router.refresh()
      return true
    },
    [router],
  )

  return { busy, error, setError, run }
}
