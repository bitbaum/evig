import { SERVICE_CATEGORIES, IT_SKILLS } from '@/config/it-hilfe'

interface Props {
  skillsNeeded: string[]
  onSkillToggle: (skillId: string) => void
}

export function SkillsSection({ skillsNeeded, onSkillToggle }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Benötigte Skills</h2>
      <p className="text-sm text-gray-600 mb-4">
        Bereits vorausgewählt basierend auf deinem Gerät. Du kannst anpassen.
      </p>

      {SERVICE_CATEGORIES.map((serviceCategory) => {
        const skills = IT_SKILLS[serviceCategory.id] || []
        if (skills.length === 0) return null
        return (
          <div key={serviceCategory.id} className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {serviceCategory.name}
            </h3>
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
