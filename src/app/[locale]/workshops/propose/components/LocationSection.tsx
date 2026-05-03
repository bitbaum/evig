'use client'

import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface WorkshopLocation {
  id: string
  name: string
  address?: string
  city?: string
  canton?: string
  capacity?: number
  max_capacity?: number
}

interface LocationSectionProps {
  locationType: 'venue' | 'online' | 'home'
  selectedLocationId: string
  proposedLocation: string
  proposedDate: string
  proposedTime: string
  specialRequirements: string
  availableLocations: WorkshopLocation[]
  loadingLocations: boolean
  onChange: (field: string, value: string) => void
  onLocationSelect: (locationId: string, locationName: string) => void
}

export function LocationSection({
  locationType,
  selectedLocationId,
  proposedLocation,
  proposedDate,
  proposedTime,
  specialRequirements,
  availableLocations,
  loadingLocations,
  onChange,
  onLocationSelect
}: LocationSectionProps) {
  const t = useTranslations('workshops.propose')

  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-neutral-900 mb-4 flex items-center`}>
        <MapPin className="w-5 h-5 mr-2" />
        {t('sections.location.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.location.typeLabel')}
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="venue"
                checked={locationType === 'venue'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">{t('sections.location.typeVenue')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={locationType === 'online'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">{t('sections.location.typeOnline')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="home"
                checked={locationType === 'home'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">{t('sections.location.typeHome')}</span>
            </label>
          </div>
        </div>

        {locationType === 'venue' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.availableVenues')}
              </label>
              {loadingLocations ? (
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>{t('sections.location.loading')}</span>
                </div>
              ) : availableLocations.length > 0 ? (
                <select
                  value={selectedLocationId}
                  onChange={(e) => {
                    const selectedLocation = availableLocations.find(loc => loc.id === e.target.value)
                    onLocationSelect(
                      e.target.value,
                      selectedLocation ? `${selectedLocation.name}, ${selectedLocation.city}` : ''
                    )
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('sections.location.selectVenue')}</option>
                  {availableLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.canton}
                      {location.max_capacity && ` (max. ${location.max_capacity} ${t('sections.location.personsCapacity')})`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-neutral-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p>{t('sections.location.noVenues')}</p>
                  <p className="mt-1">{t('sections.location.noVenuesSuggestion')}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.alternativeVenue')}
              </label>
              <input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('sections.location.alternativeVenuePlaceholder')}
              />
              <p className="text-xs text-neutral-500 mt-1">
                {t('sections.location.alternativeVenueHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.proposedDate')}
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.proposedTime')}
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {locationType === 'home' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.address')}
              </label>
              <input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('sections.location.addressPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.proposedDate')}
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('sections.location.proposedTime')}
              </label>
              <input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.location.specialRequirements')}
          </label>
          <textarea
            value={specialRequirements}
            onChange={(e) => onChange('specialRequirements', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.location.specialRequirementsPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
