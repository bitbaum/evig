'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useAIFormAssist, type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ITHilfeCreateFormData>(INITIAL_IT_HILFE_FORM)

  // AI assist state
  const [aiInput, setAiInput] = useState('')
  const [aiFieldMeta, setAiFieldMeta] = useState<Record<string, AIFieldMetadataEntry>>({})

  const updateField = <K extends keyof ITHilfeCreateFormData>(
    key: K,
    value: ITHilfeCreateFormData[K],
  ) => setFormData(prev => ({ ...prev, [key]: value }))

  const { extractFromText, isExtracting, error: aiError } = useAIFormAssist<AIFormFields>({
    formType: 'it-hilfe',
    onFieldsFilled: (data, metadata) => {
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
    },
  })

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
        throw new Error(data.error || 'Fehler beim Erstellen der Anfrage')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/it-hilfe/${data.data.requestId}`)
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anfrage erstellt!</h2>
          <p className="text-gray-600">Du wirst gleich weitergeleitet...</p>
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
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reparaturanfrage erstellen</h1>
          </div>
          <p className="text-gray-600">
            Wähle ein Gerät und beschreibe dein Problem. Die Community hilft dir.
          </p>
        </div>

        {error && (
          <ErrorAlert message={error} variant="inline" className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Assist */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">KI-Assistent</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Beschreibe dein Problem in eigenen Worten und die KI füllt das Formular automatisch aus.
            </p>
            <div className="flex gap-3">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="z.B. Mein MacBook Pro 2019 startet nicht mehr, Bildschirm bleibt schwarz nach dem Einschalten..."
                rows={3}
                className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => extractFromText(aiInput)}
                  disabled={isExtracting || !aiInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isExtracting ? 'Analysiere...' : 'KI ausfüllen'}
                </button>
              </div>
            </div>
            {aiError && (
              <p className="mt-2 text-sm text-red-600">{aiError}</p>
            )}
            {Object.keys(aiFieldMeta).length > 0 && (
              <p className="mt-2 text-xs text-purple-600">
                Felder wurden von der KI ausgefüllt. Du kannst alle Felder nachträglich bearbeiten.
              </p>
            )}
          </div>

          {formData.aiDiagnosis && (
            <AIDiagnosisCard
              diagnosis={formData.aiDiagnosis}
              deviceInfo={[formData.deviceBrand, formData.deviceModel].filter(Boolean).join(' ') || undefined}
            />
          )}

          {/* Device Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Was möchtest du reparieren?</h2>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Budget</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Was bist du maximal bereit zu zahlen? Leer lassen für kostenlose Community-Hilfe.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">CHF</span>
                  <input
                    type="number"
                    value={formData.maxBudget}
                    onChange={(e) => updateField('maxBudget', e.target.value)}
                    placeholder="0 = gratis"
                    min="0"
                    step="5"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-sm text-gray-500">
                    {!formData.maxBudget ? 'Community-Hilfe (gratis)' : `bis CHF ${formData.maxBudget}`}
                  </span>
                </div>
              </div>

              {/* Service Type & Urgency */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Optionen</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wie soll die Reparatur erfolgen?
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
                      Wie dringend?
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
                  Abbrechen
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.categoryId || !formData.title || !formData.postalCode}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wird erstellt...' : 'Anfrage erstellen'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
