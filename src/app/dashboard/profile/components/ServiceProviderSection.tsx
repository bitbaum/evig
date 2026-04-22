'use client'

import { Wrench } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface ServiceProviderSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function ServiceProviderSection({ profile, handleChange }: ServiceProviderSectionProps) {
  const t = useTranslations('dashboard.profile.serviceProvider')
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Wrench className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('bioLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={t('bioPlaceholder')}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('websiteLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <input
            type="url"
            value={profile.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={t('websitePlaceholder')}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('skillsLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <input
            type="text"
            value={(profile.skills || []).join(', ')}
            onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={t('skillsPlaceholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('skillsHint')}</p>
        </div>

        {/* Expertise Areas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('expertiseLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <input
            type="text"
            value={(profile.expertise_areas || []).join(', ')}
            onChange={(e) => handleChange('expertise_areas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={t('expertisePlaceholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('expertiseHint')}</p>
        </div>

        {/* Service Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('radiusLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <input
            type="number"
            min="1"
            max="500"
            value={profile.service_radius_km || 50}
            onChange={(e) => handleChange('service_radius_km', parseInt(e.target.value) || 50)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{t('radiusHint')}</p>
        </div>
      </div>
    </div>
  )
}
