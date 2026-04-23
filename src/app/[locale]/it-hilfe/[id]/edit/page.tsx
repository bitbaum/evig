'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  getCategoryById,
  REQUEST_STATUS,
} from '@/config/it-hilfe'
import { ITHilfeImageUpload } from '@/components/it-hilfe/ITHilfeImageUpload'
import { lookupSwissPostalCode } from '@/lib/swiss-postal-codes'
import { ProblemDetailsSection } from '@/components/it-hilfe-create/ProblemDetailsSection'
import { LocationSection } from '@/components/it-hilfe-create/LocationSection'
import { SkillsSection } from '@/components/it-hilfe-create/SkillsSection'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { validateITHilfeForm, transformITHilfeFormToPayload } from '@/lib/domain/it-hilfe'
import type { ITHilfeCreateFormData } from '@/components/it-hilfe-create/types'

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations('itHelp.edit')
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ITHilfeCreateFormData | null>(null)

  // Fetch existing request data
  useEffect(() => {
    if (authStatus !== 'authenticated') return

    fetch(`/api/it-hilfe/requests/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setError(data.error || t('errorNotFound'))
          setLoading(false)
          return
        }

        const r = data.data.request

        // Only owner can edit
        if (!r.isOwner) {
          setError(t('errorNotOwner'))
          setLoading(false)
          return
        }

        // Only open/in_discussion requests can be edited
        if (r.status !== REQUEST_STATUS.OPEN && r.status !== REQUEST_STATUS.IN_DISCUSSION) {
          setError(t('errorNotEditable'))
          setLoading(false)
          return
        }

        setFormData({
          categoryId: r.categoryId || '',
          deviceBrand: r.deviceBrand || '',
          deviceModel: r.deviceModel || '',
          title: r.title || '',
          description: r.description || '',
          urgency: r.urgency || 'normal',
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
      .catch(err => {
        logger.error('Error fetching request for edit', { error: err })
        setError(t('errorLoadFailed'))
        setLoading(false)
      })
  }, [id, authStatus, t])

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/it-hilfe/${id}/edit`)
    }
  }, [authStatus, router, id])

  // Auto-fill city and canton from postal code
  useEffect(() => {
    if (formData?.postalCode?.length === 4) {
      const data = lookupSwissPostalCode(formData.postalCode)
      if (data) {
        setFormData(prev => prev ? { ...prev, city: data.city, canton: data.canton } : prev)
      }
    }
  }, [formData?.postalCode])

  const updateField = <K extends keyof ITHilfeCreateFormData>(
    key: K,
    value: ITHilfeCreateFormData[K],
  ) => setFormData(prev => prev ? { ...prev, [key]: value } : prev)

  const handleCategorySelect = (catId: string) => {
    const category = getCategoryById(catId)
    setFormData(prev => {
      if (!prev) return prev
      const updated = { ...prev, categoryId: catId }
      if (category) {
        updated.skillsNeeded = category.suggestedSkills
      }
      return updated
    })
  }

  const handleSkillToggle = (skillId: string) => {
    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        skillsNeeded: prev.skillsNeeded.includes(skillId)
          ? prev.skillsNeeded.filter(s => s !== skillId)
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
      const response = await fetch(`/api/it-hilfe/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errorSaveFailed'))
      }

      setSuccess(true)
      setTimeout(() => router.push(`/it-hilfe/${id}`), 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorGeneric')
      setError(message)
      logger.error('Error updating request', { error: err })
    } finally {
      setSaving(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error}</p>
        <Link href={`/it-hilfe/${id}`} className="text-blue-600 hover:underline">
          {t('backToRequest')}
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <Heading level={2} className="text-2xl text-gray-900 mb-2">{t('savedTitle')}</Heading>
          <p className="text-gray-600">{t('savedRedirect')}</p>
        </div>
      </div>
    )
  }

  if (!formData) return null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href={`/it-hilfe/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToRequest')}
        </Link>

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
          {/* Device Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Heading level={2} className="text-lg text-gray-900 mb-4">{t('sectionCategory')}</Heading>
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
                aiFieldMeta={{}}
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
                    {...{placeholder: t('budgetPlaceholder')}}
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
                        <option key={s.id} value={s.id}>{s.name}</option>
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
                        <option key={u.id} value={u.id}>{u.name}</option>
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
                  href={`/it-hilfe/${id}`}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('cancelButton')}
                </Link>
                <button
                  type="submit"
                  disabled={saving || !formData.categoryId || !formData.title || !formData.postalCode}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? t('submittingButton') : t('submitButton')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
