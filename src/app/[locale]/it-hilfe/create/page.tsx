'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
} from 'lucide-react'
import { type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  getCategoryById,
} from '@/config/it-hilfe'
import { AIDiagnosisCard } from '@/components/it-hilfe/AIDiagnosisCard'
import { ITHilfeImageUpload } from '@/components/it-hilfe/ITHilfeImageUpload'
import { lookupSwissPostalCode } from '@/lib/swiss-postal-codes'
import { ProblemDetailsSection } from '@/components/it-hilfe-create/ProblemDetailsSection'
import { LocationSection } from '@/components/it-hilfe-create/LocationSection'
import { SkillsSection } from '@/components/it-hilfe-create/SkillsSection'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { validateITHilfeForm, transformITHilfeFormToPayload } from '@/lib/domain/it-hilfe'
import type { ITHilfeCreateFormData } from '@/components/it-hilfe-create/types'
import { INITIAL_IT_HILFE_FORM } from '@/components/it-hilfe-create/types'

/** Subset of fields the AI form assist can fill. */
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

export default function CreatePeerRepairPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('itHelp.create')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ITHilfeCreateFormData>(INITIAL_IT_HILFE_FORM)

  // AI assist state
  const [aiFieldMeta, setAiFieldMeta] = useState<Record<string, AIFieldMetadataEntry>>({})

  const updateField = <K extends keyof ITHilfeCreateFormData>(
    key: K,
    value: ITHilfeCreateFormData[K],
  ) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleAIFieldsFilled = (data: Partial<AIFormFields>, metadata: Record<string, AIFieldMetadataEntry>) => {
    setFormData(prev => {
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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/create')
    }
  }, [status, router])

  // Pre-fill location from user's technician profile
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/technician-profile')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (data.success && data.data.profile) {
          const p = data.data.profile
          setFormData(prev => ({
            ...prev,
            postalCode: prev.postalCode || p.postalCode || '',
            city: prev.city || p.city || '',
            canton: prev.canton || p.canton || '',
          }))
        }
      })
      .catch(err => logger.warn('Failed to load technician profile', { error: err }))
  }, [status])

  // Auto-fill city and canton from postal code
  useEffect(() => {
    if (formData.postalCode.length === 4) {
      const data = lookupSwissPostalCode(formData.postalCode)
      if (data) {
        setFormData(prev => ({ ...prev, city: data.city, canton: data.canton }))
      }
    }
  }, [formData.postalCode])

  const handleCategorySelect = (catId: string) => {
    const category = getCategoryById(catId)
    setFormData(prev => {
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
    setFormData(prev => ({
      ...prev,
      skillsNeeded: prev.skillsNeeded.includes(skillId)
        ? prev.skillsNeeded.filter(s => s !== skillId)
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

      const response = await fetch('/api/it-hilfe/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errorCreateFailed'))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/it-hilfe/${data.data.requestId}`)
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorGeneric')
      setError(message)
      logger.error('Error creating peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <Heading level={2} className="text-2xl text-gray-900 mb-2">{t('createdTitle')}</Heading>
          <p className="text-gray-600">{t('createdRedirect')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/it-hilfe"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
            <Heading level={1} className="text-2xl text-gray-900">{t('title')}</Heading>
          </div>
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>

        {error && (
          <ErrorAlert message={error} variant="inline" className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Assist — uses shared AIFormAssist component */}
          <AIFormAssist<AIFormFields>
            formType="it-hilfe"
            placeholder={t('aiPlaceholder')}
            onFieldsFilled={handleAIFieldsFilled}
            currentData={formData as unknown as Record<string, unknown>}
            variant="section"
            defaultExpanded
            className=""
          />

          {formData.aiDiagnosis && (
            <AIDiagnosisCard
              diagnosis={formData.aiDiagnosis}
              deviceInfo={[formData.deviceBrand, formData.deviceModel].filter(Boolean).join(' ') || undefined}
            />
          )}

          {/* Device Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Heading level={2} className="text-lg text-gray-900 mb-4">{t('sectionDevice')}</Heading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.categoryId === cat.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {formData.categoryId && (
            <>
              <ProblemDetailsSection
                deviceBrand={formData.deviceBrand}
                deviceModel={formData.deviceModel}
                title={formData.title}
                description={formData.description}
                onDeviceBrandChange={(v) => updateField('deviceBrand', v)}
                onDeviceModelChange={(v) => updateField('deviceModel', v)}
                onTitleChange={(v) => updateField('title', v)}
                onDescriptionChange={(v) => updateField('description', v)}
                aiFieldMeta={aiFieldMeta}
              />

              <ITHilfeImageUpload
                imageUrls={formData.imageUrls}
                onImagesChange={(v) => updateField('imageUrls', v)}
              />

              <LocationSection
                postalCode={formData.postalCode}
                city={formData.city}
                canton={formData.canton}
                onPostalCodeChange={(v) => updateField('postalCode', v)}
                onCityChange={(v) => updateField('city', v)}
                onCantonChange={(v) => updateField('canton', v)}
              />

              {/* Budget */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Heading level={2} className="text-lg text-gray-900 mb-2">{t('sectionBudget')}</Heading>
                <p className="text-sm text-gray-600 mb-4">
                  {t('budgetDescription')}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">CHF</span>
                  <input
                    type="number"
                    value={formData.maxBudget}
                    onChange={(e) => updateField('maxBudget', e.target.value)}
                    placeholder={t('budgetPlaceholder')}
                    min="0"
                    step="5"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-sm text-gray-500">
                    {!formData.maxBudget ? t('budgetFree') : t('budgetUpTo', { amount: formData.maxBudget })}
                  </span>
                </div>
              </div>

              {/* Service Type & Urgency */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Heading level={2} className="text-lg text-gray-900 mb-4">{t('sectionOptions')}</Heading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('serviceTypeLabel')}
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => updateField('serviceType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {SERVICE_TYPES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('urgencyLabel')}
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => updateField('urgency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {URGENCY_LEVELS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <SkillsSection
                skillsNeeded={formData.skillsNeeded}
                onSkillToggle={handleSkillToggle}
              />

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/it-hilfe"
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('cancelButton')}
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('submittingButton') : t('submitButton')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
