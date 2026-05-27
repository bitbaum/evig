'use client'

import { Phone, Mail } from 'lucide-react'
import { CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface ContactInfoSectionProps {
  profile: ProfileData
  email: string
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function ContactInfoSection({ profile, email, handleChange }: ContactInfoSectionProps) {
  const t = useTranslations('dashboard.profile.contactInfo')

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Phone className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('emailLabel')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              value={email}
              disabled
              className="w-full pl-11 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">{t('emailReadOnly')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('phoneLabel')}
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={CONTACT.phonePlaceholderLandline}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('mobileLabel')}
          </label>
          <input
            type="tel"
            value={profile.mobile}
            onChange={(e) => handleChange('mobile', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={CONTACT.phonePlaceholder}
          />
        </div>
      </div>
    </div>
  )
}
