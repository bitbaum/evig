'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { getCategoryById, URGENCY, REQUEST_STATUS } from '@/config/it-hilfe'
import { lookupSwissPostalCode } from '@/lib/swiss-postal-codes'
import { validateITHilfeForm, transformITHilfeFormToPayload } from '@/lib/domain/it-hilfe'
import { type ITHilfeCreateFormData } from '@/components/it-hilfe-create/types'
import { UI_FEEDBACK_MS } from '@/config/limits'

interface RequestData {
  isOwner: boolean
  status: string
  categoryId?: string
  deviceBrand?: string
  deviceModel?: string
  title?: string
  description?: string
  urgency?: string
  budgetAmountCents?: number
  postalCode?: string
  city?: string
  canton?: string
  serviceType?: string
  skillsNeeded?: string[]
  imageUrls?: string[]
  aiDiagnosis?: string
}

interface UseEditITHilfeFormErrors {
  errorNotFound: string
  errorNotOwner: string
  errorNotEditable: string
  errorSaveFailed: string
  errorGeneric: string
}

export function useEditITHilfeForm(id: string, errors: UseEditITHilfeFormErrors) {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ITHilfeCreateFormData | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/it-hilfe/${id}/edit`)
    }
  }, [authStatus, router, id])

  useEffect(() => {
    if (authStatus !== 'authenticated') return

    apiFetch<{ request: RequestData }>(`/api/it-hilfe/requests/${id}`).then((result) => {
      if (!result.success || !result.data) {
        setError(result.error || errors.errorNotFound)
        setLoading(false)
        return
      }

      const r = result.data.request

      if (!r.isOwner) {
        setError(errors.errorNotOwner)
        setLoading(false)
        return
      }

      if (r.status !== REQUEST_STATUS.OPEN) {
        setError(errors.errorNotEditable)
        setLoading(false)
        return
      }

      setFormData({
        categoryId: r.categoryId || '',
        deviceBrand: r.deviceBrand || '',
        deviceModel: r.deviceModel || '',
        title: r.title || '',
        description: r.description || '',
        urgency: r.urgency || URGENCY.NORMAL,
        maxBudget: r.budgetAmountCents ? String(r.budgetAmountCents / 100) : '',
        postalCode: r.postalCode || '',
        city: r.city || '',
        canton: r.canton || '',
        serviceType: r.serviceType || 'flexible',
        skillsNeeded: r.skillsNeeded || [],
        imageUrls: r.imageUrls || [],
        aiDiagnosis: r.aiDiagnosis || '',
      })
      setLoading(false)
    })
  }, [id, authStatus, errors.errorNotFound, errors.errorNotOwner, errors.errorNotEditable])

  useEffect(() => {
    if (formData?.postalCode?.length === 4) {
      const data = lookupSwissPostalCode(formData.postalCode)
      if (data) {
        setFormData((prev) => prev ? { ...prev, city: data.city, canton: data.canton } : prev)
      }
    }
  }, [formData?.postalCode])

  const updateField = <K extends keyof ITHilfeCreateFormData>(
    key: K,
    value: ITHilfeCreateFormData[K],
  ) => setFormData((prev) => prev ? { ...prev, [key]: value } : prev)

  const handleCategorySelect = (catId: string) => {
    const category = getCategoryById(catId)
    setFormData((prev) => {
      if (!prev) return prev
      const updated = { ...prev, categoryId: catId }
      if (category) {
        updated.skillsNeeded = category.suggestedSkills
      }
      return updated
    })
  }

  const handleSkillToggle = (skillId: string) => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        skillsNeeded: prev.skillsNeeded.includes(skillId)
          ? prev.skillsNeeded.filter((s) => s !== skillId)
          : [...prev.skillsNeeded, skillId],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setError('')

    const validationError = validateITHilfeForm(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = transformITHilfeFormToPayload(formData)
      const result = await apiFetch<unknown>(`/api/it-hilfe/requests/${id}`, {
        method: 'PUT',
        body: payload,
      })

      if (!result.success) {
        throw new Error(result.error || errors.errorSaveFailed)
      }

      setSuccess(true)
      setTimeout(() => router.push(`/it-hilfe/${id}`), UI_FEEDBACK_MS.REDIRECT)
    } catch (err) {
      const message = err instanceof Error ? err.message : errors.errorGeneric
      setError(message)
      logger.error('Error updating request', { error: err })
    } finally {
      setSaving(false)
    }
  }

  return {
    authStatus,
    loading,
    saving,
    error,
    success,
    formData,
    updateField,
    handleCategorySelect,
    handleSkillToggle,
    handleSubmit,
  }
}
