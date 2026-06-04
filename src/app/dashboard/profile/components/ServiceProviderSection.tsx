'use client'

import { Wrench } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslations } from 'next-intl'
import type { ProfileData } from '../hooks/useProfileData'

interface ServiceProviderSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
}

export function ServiceProviderSection({ profile, handleChange }: ServiceProviderSectionProps) {
  const t = useTranslations('dashboard.profile.serviceProvider')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <Wrench className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('bioLabel')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <Textarea
            value={profile.bio || ''}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={4}
            placeholder={t('bioPlaceholder')}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('websiteLabel')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <Input
            type="url"
            value={profile.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder={t('websitePlaceholder')}
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('skillsLabel')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <Input
            type="text"
            value={(profile.skills || []).join(', ')}
            onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            placeholder={t('skillsPlaceholder')}
          />
          <p className="text-xs text-neutral-500 mt-1">{t('skillsHint')}</p>
        </div>

        {/* Expertise Areas */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('expertiseLabel')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <Input
            type="text"
            value={(profile.expertise_areas || []).join(', ')}
            onChange={(e) => handleChange('expertise_areas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            placeholder={t('expertisePlaceholder')}
          />
          <p className="text-xs text-neutral-500 mt-1">{t('expertiseHint')}</p>
        </div>

        {/* Service Radius */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('radiusLabel')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <Input
            type="number"
            min="1"
            max="500"
            value={profile.service_radius_km || 50}
            onChange={(e) => handleChange('service_radius_km', parseInt(e.target.value) || 50)}
          />
          <p className="text-xs text-neutral-500 mt-1">{t('radiusHint')}</p>
        </div>
      </div>
    </div>
  )
}
