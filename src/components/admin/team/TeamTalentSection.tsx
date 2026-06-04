'use client'

import { X, Plus } from 'lucide-react'
import { ALL_SKILL_SUGGESTIONS } from '@/config/team'
import type { TeamProfileFormState } from './useTeamProfileForm'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

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
      {/* Skills — combobox with autocomplete overlay */}
      <FormField label="Fähigkeiten">
        <div className="flex flex-wrap gap-2 mb-2">
          {form.skills.map(skill => (
            <span
              key={skill}
              className="flex items-center gap-1 px-3 py-1 bg-surface-raised dark:bg-neutral-700 text-text-secondary text-sm rounded-full"
            >
              {skill}
              <button type="button" onClick={() => onRemoveSkill(skill)} className="hover:text-error-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <Input
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
          />
          {showSkillSuggestions && filteredSkillSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-surface-base border border rounded-lg shadow-lg">
              {filteredSkillSuggestions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onAddSkill(skill)}
                  className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-sm"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>
      </FormField>

      {/* Interests */}
      <FormField label="Interessen">
        <div className="flex flex-wrap gap-2 mb-2">
          {form.interests.map(interest => (
            <span
              key={interest}
              className="flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full"
            >
              {interest}
              <button type="button" onClick={() => onRemoveInterest(interest)} className="hover:text-error-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
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
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onAddInterest(interestInput)}
            className="px-3 py-2 bg-surface-raised dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </FormField>

      <FormField label="Ziele" htmlFor="goals">
        <Textarea
          id="goals"
          value={form.goals}
          onChange={(e) => onChange('goals', e.target.value)}
          rows={3}
          placeholder="Was möchte die Person erreichen?"
        />
      </FormField>

      <FormField label="Stärken" htmlFor="strengths">
        <Textarea
          id="strengths"
          value={form.strengths}
          onChange={(e) => onChange('strengths', e.target.value)}
          rows={2}
          placeholder="Worin ist die Person besonders gut?"
        />
      </FormField>

      <FormField label="Entwicklungsbereiche" htmlFor="development_areas">
        <Textarea
          id="development_areas"
          value={form.development_areas}
          onChange={(e) => onChange('development_areas', e.target.value)}
          rows={2}
          placeholder="In welchen Bereichen möchte sich die Person entwickeln?"
        />
      </FormField>
    </div>
  )
}
