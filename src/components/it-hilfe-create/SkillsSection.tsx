'use client'

import { useTranslations } from 'next-intl'
import { SERVICE_CATEGORIES, IT_SKILLS } from '@/config/it-hilfe'
import Heading from '@/components/ui/Heading'

interface Props {
  skillsNeeded: string[]
  onSkillToggle: (skillId: string) => void
}

export function SkillsSection({ skillsNeeded, onSkillToggle }: Props) {
  const t = useTranslations('components.skillsSection')
  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-2">{t('title')}</Heading>
      <p className="text-sm text-text-secondary mb-4">
        {t('hint')}
      </p>

      {SERVICE_CATEGORIES.map((serviceCategory) => {
        const skills = IT_SKILLS[serviceCategory.id] || []
        if (skills.length === 0) return null
        return (
          <div key={serviceCategory.id} className="mb-4">
            <Heading level={3} className="text-sm font-medium text-text-secondary mb-2">
              {serviceCategory.name}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => onSkillToggle(skill.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    skillsNeeded.includes(skill.id)
                      ? 'bg-action-muted text-action border-2 border-action'
                      : 'bg-surface-raised text-text-secondary border-2 border-transparent hover:bg-surface-overlay'
                  }`}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
