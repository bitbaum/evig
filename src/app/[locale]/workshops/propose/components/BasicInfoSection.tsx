'use client'

import { BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { WORKSHOP_CATEGORIES, WORKSHOP_LEVELS } from '@/config/workshops'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface BasicInfoSectionProps {
  title: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  shortDescription: string
  description: string
  onChange: (field: string, value: string) => void
}

export function BasicInfoSection({
  title,
  category,
  level,
  shortDescription,
  description,
  onChange
}: BasicInfoSectionProps) {
  const t = useTranslations('workshops.propose')

  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-neutral-900 mb-4 flex items-center`}>
        <BookOpen className="w-5 h-5 mr-2" />
        {t('sections.basicInfo.title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.basicInfo.titleField')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.basicInfo.titlePlaceholder')}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.basicInfo.category')}
          </label>
          <select
            value={category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          >
            <option value="">{t('sections.basicInfo.categoryPlaceholder')}</option>
            {WORKSHOP_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.basicInfo.level')}
          </label>
          <select
            value={level}
            onChange={(e) => onChange('level', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            aria-required="true"
          >
            {WORKSHOP_LEVELS.filter(l => l.id !== 'all').map(lvl => (
              <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.basicInfo.shortDescription')}
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => onChange('shortDescription', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.basicInfo.shortDescriptionPlaceholder')}
            required
            aria-required="true"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('sections.basicInfo.detailedDescription')}
          </label>
          <textarea
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('sections.basicInfo.detailedDescriptionPlaceholder')}
            required
            aria-required="true"
          />
        </div>
      </div>
    </div>
  )
}
