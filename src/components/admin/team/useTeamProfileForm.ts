'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeamProfileMutations } from './useTeamProfiles'
import type { TeamProfileFormProps } from './types'

function resolveInitialOpenSections(
  initialData: TeamProfileFormProps['initialData'],
  isEdit: boolean,
  isSuperAdmin: boolean | undefined,
): Set<string> {
  const open = new Set<string>(['basic'])

  if (!isEdit || !initialData) {
    return open
  }

  const hasCompensation = Boolean(
    initialData.hourly_rate_cents != null
    || initialData.salary_chf != null
    || initialData.salary_effective_date
    || initialData.end_date
    || initialData.exit_reason
    || initialData.ahv_number
    || initialData.canton_tax_code
    || (initialData.work_state && initialData.work_state !== 'active'),
  )

  const hasTalent = Boolean(
    (initialData.skills?.length ?? 0) > 0
    || (initialData.interests?.length ?? 0) > 0
    || initialData.goals
    || initialData.strengths
    || initialData.development_areas,
  )

  const hasAvailability = Boolean(
    initialData.availability
    || initialData.working_hours
    || (initialData.preferred_contact && initialData.preferred_contact !== 'email')
    || initialData.phone,
  )

  const hasEmergency = Boolean(
    initialData.emergency_contact_name
    || initialData.emergency_contact_phone
    || initialData.emergency_contact_relation,
  )

  if (hasCompensation) open.add('compensation')
  if (hasTalent) open.add('talent')
  if (hasAvailability) open.add('availability')
  if (hasEmergency) open.add('emergency')
  if (isSuperAdmin && initialData.hr_notes) open.add('hr')

  return open
}

export interface TeamProfileFormState {
  user_id: string
  position: string
  department: string
  employment_type: string
  start_date: string
  contract_hours: string
  skills: string[]
  interests: string[]
  goals: string
  strengths: string
  development_areas: string
  availability: string
  working_hours: string
  preferred_contact: string
  phone: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  hr_notes: string
  // Phase 4 — compensation + lifecycle. All strings on the form side
  // (parsed on submit); date inputs use ISO date format.
  hourly_rate_chf: string
  salary_chf: string
  salary_effective_date: string
  end_date: string
  exit_reason: string
  ahv_number: string
  canton_tax_code: string
  work_state: string
  is_active: boolean
  show_on_about: boolean
}

export function useTeamProfileForm({
  initialData,
  isEdit,
  profileId,
  onSuccess,
  isSuperAdmin,
}: Pick<TeamProfileFormProps, 'initialData' | 'isEdit' | 'profileId' | 'onSuccess' | 'isSuperAdmin'>) {
  const router = useRouter()
  const { saving, error, createProfile, updateProfile, clearError } = useTeamProfileMutations()

  const [openSections, setOpenSections] = useState<Set<string>>(() =>
    resolveInitialOpenSections(initialData, !!isEdit, isSuperAdmin),
  )

  const [form, setForm] = useState<TeamProfileFormState>({
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
    // Phase 4: rates come back from the API as cents (integer) and CHF
    // decimal strings; we render the rate as franc-with-two-decimals
    // (e.g. 35.00) and parse back to cents on submit.
    hourly_rate_chf: initialData?.hourly_rate_cents != null
      ? (initialData.hourly_rate_cents / 100).toFixed(2)
      : '',
    salary_chf: initialData?.salary_chf != null ? String(initialData.salary_chf) : '',
    salary_effective_date: initialData?.salary_effective_date || '',
    end_date: initialData?.end_date || '',
    exit_reason: initialData?.exit_reason || '',
    ahv_number: initialData?.ahv_number || '',
    canton_tax_code: initialData?.canton_tax_code || '',
    work_state: initialData?.work_state || 'active',
    is_active: initialData?.is_active ?? true,
    show_on_about: initialData?.show_on_about ?? false,
  })

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

  // AI form-fill (SSOT: <AIFormAssist formType="team">). Whitelist ONLY the
  // narrative/talent fields — compensation, AHV, tax, dates and HR notes are
  // never AI-populated (and aren't in the 'team' registry schema either).
  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    const setStr = (field: keyof TeamProfileFormState) => {
      const v = data[field]
      if (typeof v === 'string' && v.trim()) handleChange(field, v.trim())
    }
    const setArr = (field: keyof TeamProfileFormState) => {
      const v = data[field]
      if (Array.isArray(v)) handleChange(field, v.map(String).map(s => s.trim()).filter(Boolean))
    }
    ;(['position', 'goals', 'strengths', 'development_areas', 'availability', 'working_hours'] as const).forEach(setStr)
    ;(['skills', 'interests'] as const).forEach(setArr)
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

    // Strip the franc-string from the payload — we send cents to the API.
    const { hourly_rate_chf, ...rest } = form
    const hourlyRateCents = hourly_rate_chf
      ? Math.round(parseFloat(hourly_rate_chf) * 100)
      : null

    const data = {
      ...rest,
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
      // Phase 4 — null-out empty strings so the API stores NULL, not "".
      hourly_rate_cents: hourlyRateCents,
      salary_chf: form.salary_chf ? parseFloat(form.salary_chf) : null,
      salary_effective_date: form.salary_effective_date || null,
      end_date: form.end_date || null,
      exit_reason: form.exit_reason || null,
      ahv_number: form.ahv_number || null,
      canton_tax_code: form.canton_tax_code || null,
      work_state: form.work_state || 'active',
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

  return {
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
    handleAIFieldsFilled,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    handleSubmit,
  }
}
