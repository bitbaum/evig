'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'

interface SellerProfileData {
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  canton: string | null
}

interface UseSellerProfileErrors {
  loadError: string
  saveError: string
  unexpectedError: string
  uploadError: string
  savedSuccess: string
}

export function useSellerProfile(errors: UseSellerProfileErrors) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [noProfile, setNoProfile] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [city, setCity] = useState('')
  const [canton, setCanton] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const result = await apiFetch<SellerProfileData>('/api/sellers/me')
        if (result.success && result.data) {
          const p = result.data
          setDisplayName(p.display_name || '')
          setBio(p.bio || '')
          setAvatarUrl(p.avatar_url || '')
          setCity(p.city || '')
          setCanton(p.canton || '')
        } else {
          setNoProfile(true)
        }
      } catch {
        setError(errors.loadError)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [session, sessionStatus, router, errors.loadError])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await apiFetch<void>('/api/sellers/me', {
        method: 'PATCH',
        body: {
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          city: city.trim() || null,
          canton: canton.trim() || null,
        },
      })
      if (result.success) {
        setSuccess(errors.savedSuccess)
        setNoProfile(false)
        setTimeout(() => setSuccess(null), UI_FEEDBACK_MS.SUCCESS)
      } else {
        setError(result.error || errors.saveError)
      }
    } catch {
      setError(errors.unexpectedError)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('files', file)
      const result = await apiFetch<{ urls: string[] }>('/api/uploads', {
        method: 'POST',
        body: formData,
        formData: true,
      })
      if (result.success && result.data?.urls?.[0]) {
        setAvatarUrl(result.data.urls[0])
      } else {
        setError(result.error || errors.uploadError)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return {
    sessionStatus,
    isLoading,
    isSaving,
    error,
    success,
    noProfile,
    displayName,
    bio,
    avatarUrl,
    city,
    canton,
    isUploading,
    setDisplayName,
    setBio,
    setAvatarUrl,
    setCity,
    setCanton,
    handleSave,
    handleAvatarUpload,
  }
}
