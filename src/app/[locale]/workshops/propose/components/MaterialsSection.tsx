'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface MaterialsSectionProps {
  materialsProvided: string
  materialsRequired: string
  onChange: (field: string, value: string) => void
}

export function MaterialsSection({
  materialsProvided,
  materialsRequired,
  onChange
}: MaterialsSectionProps) {
  const t = useTranslations('workshops.propose')

  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-neutral-900 mb-4 flex items-center`}>
        <Users className="w-5 h-5 mr-2" />
        {t('sections.materials.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.materials.provided')}
          </label>
          <textarea
            value={materialsProvided}
            onChange={(e) => onChange('materialsProvided', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.materials.providedPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.materials.required')}
          </label>
          <textarea
            value={materialsRequired}
            onChange={(e) => onChange('materialsRequired', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.materials.requiredPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
