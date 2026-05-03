'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { UI_FEEDBACK_MS } from '@/config/limits'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Upload,
  X,
} from 'lucide-react'

interface SellerProfileData {
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  canton: string | null
}

export default function SellerProfileEditPage() {
  const t = useTranslations('dashboard.sellerProfile')
  const { data: session, status } = useSession()
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
    if (status === 'loading') return
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
        setError(t('loadError'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [session, status, router, t])

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
        setSuccess(t('savedSuccess'))
        setNoProfile(false)
        setTimeout(() => setSuccess(null), UI_FEEDBACK_MS.SUCCESS)
      } else {
        setError(result.error || t('saveError'))
      }
    } catch {
      setError(t('unexpectedError'))
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
        setError(result.error || t('uploadError'))
      }
    } finally {
      setIsUploading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToDashboard')}
      </Link>

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-700">
          <Heading level={1} className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            {t('pageTitle')}
          </Heading>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {noProfile ? t('noProfileDesc') : t('editProfileDesc')}
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('displayNameLabel')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('bioLabel')}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={t('bioPlaceholder')}
              className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('avatarLabel')}
            </label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={t('avatarAlt')}
                    className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600"
                  />
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white rounded-full flex items-center justify-center hover:bg-error-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center border border-neutral-200 dark:border-neutral-600">
                  <User className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? t('uploading') : t('uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={t('avatarUrlPlaceholder')}
              className="mt-2 w-full px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('cityLabel')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {t('cantonLabel')}
              </label>
              <input
                type="text"
                value={canton}
                onChange={(e) => setCanton(e.target.value)}
                placeholder={t('cantonPlaceholder')}
                className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 dark:border-neutral-700">
          {error && (
            <div className="mb-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0" />
              <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <p className="text-sm text-primary-800 dark:text-primary-200">{success}</p>
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 font-semibold"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? t('saving') : t('saveProfile')}
          </Button>
        </div>
      </div>
    </div>
  )
}
