'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface PracticalDetailsSectionProps {
  durationHours: string
  pricePerPerson: string
  maxParticipants: string
  minParticipants: string
  targetAudience: string
  prerequisites: string
  onChange: (field: string, value: string) => void
}

export function PracticalDetailsSection({
  durationHours,
  pricePerPerson,
  maxParticipants,
  minParticipants,
  targetAudience,
  prerequisites,
  onChange
}: PracticalDetailsSectionProps) {
  const t = useTranslations('workshops.propose')
  const maxParticipantsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
  const minParticipantsOptions = [2, 3, 4, 5, 6, 8, 10]

  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-neutral-900 mb-4 flex items-center`}>
        <Clock className="w-5 h-5 mr-2" />
        {t('sections.practicalDetails.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.duration')}
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={durationHours}
            onChange={(e) => onChange('durationHours', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.price')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pricePerPerson}
            onChange={(e) => onChange('pricePerPerson', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.practicalDetails.pricePlaceholder')}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.maxParticipants')}
          </label>
          <select
            value={maxParticipants}
            onChange={(e) => onChange('maxParticipants', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          >
            {maxParticipantsOptions.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.minParticipants')}
          </label>
          <select
            value={minParticipants}
            onChange={(e) => onChange('minParticipants', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          >
            {minParticipantsOptions.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.targetAudience')}
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => onChange('targetAudience', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.practicalDetails.targetAudiencePlaceholder')}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.prerequisites')}
          </label>
          <textarea
            value={prerequisites}
            onChange={(e) => onChange('prerequisites', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.practicalDetails.prerequisitesPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
