'use client'

import { Mail, Trash2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { SETTINGS_CONFIG } from '@/config/profile'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../../profile/hooks/useProfileData'

interface AccountSectionProps {
  profile: ProfileData
  email: string
  handleChange: (field: keyof ProfileData, value: string) => void
}

export function AccountSection({ profile, email, handleChange }: AccountSectionProps) {
  const labels = SETTINGS_CONFIG.labels.account
  const t = useTranslations('dashboard.settings.account')

  return (
    <div className="space-y-8">
      {/* Name Fields */}
      <div>
        <Heading level={3} className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          {labels.title}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          {labels.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {labels.firstName}
            </label>
            <input
              type="text"
              id="first_name"
              value={profile.first_name || ''}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder={labels.firstNamePlaceholder}
              className="w-full px-4 py-2 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {labels.lastName}
            </label>
            <input
              type="text"
              id="last_name"
              value={profile.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder={labels.lastNamePlaceholder}
              className="w-full px-4 py-2 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-info-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {labels.email}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full pl-10 pr-4 py-2 border-2 border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {labels.emailDescription}
        </p>
      </div>

      {/* Password Change Link */}
      <div className="border-t-2 border-neutral-200 dark:border-neutral-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
          {labels.password}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {labels.passwordDescription}
        </p>
        <p className="text-sm text-info-600 dark:text-info-400">
          {t('passwordNote')}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border-t-2 border-error-200 dark:border-error-900 pt-6">
        <Heading level={4} className="text-base font-semibold text-error-600 dark:text-error-400 mb-2">
          {labels.deleteAccount}
        </Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          {labels.deleteAccountWarning}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-error-50 hover:bg-error-100 dark:bg-error-900/20 dark:hover:bg-error-900/30 text-error-600 dark:text-error-400 border-2 border-error-200 dark:border-error-800 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {labels.deleteAccountButton}
        </button>
      </div>
    </div>
  )
}
