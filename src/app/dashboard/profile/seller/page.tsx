'use client'

import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useSellerProfile } from '@/hooks/useSellerProfile'

export default function SellerProfileEditPage() {
  const t = useTranslations('dashboard.sellerProfile')

  const {
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
  } = useSellerProfile({
    loadError: t('loadError'),
    saveError: t('saveError'),
    unexpectedError: t('unexpectedError'),
    uploadError: t('uploadError'),
    savedSuccess: t('savedSuccess'),
  })

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-3 w-3" />
        {t('backToDashboard')}
      </Link>

      <div className="rounded-lg border border-subtle bg-surface-base">
        <div className="border-b border-subtle p-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {noProfile ? t('noProfileDesc') : t('editProfileDesc')}
          </p>
          <Heading
            level={1}
            className="mt-2 flex items-center gap-2 text-2xl font-semibold text-text-primary"
          >
            <User className="h-5 w-5 text-action" />
            {t('pageTitle')}
          </Heading>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('displayNameLabel')}
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('bioLabel')}
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={t('bioPlaceholder')}
              className="resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t('avatarLabel')}
            </label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <div className="relative">
                  <img
                    src={avatarUrl}
                    alt={t('avatarAlt')}
                    className="w-16 h-16 rounded-full object-cover border border-subtle"
                  />
                  <Button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1 -right-1 min-h-0 min-w-0 w-5 h-5 p-0 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center border">
                  <User className="w-6 h-6 text-text-tertiary" />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-default text-sm font-medium text-text-secondary hover:bg-surface-raised transition-colors">
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
            <Input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={t('avatarUrlPlaceholder')}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('cityLabel')}
              </label>
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('cantonLabel')}
              </label>
              <Input
                type="text"
                value={canton}
                onChange={(e) => setCanton(e.target.value)}
                placeholder={t('cantonPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-subtle">
          {error && (
            <div className="mb-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-error-500 shrink-0" />
              <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-action-muted border border-strong rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-action shrink-0" />
              <p className="text-sm text-action-text">{success}</p>
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
