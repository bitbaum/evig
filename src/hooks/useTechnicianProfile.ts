'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { UI_FEEDBACK_MS } from '@/config/limits'

export interface TechnicianProfile {
  skills: string[]
  bio: string
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  postalCode: string
  city: string
  canton: string
  maxTravelKm: number
  isActive: boolean
}

const DEFAULT_PROFILE: TechnicianProfile = {
  skills: [],
  bio: '',
  hourlyRateCents: null,
  acceptsGratis: true,
  acceptsKulturlegi: true,
  serviceTypes: ['flexible'],
  postalCode: '',
  city: '',
  canton: '',
  maxTravelKm: 10,
  isActive: false,
}

export function useTechnicianProfile(saveFailed: string) {
  const { status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<TechnicianProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profil/techniker')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchProfile = async () => {
      try {
        const result = await apiFetch<{ profile: TechnicianProfile | null }>(
          '/api/user/technician-profile',
        )
        if (result.success && result.data?.profile) {
          setProfile(result.data.profile)
        } else if (!result.success) {
          logger.warn('Error fetching technician profile', { error: result.error })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [status])

  const handleSkillToggle = (skillId: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }))
  }

  const handleServiceTypeToggle = (typeId: string) => {
    setProfile((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(typeId)
        ? prev.serviceTypes.filter((t) => t !== typeId)
        : [...prev.serviceTypes, typeId],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const result = await apiFetch<unknown>('/api/user/technician-profile', {
        method: 'PUT',
        body: profile,
      })

      if (!result.success) {
        throw new Error(result.error || saveFailed)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), UI_FEEDBACK_MS.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : saveFailed
      setError(message)
      logger.error('Error saving technician profile', { error: err })
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    setProfile,
    loading,
    saving,
    error,
    success,
    authStatus: status,
    handleSkillToggle,
    handleServiceTypeToggle,
    handleSave,
  }
}
