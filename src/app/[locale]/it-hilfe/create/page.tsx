'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
} from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
} from '@/config/it-hilfe'
import { AIDiagnosisCard } from '@/components/it-hilfe/AIDiagnosisCard'
import { ITHilfeImageUpload } from '@/components/it-hilfe/ITHilfeImageUpload'
import { ProblemDetailsSection } from '@/components/it-hilfe-create/ProblemDetailsSection'
import { LocationSection } from '@/components/it-hilfe-create/LocationSection'
import { SkillsSection } from '@/components/it-hilfe-create/SkillsSection'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { useCreateITHilfeForm } from '@/hooks/useCreateITHilfeForm'

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
  const t = useTranslations('itHelp.create')

  const {
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
  } = useCreateITHilfeForm(t('errorCreateFailed'), t('errorGeneric'))

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <Heading level={2} className="text-2xl text-neutral-900 mb-2">{t('createdTitle')}</Heading>
          <p className="text-neutral-600">{t('createdRedirect')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/it-hilfe"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Wrench className="w-6 h-6 text-primary-600" />
            </div>
            <Heading level={1} className="text-2xl text-neutral-900">{t('title')}</Heading>
          </div>
          <p className="text-neutral-600">{t('description')}</p>
        </div>

        {error && <ErrorAlert message={error} variant="inline" className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AIFormAssist<AIFormFields>
            formType="it-hilfe"
            placeholder={t('aiPlaceholder')}
            onFieldsFilled={(data, meta) =>
              handleAIFieldsFilled(data as Parameters<typeof handleAIFieldsFilled>[0], meta as Record<string, AIFieldMetadataEntry>)
            }
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
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
            <Heading level={2} className="text-lg text-neutral-900 mb-4">{t('sectionDevice')}</Heading>
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
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-neutral-900">{cat.name}</span>
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
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <Heading level={2} className="text-lg text-neutral-900 mb-2">{t('sectionBudget')}</Heading>
                <p className="text-sm text-neutral-600 mb-4">{t('budgetDescription')}</p>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">CHF</span>
                  <input
                    type="number"
                    value={formData.maxBudget}
                    onChange={(e) => updateField('maxBudget', e.target.value)}
                    placeholder={t('budgetPlaceholder')}
                    min="0"
                    step="5"
                    className="w-32 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <span className="text-sm text-neutral-500">
                    {!formData.maxBudget ? t('budgetFree') : t('budgetUpTo', { amount: formData.maxBudget })}
                  </span>
                </div>
              </div>

              {/* Service Type & Urgency */}
              <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <Heading level={2} className="text-lg text-neutral-900 mb-4">{t('sectionOptions')}</Heading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('serviceTypeLabel')}
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => updateField('serviceType', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {SERVICE_TYPES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('urgencyLabel')}
                    </label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => updateField('urgency', e.target.value)}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

              <div className="flex justify-end gap-4">
                <Link
                  href="/it-hilfe"
                  className="px-6 py-3 text-neutral-700 bg-neutral-100 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                >
                  {t('cancelButton')}
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
