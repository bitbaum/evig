'use client'

import { Target } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { responsiveTypography } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      <Heading level={2} className={`${responsiveTypography.subsection} font-semibold text-text-primary mb-4 flex items-center`}>
        <Target className="w-5 h-5 mr-2" />
        {t('sections.learningObjectives.title')}
      </Heading>

      <div className="space-y-3">
        {objectives.map((objective, index) => (
          <div key={index} className="flex gap-3">
            <Input
              type="text"
              value={objective}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1"
              placeholder={t('sections.learningObjectives.placeholder')}
            />
            <Button
              type="button"
              variant="destructive-ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              {t('sections.learningObjectives.remove')}
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full py-2 border-2 border-dashed border-default text-text-secondary hover:border-strong hover:text-text-secondary rounded-lg transition-colors"
        >
          {t('sections.learningObjectives.add')}
        </Button>
      </div>
    </div>
  )
}
