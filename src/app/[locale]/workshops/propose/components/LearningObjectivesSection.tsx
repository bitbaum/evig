'use client'

import { Target } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography, responsiveButtons } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'

interface LearningObjectivesSectionProps {
  objectives: string[]
  onAdd: () => void
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
}

export function LearningObjectivesSection({
  objectives,
  onAdd,
  onUpdate,
  onRemove
}: LearningObjectivesSectionProps) {
  const t = useTranslations('workshops.propose')

  return (
    <div className="mb-8">
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-neutral-900 mb-4 flex items-center`}>
        <Target className="w-5 h-5 mr-2" />
        {t('sections.learningObjectives.title')}
      </Heading>

      <div className="space-y-3">
        {objectives.map((objective, index) => (
          <div key={index} className="flex gap-3">
            <input
              type="text"
              value={objective}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('sections.learningObjectives.placeholder')}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className={`${responsiveButtons.small} text-error-600 hover:text-error-700 hover:bg-error-50 rounded-lg transition-colors`}
            >
              {t('sections.learningObjectives.remove')}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="w-full py-2 border-2 border-dashed border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
        >
          {t('sections.learningObjectives.add')}
        </button>
      </div>
    </div>
  )
}
