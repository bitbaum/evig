'use client'

import { Globe, Lock } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface PublicProfileSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean) => void
}

export function PublicProfileSection({ profile, handleChange }: PublicProfileSectionProps) {
  const t = useTranslations('dashboard.profile.publicProfile')

  return (
    <div className="bg-surface-base rounded-xl shadow-xs border-2 border p-6">
      <Heading level={2} className="text-xl font-semibold text-text-primary mb-6">
        {t('heading')}
      </Heading>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-text-secondary mb-2">
            {t('displayName')}
          </label>
          <Input
            type="text"
            id="display_name"
            value={profile.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            placeholder={t('displayNamePlaceholder')}
            minLength={2}
            maxLength={50}
          />
          <p className="mt-1 text-sm text-text-tertiary">
            {t('displayNameDescription')}
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-text-secondary mb-2">
            {t('bio')}
          </label>
          <Textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder={t('bioPlaceholder')}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <p className="mt-1 text-sm text-text-tertiary">
            {t('bioDescription')}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {profile.bio?.length || 0} / 500
          </p>
        </div>

        {/* Profile Visibility */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            {t('visibility')}
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('profile_visibility', 'public')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                profile.profile_visibility === 'public'
                  ? 'border-action bg-action-muted text-action'
                  : 'border bg-surface-base text-text-secondary hover:border-strong'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="font-medium">{t('visibilityPublic')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('profile_visibility', 'private')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                profile.profile_visibility === 'private'
                  ? 'border-strong bg-surface-raised text-text-secondary'
                  : 'border bg-surface-base text-text-secondary hover:border-strong'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span className="font-medium">{t('visibilityPrivate')}</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-text-tertiary">
            {t('visibilityDescription')}
          </p>
        </div>
      </div>
    </div>
  )
}
