'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { Textarea } from '@/components/ui/textarea'

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
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-text-primary mb-4 flex items-center`}>
        <Users className="w-5 h-5 mr-2" />
        {t('sections.materials.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('sections.materials.provided')}
          </label>
          <Textarea
            value={materialsProvided}
            onChange={(e) => onChange('materialsProvided', e.target.value)}
            rows={3}
            placeholder={t('sections.materials.providedPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('sections.materials.required')}
          </label>
          <Textarea
            value={materialsRequired}
            onChange={(e) => onChange('materialsRequired', e.target.value)}
            rows={3}
            placeholder={t('sections.materials.requiredPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
