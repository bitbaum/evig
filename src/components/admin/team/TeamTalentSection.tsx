'use client'

import { X, Plus } from 'lucide-react'
import { ALL_SKILL_SUGGESTIONS } from '@/config/team'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  skillInput: string
  interestInput: string
  showSkillSuggestions: boolean
  onSetSkillInput: (value: string) => void
  onSetInterestInput: (value: string) => void
  onSetShowSkillSuggestions: (value: boolean) => void
  onChange: (field: string, value: string) => void
  onAddSkill: (skill: string) => void
  onRemoveSkill: (skill: string) => void
  onAddInterest: (interest: string) => void
  onRemoveInterest: (interest: string) => void
}

export function TeamTalentSection({
  form,
  skillInput,
  interestInput,
  showSkillSuggestions,
  onSetSkillInput,
  onSetInterestInput,
  onSetShowSkillSuggestions,
  onChange,
  onAddSkill,
  onRemoveSkill,
  onAddInterest,
  onRemoveInterest,
}: Props) {
  const filteredSkillSuggestions = ALL_SKILL_SUGGESTIONS.filter(
    skill =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !form.skills.includes(skill)
  ).slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Fähigkeiten
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.skills.map(skill => (
            <span
              key={skill}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full"
            >
              {skill}
              <button type="button" onClick={() => onRemoveSkill(skill)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => {
              onSetSkillInput(e.target.value)
              onSetShowSkillSuggestions(true)
            }}
            onFocus={() => onSetShowSkillSuggestions(true)}
            onBlur={() => setTimeout(() => onSetShowSkillSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddSkill(skillInput)
              }
            }}
            placeholder="Fähigkeit hinzufügen..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {showSkillSuggestions && filteredSkillSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {filteredSkillSuggestions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onAddSkill(skill)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Interessen
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.interests.map(interest => (
            <span
              key={interest}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full"
            >
              {interest}
              <button type="button" onClick={() => onRemoveInterest(interest)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => onSetInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddInterest(interestInput)
              }
            }}
            placeholder="Interesse hinzufügen..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => onAddInterest(interestInput)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ziele</label>
        <textarea
          value={form.goals}
          onChange={(e) => onChange('goals', e.target.value)}
          rows={3}
          placeholder="Was möchte die Person erreichen?"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stärken</label>
        <textarea
          value={form.strengths}
          onChange={(e) => onChange('strengths', e.target.value)}
          rows={2}
          placeholder="Worin ist die Person besonders gut?"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entwicklungsbereiche</label>
        <textarea
          value={form.development_areas}
          onChange={(e) => onChange('development_areas', e.target.value)}
          rows={2}
          placeholder="In welchen Bereichen möchte sich die Person entwickeln?"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  )
}
