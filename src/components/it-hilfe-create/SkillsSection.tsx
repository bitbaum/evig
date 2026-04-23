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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Heading level={2} className="text-lg font-semibold text-gray-900 mb-2">{t('title')}</Heading>
      <p className="text-sm text-gray-600 mb-4">
        {t('hint')}
      </p>

      {SERVICE_CATEGORIES.map((serviceCategory) => {
        const skills = IT_SKILLS[serviceCategory.id] || []
        if (skills.length === 0) return null
        return (
          <div key={serviceCategory.id} className="mb-4">
            <Heading level={3} className="text-sm font-medium text-gray-700 mb-2">
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
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
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
