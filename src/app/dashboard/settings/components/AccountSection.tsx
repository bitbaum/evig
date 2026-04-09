'use client'

import { Mail, Trash2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { SETTINGS_CONFIG } from '@/config/profile'
import type { ProfileData } from '../../profile/hooks/useProfileData'

interface AccountSectionProps {
  profile: ProfileData
  email: string
  handleChange: (field: keyof ProfileData, value: string) => void
}

export function AccountSection({ profile, email, handleChange }: AccountSectionProps) {
  const labels = SETTINGS_CONFIG.labels.account

  return (
    <div className="space-y-8">
      {/* Name Fields */}
      <div>
        <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {labels.title}
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {labels.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.firstName}
            </label>
            <input
              type="text"
              id="first_name"
              value={profile.first_name || ''}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder={labels.firstNamePlaceholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.lastName}
            </label>
            <input
              type="text"
              id="last_name"
              value={profile.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder={labels.lastNamePlaceholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {labels.email}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {labels.emailDescription}
        </p>
      </div>

      {/* Password Change Link */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <Heading level={4} className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {labels.password}
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {labels.passwordDescription}
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Password ändern wird über die Profil-Seite verwaltet (wird später hier integriert)
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border-t-2 border-red-200 dark:border-red-900 pt-6">
        <Heading level={4} className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">
          {labels.deleteAccount}
        </Heading>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {labels.deleteAccountWarning}
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {labels.deleteAccountButton}
        </button>
      </div>
    </div>
  )
}
