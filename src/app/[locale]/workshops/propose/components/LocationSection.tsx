'use client'

import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-text-primary mb-4 flex items-center`}>
        <MapPin className="w-5 h-5 mr-2" />
        {t('sections.location.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('sections.location.typeLabel')}
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="venue"
                checked={locationType === 'venue'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-action focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">{t('sections.location.typeVenue')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={locationType === 'online'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-action focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">{t('sections.location.typeOnline')}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="home"
                checked={locationType === 'home'}
                onChange={(e) => onChange('locationType', e.target.value)}
                className="mr-3 text-action focus:ring-primary-500"
              />
              <span className="text-sm text-text-secondary">{t('sections.location.typeHome')}</span>
            </label>
          </div>
        </div>

        {locationType === 'venue' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.availableVenues')}
              </label>
              {loadingLocations ? (
                <div className="flex items-center space-x-2 text-text-tertiary">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>{t('sections.location.loading')}</span>
                </div>
              ) : availableLocations.length > 0 ? (
                <Select
                  value={selectedLocationId}
                  onChange={(e) => {
                    const selectedLocation = availableLocations.find(loc => loc.id === e.target.value)
                    onLocationSelect(
                      e.target.value,
                      selectedLocation ? `${selectedLocation.name}, ${selectedLocation.city}` : ''
                    )
                  }}
                >
                  <option value="">{t('sections.location.selectVenue')}</option>
                  {availableLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.canton}
                      {location.max_capacity && ` (max. ${location.max_capacity} ${t('sections.location.personsCapacity')})`}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="text-sm text-text-tertiary bg-warning-50 border border-warning-200 rounded-lg p-3">
                  <p>{t('sections.location.noVenues')}</p>
                  <p className="mt-1">{t('sections.location.noVenuesSuggestion')}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.alternativeVenue')}
              </label>
              <Input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                placeholder={t('sections.location.alternativeVenuePlaceholder')}
              />
              <p className="text-xs text-text-tertiary mt-1">
                {t('sections.location.alternativeVenueHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.proposedDate')}
              </label>
              <Input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.proposedTime')}
              </label>
              <Input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
              />
            </div>
          </>
        )}

        {locationType === 'home' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.address')}
              </label>
              <Input
                type="text"
                value={proposedLocation}
                onChange={(e) => onChange('proposedLocation', e.target.value)}
                placeholder={t('sections.location.addressPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.proposedDate')}
              </label>
              <Input
                type="date"
                value={proposedDate}
                onChange={(e) => onChange('proposedDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('sections.location.proposedTime')}
              </label>
              <Input
                type="time"
                value={proposedTime}
                onChange={(e) => onChange('proposedTime', e.target.value)}
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('sections.location.specialRequirements')}
          </label>
          <Textarea
            value={specialRequirements}
            onChange={(e) => onChange('specialRequirements', e.target.value)}
            rows={2}
            placeholder={t('sections.location.specialRequirementsPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
