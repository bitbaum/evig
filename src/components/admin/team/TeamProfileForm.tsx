'use client'

/**
 * Team Profile Form Component
 *
 * Create/Edit form for team profiles.
 * Progressive disclosure with collapsible sections.
 */

import {
  ArrowLeft,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  User,
  Briefcase,
  Star,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { TeamProfileFormProps } from './types'
import { useTeamProfileForm } from './useTeamProfileForm'
import { TeamBasicInfoSection } from './TeamBasicInfoSection'
import { TeamTalentSection } from './TeamTalentSection'
import { TeamAvailabilitySection } from './TeamAvailabilitySection'
import { TeamEmergencySection } from './TeamEmergencySection'
import { TeamHRNotesSection } from './TeamHRNotesSection'
import { Button } from '@/components/ui/button'

interface FormSection {
  id: string
  label: string
  icon: React.ReactNode
}

const FORM_SECTIONS: FormSection[] = [
  { id: 'basic', label: 'Grundinformationen', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'talent', label: 'Fähigkeiten & Entwicklung', icon: <Star className="w-5 h-5" /> },
  { id: 'availability', label: 'Verfügbarkeit & Kontakt', icon: <Clock className="w-5 h-5" /> },
  { id: 'emergency', label: 'Notfallkontakt', icon: <AlertCircle className="w-5 h-5" /> },
]

export function TeamProfileForm({
  initialData,
  users,
  isEdit,
  profileId,
  onSuccess,
  onCancel,
  isSuperAdmin,
}: TeamProfileFormProps) {
  const {
    form,
    saving,
    error,
    openSections,
    skillInput,
    interestInput,
    showSkillSuggestions,
    setSkillInput,
    setInterestInput,
    setShowSkillSuggestions,
    toggleSection,
    handleChange,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    handleSubmit,
  } = useTeamProfileForm({ initialData, isEdit, profileId, onSuccess, isSuperAdmin })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel || (() => history.back())}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Abbrechen
        </button>
        <Button
          type="submit"
          disabled={saving || (!isEdit && !form.user_id)}
          variant="primary"
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div id="team-profile-error" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* User Selection (only for new profiles) */}
      {!isEdit && users && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Benutzer auswählen</h2>
          </div>
          <select
            value={form.user_id}
            onChange={(e) => handleChange('user_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'team-profile-error' : undefined}
          >
            <option value="">Benutzer wählen...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.email} ({user.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Form Sections */}
      {FORM_SECTIONS.map(section => (
        <div
          key={section.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{section.icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{section.label}</span>
            </div>
            {openSections.has(section.id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.has(section.id) && (
            <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-700">
              {section.id === 'talent' ? (
                <TeamTalentSection
                  form={form}
                  skillInput={skillInput}
                  interestInput={interestInput}
                  showSkillSuggestions={showSkillSuggestions}
                  onSetSkillInput={setSkillInput}
                  onSetInterestInput={setInterestInput}
                  onSetShowSkillSuggestions={setShowSkillSuggestions}
                  onChange={handleChange}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                  onAddInterest={addInterest}
                  onRemoveInterest={removeInterest}
                />
              ) : section.id === 'basic' ? (
                <TeamBasicInfoSection form={form} onChange={handleChange} />
              ) : section.id === 'availability' ? (
                <TeamAvailabilitySection form={form} onChange={handleChange} />
              ) : section.id === 'emergency' ? (
                <TeamEmergencySection form={form} onChange={handleChange} />
              ) : null}
            </div>
          )}
        </div>
      ))}

      {/* HR Notes Section - Super Admin Only */}
      {isSuperAdmin && (
        <TeamHRNotesSection
          hrNotes={form.hr_notes}
          isOpen={openSections.has('hr')}
          onToggle={() => toggleSection('hr')}
          onChange={handleChange}
        />
      )}
    </form>
  )
}
