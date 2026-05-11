'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { getCategoryById } from '@/config/it-hilfe'
import { lookupSwissPostalCode } from '@/lib/swiss-postal-codes'
import { validateITHilfeForm, transformITHilfeFormToPayload } from '@/lib/domain/it-hilfe'
import { INITIAL_IT_HILFE_FORM, type ITHilfeCreateFormData } from '@/components/it-hilfe-create/types'
import { type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { UI_FEEDBACK_MS } from '@/config/limits'

interface AIFormFields {
  categoryId: string
  deviceBrand: string
  deviceModel: string
  title: string
  description: string
  urgency: string
  skillsNeeded: string[]
  diagnosis: string
}

export function useCreateITHilfeForm(errorCreateFailed: string, errorGeneric: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ITHilfeCreateFormData>(INITIAL_IT_HILFE_FORM)
  const [aiFieldMeta, setAiFieldMeta] = useState<Record<string, AIFieldMetadataEntry>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/create')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    apiFetch<{ profile: { postalCode?: string; city?: string; canton?: string } | null }>(
      '/api/user/technician-profile',
    ).then((result) => {
      if (result.success && result.data?.profile) {
        const p = result.data.profile
        setFormData((prev) => ({
          ...prev,
          postalCode: prev.postalCode || p.postalCode || '',
          city: prev.city || p.city || '',
          canton: prev.canton || p.canton || '',
        }))
      }
    })
  }, [status])

  useEffect(() => {
    if (formData.postalCode.length === 4) {
      const data = lookupSwissPostalCode(formData.postalCode)
      if (data) {
        setFormData((prev) => ({ ...prev, city: data.city, canton: data.canton }))
      }
    }
  }, [formData.postalCode])

  const updateField = <K extends keyof ITHilfeCreateFormData>(
    key: K,
    value: ITHilfeCreateFormData[K],
  ) => setFormData((prev) => ({ ...prev, [key]: value }))

  const handleAIFieldsFilled = (
    data: Partial<AIFormFields>,
    metadata: Record<string, AIFieldMetadataEntry>,
  ) => {
    setFormData((prev) => {
      const updated = { ...prev }
      if (data.categoryId) {
        updated.categoryId = data.categoryId
        const category = getCategoryById(data.categoryId)
        if (category && !data.skillsNeeded?.length) {
          updated.skillsNeeded = category.suggestedSkills
        }
      }
      if (data.deviceBrand) updated.deviceBrand = data.deviceBrand
      if (data.deviceModel) updated.deviceModel = data.deviceModel
      if (data.title) updated.title = data.title
      if (data.description) updated.description = data.description
      if (data.urgency) updated.urgency = data.urgency
      if (data.skillsNeeded?.length) updated.skillsNeeded = data.skillsNeeded
      if (data.diagnosis) updated.aiDiagnosis = data.diagnosis
      return updated
    })
    setAiFieldMeta(metadata)
  }

  const handleCategorySelect = (catId: string) => {
    const category = getCategoryById(catId)
    setFormData((prev) => {
      const updated = { ...prev, categoryId: catId }
      if (category) {
        const prevCategory = getCategoryById(prev.categoryId)
        if (!prev.title || prev.title === prevCategory?.defaultTitle) {
          updated.title = category.defaultTitle
        }
        if (!prev.description || prev.description === prevCategory?.defaultDescription) {
          updated.description = category.defaultDescription
        }
        updated.skillsNeeded = category.suggestedSkills
      }
      return updated
    })
  }

  const handleSkillToggle = (skillId: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsNeeded: prev.skillsNeeded.includes(skillId)
        ? prev.skillsNeeded.filter((s) => s !== skillId)
        : [...prev.skillsNeeded, skillId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateITHilfeForm(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const payload = transformITHilfeFormToPayload(formData)
      const result = await apiFetch<{ requestId: string }>('/api/it-hilfe/requests', {
        method: 'POST',
        body: payload,
      })

      if (!result.success || !result.data) {
        throw new Error(result.error || errorCreateFailed)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/it-hilfe/${result.data!.requestId}`)
      }, UI_FEEDBACK_MS.REDIRECT)
    } catch (err) {
      const message = err instanceof Error ? err.message : errorGeneric
      setError(message)
      logger.error('Error creating peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }

  return {
    status,
    loading,
    error,
    success,
    formData,
    aiFieldMeta,
    updateField,
    handleAIFieldsFilled,
    handleCategorySelect,
    handleSkillToggle,
    handleSubmit,
  }
}
