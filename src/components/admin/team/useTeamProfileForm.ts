'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeamProfileMutations } from './useTeamProfiles'
import type { TeamProfileFormProps } from './types'

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
  is_active: boolean
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

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    initial.add('basic')
    initial.add('talent')
    return initial
  })

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
    is_active: initialData?.is_active ?? true,
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
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
    handleSubmit,
  }
}
