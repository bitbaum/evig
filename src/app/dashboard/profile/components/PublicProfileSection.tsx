'use client'

import { Globe, Lock } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface PublicProfileSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean) => void
}

export function PublicProfileSection({ profile, handleChange }: PublicProfileSectionProps) {
  const t = useTranslations('dashboard.profile.publicProfile')

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-6">
      <Heading level={2} className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">
        {t('heading')}
      </Heading>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('displayName')}
          </label>
          <input
            type="text"
            id="display_name"
            value={profile.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            placeholder={t('displayNamePlaceholder')}
            minLength={2}
            maxLength={50}
            className="w-full px-4 py-2 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t('displayNameDescription')}
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {t('bio')}
          </label>
          <textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder={t('bioPlaceholder')}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t('bioDescription')}
          </p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {profile.bio?.length || 0} / 500
          </p>
        </div>

        {/* Profile Visibility */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            {t('visibility')}
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('profile_visibility', 'public')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                profile.profile_visibility === 'public'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500'
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
                  ? 'border-neutral-500 bg-neutral-50 dark:bg-neutral-900/20 text-neutral-700 dark:text-neutral-300'
                  : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-500'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span className="font-medium">{t('visibilityPrivate')}</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('visibilityDescription')}
          </p>
        </div>
      </div>
    </div>
  )
}
