'use client'

import { MapPin } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { type PostalCodeData } from '@/lib/swiss-postal-codes'
import { SWISS_CANTONS } from '@/config/swiss-cantons'
import type { ProfileData } from '../hooks/useProfileData'

interface AddressSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string | boolean | string[] | number) => void
  handlePostalCodeChange: (value: string) => void
  handleCitySearch: (value: string) => void
  postalCodeSuggestions: PostalCodeData[]
  showSuggestions: boolean
  selectPostalSuggestion: (suggestion: PostalCodeData) => void
}

export function AddressSection({
  profile,
  handleChange,
  handlePostalCodeChange,
  handleCitySearch,
  postalCodeSuggestions,
  showSuggestions,
  selectPostalSuggestion,
}: AddressSectionProps) {
  const t = useTranslations('dashboard.profile.address')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-secondary-600" />
        </div>
        <div>
          <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white">
            {t('heading')}
          </Heading>
          <p className="text-sm text-neutral-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('streetLabel')}
          </label>
          <input
            type="text"
            value={profile.address_line1}
            onChange={(e) => handleChange('address_line1', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('streetPlaceholder')}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('line2Label')} <span className="text-neutral-400">{t('optional')}</span>
          </label>
          <input
            type="text"
            value={profile.address_line2}
            onChange={(e) => handleChange('address_line2', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('line2Placeholder')}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('plzLabel')}
          </label>
          <input
            type="text"
            value={profile.postal_code}
            onChange={(e) => handlePostalCodeChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="8000"
            maxLength={4}
          />
          <p className="text-xs text-neutral-500 mt-1">{t('plzHint')}</p>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('cityLabel')}
          </label>
          <input
            type="text"
            value={profile.city}
            onChange={(e) => handleCitySearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('cityPlaceholder')}
          />
          {showSuggestions && postalCodeSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {postalCodeSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectPostalSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-600 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="font-medium">{suggestion.city}</div>
                  <div className="text-sm text-neutral-500">{suggestion.postal_code} • {suggestion.canton}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('cantonLabel')}
          </label>
          <select
            value={profile.canton}
            onChange={(e) => handleChange('canton', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('cantonDefault')}</option>
            {SWISS_CANTONS.map((canton) => (
              <option key={canton} value={canton}>{canton}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('countryLabel')}
          </label>
          <input
            type="text"
            value={profile.country}
            onChange={(e) => handleChange('country', e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
