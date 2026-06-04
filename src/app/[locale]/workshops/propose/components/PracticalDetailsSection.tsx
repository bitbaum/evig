'use client'

import { Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { WORKSHOP_MAX_PARTICIPANTS_OPTIONS, WORKSHOP_DURATION_OPTIONS } from '@/config/workshops'

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
          <Input
            type="number"
            min="1"
            max="8"
            value={durationHours}
            onChange={(e) => onChange('durationHours', e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.price')}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={pricePerPerson}
            onChange={(e) => onChange('pricePerPerson', e.target.value)}
            placeholder={t('sections.practicalDetails.pricePlaceholder')}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.maxParticipants')}
          </label>
          <Select
            value={maxParticipants}
            onChange={(e) => onChange('maxParticipants', e.target.value)}
            required
            aria-required="true"
          >
            {WORKSHOP_MAX_PARTICIPANTS_OPTIONS.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.minParticipants')}
          </label>
          <Select
            value={minParticipants}
            onChange={(e) => onChange('minParticipants', e.target.value)}
            required
            aria-required="true"
          >
            {WORKSHOP_DURATION_OPTIONS.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.targetAudience')}
          </label>
          <Input
            type="text"
            value={targetAudience}
            onChange={(e) => onChange('targetAudience', e.target.value)}
            placeholder={t('sections.practicalDetails.targetAudiencePlaceholder')}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.practicalDetails.prerequisites')}
          </label>
          <Textarea
            value={prerequisites}
            onChange={(e) => onChange('prerequisites', e.target.value)}
            rows={2}
            placeholder={t('sections.practicalDetails.prerequisitesPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
