'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { UI_FEEDBACK_MS } from '@/config/limits'
import type { ProfileData } from './useProfileData'

interface UseProfileFormParams {
  profile: ProfileData
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>
}

export function useProfileForm({ profile, setProfile }: UseProfileFormParams) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    logger.info('Profile save starting', {
      fields: Object.keys(profile).filter(k => profile[k as keyof ProfileData]),
    })

    try {
      const result = await apiFetch<void>('/api/user/profile', {
        method: 'PUT',
        body: profile,
      })

      if (!result.success) {
        logger.error('Profile save failed', {
          error: result.error,
        })
        throw new Error(result.error || 'Speichern fehlgeschlagen')
      }

      logger.info('Profile saved successfully')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), UI_FEEDBACK_MS.SUCCESS)
    } catch (error) {
      logger.error('Profile save error', { error })
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof ProfileData, value: string | boolean | string[] | number) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  return {
    isSaving,
    saveSuccess,
    error,
    handleSubmit,
    handleChange,
  }
}
