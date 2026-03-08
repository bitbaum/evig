'use client'

/**
 * Current Focus Hook
 *
 * Mutation hook for updating a team member's current focus
 */

import { useState, useCallback } from 'react'

// ============================================================================
// Current Focus
// ============================================================================

interface UseCurrentFocusReturn {
  saving: boolean
  error: string | null
  updateFocus: (profileId: string, focus: string | null) => Promise<boolean>
}

export function useCurrentFocus(): UseCurrentFocusReturn {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFocus = useCallback(async (profileId: string, focus: string | null) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/team/profiles/${profileId}/focus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_focus: focus }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Aktualisieren')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return { saving, error, updateFocus }
}
