'use client'

import { Building2, Phone, MapPin } from 'lucide-react'
import { SETTINGS_CONFIG, SWISS_CANTONS, CANTON_NAMES } from '@/config/profile'
import type { ProfileData } from '../../profile/hooks/useProfileData'
import type { PostalCodeData } from '@/lib/swiss-postal-codes'

interface PersonalInfoSectionProps {
  profile: ProfileData
  handleChange: (field: keyof ProfileData, value: string) => void
  handlePostalCodeChange?: (value: string) => void
  handleCitySearch?: (value: string) => void
  postalCodeSuggestions?: PostalCodeData[]
  showSuggestions?: boolean
  selectPostalSuggestion?: (suggestion: PostalCodeData) => void
}

export function PersonalInfoSection({
  profile,
  handleChange,
  handlePostalCodeChange,
  handleCitySearch,
  postalCodeSuggestions = [],
  showSuggestions = false,
  selectPostalSuggestion,
}: PersonalInfoSectionProps) {
  const labels = SETTINGS_CONFIG.labels.personalInfo

  return (
    <div className="space-y-8">
      {/* Company Info */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.company}
          </h3>
        </div>

        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {labels.companyName}
          </label>
          <input
            type="text"
            id="company_name"
            value={profile.company_name || ''}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder={labels.companyNamePlaceholder}
            className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contact Info */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.contact}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.phone}
            </label>
            <input
              type="tel"
              id="phone"
              value={profile.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={labels.phonePlaceholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.mobile}
            </label>
            <input
              type="tel"
              id="mobile"
              value={profile.mobile || ''}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder={labels.mobilePlaceholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {labels.address}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Address Line 1 */}
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.addressLine1}
            </label>
            <input
              type="text"
              id="address_line1"
              value={profile.address_line1 || ''}
              onChange={(e) => handleChange('address_line1', e.target.value)}
              placeholder={labels.addressLine1Placeholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.addressLine2}
            </label>
            <input
              type="text"
              id="address_line2"
              value={profile.address_line2 || ''}
              onChange={(e) => handleChange('address_line2', e.target.value)}
              placeholder={labels.addressLine2Placeholder}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Postal Code and City */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.postalCode}
              </label>
              <input
                type="text"
                id="postal_code"
                value={profile.postal_code || ''}
                onChange={(e) => handlePostalCodeChange?.(e.target.value) || handleChange('postal_code', e.target.value)}
                placeholder={labels.postalCodePlaceholder}
                maxLength={4}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2 relative">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {labels.city}
              </label>
              <input
                type="text"
                id="city"
                value={profile.city || ''}
                onChange={(e) => handleCitySearch?.(e.target.value) || handleChange('city', e.target.value)}
                placeholder={labels.cityPlaceholder}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Postal Code Suggestions */}
              {showSuggestions && postalCodeSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {postalCodeSuggestions.map((suggestion) => (
                    <button
                      key={`${suggestion.postal_code}-${suggestion.city}`}
                      type="button"
                      onClick={() => selectPostalSuggestion?.(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-gray-900 dark:text-white"
                    >
                      {suggestion.postal_code} {suggestion.city} ({suggestion.canton})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canton */}
          <div>
            <label htmlFor="canton" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.canton}
            </label>
            <select
              id="canton"
              value={profile.canton || ''}
              onChange={(e) => handleChange('canton', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Kanton wählen</option>
              {SWISS_CANTONS.map((canton) => (
                <option key={canton} value={canton}>
                  {CANTON_NAMES[canton]}
                </option>
              ))}
            </select>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {labels.country}
            </label>
            <input
              type="text"
              id="country"
              value={profile.country || 'Schweiz'}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
