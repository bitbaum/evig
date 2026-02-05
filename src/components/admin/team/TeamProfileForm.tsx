'use client'

/**
 * Team Profile Form Component
 *
 * Create/Edit form for team profiles.
 * Progressive disclosure with collapsible sections.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  FileText,
  X,
  Plus,
} from 'lucide-react'
import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  CONTACT_METHOD_OPTIONS,
  CONTACT_METHOD_LABELS,
  EMERGENCY_RELATION_OPTIONS,
  EMERGENCY_RELATION_LABELS,
  ALL_SKILL_SUGGESTIONS,
  type Department,
  type EmploymentType,
  type ContactMethod,
  type EmergencyRelation,
} from '@/config/team'
import { useTeamProfileMutations } from './useTeamProfiles'
import type { TeamProfileFormProps } from './types'

interface FormSection {
  id: string
  label: string
  icon: React.ReactNode
  defaultOpen: boolean
}

const FORM_SECTIONS: FormSection[] = [
  { id: 'basic', label: 'Grundinformationen', icon: <Briefcase className="w-5 h-5" />, defaultOpen: true },
  { id: 'talent', label: 'Fähigkeiten & Entwicklung', icon: <Star className="w-5 h-5" />, defaultOpen: true },
  { id: 'availability', label: 'Verfügbarkeit & Kontakt', icon: <Clock className="w-5 h-5" />, defaultOpen: false },
  { id: 'emergency', label: 'Notfallkontakt', icon: <AlertCircle className="w-5 h-5" />, defaultOpen: false },
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
  const router = useRouter()
  const { saving, error, createProfile, updateProfile, clearError } = useTeamProfileMutations()

  // Section visibility
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    FORM_SECTIONS.forEach(s => {
      if (s.defaultOpen) initial.add(s.id)
    })
    return initial
  })

  // Form state
  const [form, setForm] = useState({
    user_id: initialData?.user_id || '',
    position: initialData?.position || '',
    department: initialData?.department || '',
    employment_type: initialData?.employment_type || '',
    start_date: initialData?.start_date || '',
    contract_hours: initialData?.contract_hours?.toString() || '',
    skills: initialData?.skills || [],
    interests: initialData?.interests || [],
    goals: initialData?.goals || '',
    strengths: initialData?.strengths || '',
    development_areas: initialData?.development_areas || '',
    availability: initialData?.availability || '',
    working_hours: initialData?.working_hours || '',
    preferred_contact: initialData?.preferred_contact || 'email',
    phone: initialData?.phone || '',
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    emergency_contact_relation: initialData?.emergency_contact_relation || '',
    hr_notes: initialData?.hr_notes || '',
    is_active: initialData?.is_active ?? true,
  })

  // Tag input state
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    clearError()
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (trimmed && !form.skills.includes(trimmed)) {
      handleChange('skills', [...form.skills, trimmed])
    }
    setSkillInput('')
    setShowSkillSuggestions(false)
  }

  const removeSkill = (skill: string) => {
    handleChange('skills', form.skills.filter(s => s !== skill))
  }

  const addInterest = (interest: string) => {
    const trimmed = interest.trim()
    if (trimmed && !form.interests.includes(trimmed)) {
      handleChange('interests', [...form.interests, trimmed])
    }
    setInterestInput('')
  }

  const removeInterest = (interest: string) => {
    handleChange('interests', form.interests.filter(i => i !== interest))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      ...form,
      contract_hours: form.contract_hours ? parseInt(form.contract_hours) : null,
      start_date: form.start_date || null,
      department: form.department || null,
      employment_type: form.employment_type || null,
      position: form.position || null,
      goals: form.goals || null,
      strengths: form.strengths || null,
      development_areas: form.development_areas || null,
      availability: form.availability || null,
      working_hours: form.working_hours || null,
      phone: form.phone || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      emergency_contact_relation: form.emergency_contact_relation || null,
      hr_notes: isSuperAdmin ? (form.hr_notes || null) : undefined,
    }

    try {
      if (isEdit && profileId) {
        await updateProfile(profileId, data)
      } else {
        await createProfile(data)
      }
      onSuccess?.()
      router.push('/admin/team')
    } catch {
      // Error is already set in hook
    }
  }

  const filteredSkillSuggestions = ALL_SKILL_SUGGESTIONS.filter(
    skill =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !form.skills.includes(skill)
  ).slice(0, 5)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel || (() => router.back())}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving || (!isEdit && !form.user_id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Speichern' : 'Erstellen'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* User Selection (only for new profiles) */}
      {!isEdit && users && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Benutzer auswählen
            </h2>
          </div>
          <select
            value={form.user_id}
            onChange={(e) => handleChange('user_id', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            required
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
              <span className="font-semibold text-gray-900 dark:text-white">
                {section.label}
              </span>
            </div>
            {openSections.has(section.id) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {openSections.has(section.id) && (
            <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-700">
              {section.id === 'basic' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      placeholder="z.B. Techniker, Werkstattleiter"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Abteilung
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Keine Abteilung</option>
                      {DEPARTMENT_OPTIONS.map(dept => (
                        <option key={dept} value={dept}>
                          {DEPARTMENT_LABELS[dept as Department]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Beschäftigungsart
                    </label>
                    <select
                      value={form.employment_type}
                      onChange={(e) => handleChange('employment_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Auswählen...</option>
                      {EMPLOYMENT_TYPE_OPTIONS.map(type => (
                        <option key={type} value={type}>
                          {EMPLOYMENT_TYPE_LABELS[type as EmploymentType]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vertragsstunden (pro Woche)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.contract_hours}
                      onChange={(e) => handleChange('contract_hours', e.target.value)}
                      placeholder="z.B. 20"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      Aktiv
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Inaktive Profile werden in der Liste ausgegraut angezeigt
                    </p>
                  </div>
                </div>
              )}

              {section.id === 'talent' && (
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
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-red-500"
                          >
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
                          setSkillInput(e.target.value)
                          setShowSkillSuggestions(true)
                        }}
                        onFocus={() => setShowSkillSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill(skillInput)
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
                              onClick={() => addSkill(skill)}
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
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={interestInput}
                        onChange={(e) => setInterestInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addInterest(interestInput)
                          }
                        }}
                        placeholder="Interesse hinzufügen..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => addInterest(interestInput)}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ziele
                    </label>
                    <textarea
                      value={form.goals}
                      onChange={(e) => handleChange('goals', e.target.value)}
                      rows={3}
                      placeholder="Was möchte die Person erreichen?"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stärken
                    </label>
                    <textarea
                      value={form.strengths}
                      onChange={(e) => handleChange('strengths', e.target.value)}
                      rows={2}
                      placeholder="Worin ist die Person besonders gut?"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entwicklungsbereiche
                    </label>
                    <textarea
                      value={form.development_areas}
                      onChange={(e) => handleChange('development_areas', e.target.value)}
                      rows={2}
                      placeholder="In welchen Bereichen möchte sich die Person entwickeln?"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {section.id === 'availability' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Arbeitszeiten
                    </label>
                    <input
                      type="text"
                      value={form.working_hours}
                      onChange={(e) => handleChange('working_hours', e.target.value)}
                      placeholder="z.B. Mo-Fr 9-17 Uhr"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bevorzugte Kontaktart
                    </label>
                    <select
                      value={form.preferred_contact}
                      onChange={(e) => handleChange('preferred_contact', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {CONTACT_METHOD_OPTIONS.map(method => (
                        <option key={method} value={method}>
                          {CONTACT_METHOD_LABELS[method as ContactMethod]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+41 79 123 45 67"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Allgemeine Verfügbarkeit
                    </label>
                    <textarea
                      value={form.availability}
                      onChange={(e) => handleChange('availability', e.target.value)}
                      rows={2}
                      placeholder="z.B. Dienstags und Donnerstags ganztags, ansonsten nach Absprache"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {section.id === 'emergency' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.emergency_contact_name}
                      onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                      placeholder="Vor- und Nachname"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={form.emergency_contact_phone}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      placeholder="+41 79 123 45 67"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Beziehung
                    </label>
                    <select
                      value={form.emergency_contact_relation}
                      onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Auswählen...</option>
                      {EMERGENCY_RELATION_OPTIONS.map(relation => (
                        <option key={relation} value={relation}>
                          {EMERGENCY_RELATION_LABELS[relation as EmergencyRelation]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* HR Notes Section - Super Admin Only */}
      {isSuperAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('hr')}
            className="w-full flex items-center justify-between p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900 dark:text-yellow-200">
                HR-Notizen (Vertraulich)
              </span>
            </div>
            {openSections.has('hr') ? (
              <ChevronDown className="w-5 h-5 text-yellow-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-yellow-600" />
            )}
          </button>

          {openSections.has('hr') && (
            <div className="p-6 pt-2 border-t border-yellow-200 dark:border-yellow-800">
              <textarea
                value={form.hr_notes}
                onChange={(e) => handleChange('hr_notes', e.target.value)}
                rows={4}
                placeholder="Vertrauliche HR-Notizen (nur für Super-Admins sichtbar)..."
                className="w-full px-4 py-2 border border-yellow-300 dark:border-yellow-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Diese Notizen sind nur für Super-Admins sichtbar.
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
