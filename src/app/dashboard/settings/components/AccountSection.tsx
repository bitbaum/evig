'use client'

import { Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
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
        <Heading level={3} className="text-lg font-semibold text-text-primary mb-4">
          {labels.title}
        </Heading>
        <p className="text-sm text-text-secondary mb-6">
          {labels.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-text-secondary mb-2">
              {labels.firstName}
            </label>
            <Input
              type="text"
              id="first_name"
              value={profile.first_name || ''}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder={labels.firstNamePlaceholder}
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-text-secondary mb-2">
              {labels.lastName}
            </label>
            <Input
              type="text"
              id="last_name"
              value={profile.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder={labels.lastNamePlaceholder}
            />
          </div>
        </div>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {labels.email}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-text-muted" />
          </div>
          <Input
            type="email"
            value={email}
            readOnly
            className="pl-10 cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-sm text-text-tertiary">
          {labels.emailDescription}
        </p>
      </div>

      {/* Password Change Link */}
      <div className="border-t-2 border pt-6">
        <Heading level={4} className="text-base font-semibold text-text-primary mb-2">
          {labels.password}
        </Heading>
        <p className="text-sm text-text-secondary mb-4">
          {labels.passwordDescription}
        </p>
        <p className="text-sm text-text-secondary">
          {t('passwordNote')}
        </p>
      </div>

      {/* Danger Zone */}
      <div className="border-t-2 border-error-200 dark:border-error-900 pt-6">
        <Heading level={4} className="text-base font-semibold text-error-600 dark:text-error-400 mb-2">
          {labels.deleteAccount}
        </Heading>
        <p className="text-sm text-text-secondary mb-4">
          {labels.deleteAccountWarning}
        </p>
        <Button
          type="button"
          variant="destructive-outline"
        >
          <Trash2 className="w-4 h-4" />
          {labels.deleteAccountButton}
        </Button>
      </div>
    </div>
  )
}
