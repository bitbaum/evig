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
      <Heading level={2} className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {t('heading')}
      </Heading>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('displayNameDescription')}
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('bio')}
          </label>
          <textarea
            id="bio"
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder={t('bioPlaceholder')}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('bioDescription')}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {profile.bio?.length || 0} / 500
          </p>
        </div>

        {/* Profile Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t('visibility')}
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('profile_visibility', 'public')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                profile.profile_visibility === 'public'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
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
                  ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span className="font-medium">{t('visibilityPrivate')}</span>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('visibilityDescription')}
          </p>
        </div>
      </div>
    </div>
  )
}
