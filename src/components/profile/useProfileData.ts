'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { PublicProfile as PublicProfileData } from '@/lib/services/profile-service'

/**
 * Fetches one public profile by id. Owns loading/error state so the
 * PublicProfile component stays a pure composition of render blocks.
 */
export function useProfileData(id: string) {
  const t = useTranslations('profile')
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const result = await apiFetch<{ profile: PublicProfileData }>(`/api/profiles/${id}`)
        if (!active) return
        if (result.success && result.data) setProfile(result.data.profile)
        else setError(result.error || t('notFound'))
      } catch (err) {
        logger.warn('Failed to load public profile', { error: err })
        if (active) setError(t('errorLoading'))
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, t])

  return { profile, isLoading, error }
}
