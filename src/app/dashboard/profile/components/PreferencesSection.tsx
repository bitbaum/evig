'use client'

import { Bell, Globe } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface PreferencesSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function PreferencesSection({ profile, handleChange }: PreferencesSectionProps) {
  const t = useTranslations('dashboard.profile.preferences')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('languageLabel')}
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={profile.preferred_language}
              onChange={(e) => handleChange('preferred_language', e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="newsletter"
            type="checkbox"
            checked={profile.newsletter_subscribed}
            onChange={(e) => handleChange('newsletter_subscribed', e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="newsletter" className="text-sm text-neutral-700 dark:text-neutral-300">
            <span className="font-medium">{t('newsletterLabel')}</span>
            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('newsletterDesc')}
            </p>
          </label>
        </div>
      </div>
    </div>
  )
}
