'use client'

import { useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
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
} from '@/config/it-hilfe'
import { ITHilfeImageUpload } from '@/components/it-hilfe/ITHilfeImageUpload'
import { ProblemDetailsSection } from '@/components/it-hilfe-create/ProblemDetailsSection'
import { LocationSection } from '@/components/it-hilfe-create/LocationSection'
import { SkillsSection } from '@/components/it-hilfe-create/SkillsSection'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useEditITHilfeForm } from '@/hooks/useEditITHilfeForm'
import { PageShell } from '@/components/layout/PageShell'

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations('itHelp.edit')

  const {
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
  } = useEditITHilfeForm(id, {
    errorNotFound: t('errorNotFound'),
    errorNotOwner: t('errorNotOwner'),
    errorNotEditable: t('errorNotEditable'),
    errorSaveFailed: t('errorSaveFailed'),
    errorGeneric: t('errorGeneric'),
  })

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action" />
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-error-600">{error}</p>
        <Link href={`/it-hilfe/${id}`} className="text-action hover:underline">
          {t('backToRequest')}
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-action mx-auto mb-4" />
          <Heading level={2} className="text-2xl text-text-primary mb-2">{t('savedTitle')}</Heading>
          <p className="text-text-secondary">{t('savedRedirect')}</p>
        </div>
      </div>
    )
  }

  if (!formData) return null

  return (
    <PageShell maxWidth="3xl">
        <Link
          href={`/it-hilfe/${id}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToRequest')}
        </Link>

        <div className="card-shell p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-action-muted rounded-lg">
              <Wrench className="w-6 h-6 text-action" />
            </div>
            <Heading level={1} className="text-2xl text-text-primary">{t('title')}</Heading>
          </div>
          <p className="text-text-secondary">{t('description')}</p>
        </div>

        {error && <ErrorAlert message={error} variant="inline" className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Device Category */}
          <div className="card-shell p-6">
            <Heading level={2} className="text-lg text-text-primary mb-4">{t('sectionCategory')}</Heading>
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
                        ? 'border-action bg-action-muted'
                        : 'border hover:border-strong'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{cat.name}</span>
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
              <div className="card-shell p-6">
                <Heading level={2} className="text-lg text-text-primary mb-2">{t('sectionBudget')}</Heading>
                <p className="text-sm text-text-secondary mb-4">{t('budgetDescription')}</p>
                <div className="flex items-center gap-3">
                  <span className="text-text-tertiary">CHF</span>
                  <Input
                    type="number"
                    value={formData.maxBudget}
                    onChange={(e) => updateField('maxBudget', e.target.value)}
                    placeholder={t('budgetPlaceholder')}
                    min="0"
                    step="5"
                    className="w-32"
                  />
                  <span className="text-sm text-text-tertiary">
                    {!formData.maxBudget ? t('budgetFree') : t('budgetUpTo', { amount: formData.maxBudget })}
                  </span>
                </div>
              </div>

              {/* Service Type & Urgency */}
              <div className="card-shell p-6">
                <Heading level={2} className="text-lg text-text-primary mb-4">{t('sectionOptions')}</Heading>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      {t('serviceTypeLabel')}
                    </label>
                    <Select
                      value={formData.serviceType}
                      onChange={(e) => updateField('serviceType', e.target.value)}
                    >
                      {SERVICE_TYPES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      {t('urgencyLabel')}
                    </label>
                    <Select
                      value={formData.urgency}
                      onChange={(e) => updateField('urgency', e.target.value)}
                    >
                      {URGENCY_LEVELS.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <SkillsSection
                skillsNeeded={formData.skillsNeeded}
                onSkillToggle={handleSkillToggle}
              />

              <div className="flex justify-end gap-4">
                <Button as={Link} href={`/it-hilfe/${id}`} variant="secondary">
                  {t('cancelButton')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || !formData.categoryId || !formData.title || !formData.postalCode}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? t('submittingButton') : t('submitButton')}
                </Button>
              </div>
            </>
          )}
        </form>
    </PageShell>
  )
}
