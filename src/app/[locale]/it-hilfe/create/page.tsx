'use client'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { useCreateITHilfeForm } from '@/hooks/useCreateITHilfeForm'
import { PageShell } from '@/components/layout/PageShell'
import { ROUTES } from '@/config/routes'

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
    anonymousAccountCreated,
    existingAccountAttached,
    submittedRequestId,
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
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    )
  }

  if (success && anonymousAccountCreated) {
    return (
      <PageShell maxWidth="2xl" py="py-24" className="text-center">
        <CheckCircle className="w-16 h-16 text-action mx-auto mb-4" />
        <Heading level={2} className="text-2xl text-text-primary mb-2">
          Anfrage gespeichert!
        </Heading>
        <p className="text-text-secondary mb-6 max-w-prose mx-auto">
          Wir haben dir eine E-Mail an <strong>{formData.submitterEmail}</strong> gesendet.
          Klicke auf den Link in der E-Mail, um ein Passwort festzulegen und auf deine
          Anfrage zuzugreifen. Techniker aus der Community werden deine Anfrage sehen,
          während du dein Konto aktivierst.
        </p>
        <p className="text-xs text-text-tertiary dark:text-text-tertiary mb-6">
          Keine E-Mail erhalten? Überprüfe deinen Spam-Ordner oder fordere auf der
          Anmeldeseite mit &ldquo;Passwort vergessen&rdquo; einen neuen Link an.
        </p>
        <Button as={Link} href={ROUTES.public.itHilfe} variant="outline">
          Zurück zur Übersicht
        </Button>
      </PageShell>
    )
  }

  if (success && existingAccountAttached) {
    const loginHref = submittedRequestId
      ? `/auth/login?callbackUrl=${encodeURIComponent(`/it-hilfe/${submittedRequestId}`)}`
      : '/auth/login'
    return (
      <PageShell maxWidth="2xl" py="py-24" className="text-center">
        <CheckCircle className="w-16 h-16 text-action mx-auto mb-4" />
        <Heading level={2} className="text-2xl text-text-primary mb-2">
          Anfrage gespeichert!
        </Heading>
        <p className="text-text-secondary mb-6 max-w-prose mx-auto">
          Wir haben deine Anfrage an dein bestehendes Konto unter{' '}
          <strong>{formData.submitterEmail}</strong> angehängt.
          Melde dich an, um Angebote zu sehen und deine Anfrage zu verwalten.
        </p>
        <Button as={Link} href={loginHref} variant="primary">
          Anmelden
        </Button>
        <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-6">
          Passwort vergessen? Du kannst es auf der Anmeldeseite zurücksetzen.
        </p>
      </PageShell>
    )
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-action mx-auto mb-4" />
          <Heading level={2} className="text-2xl text-text-primary mb-2">{t('createdTitle')}</Heading>
          <p className="text-text-secondary">{t('createdRedirect')}</p>
        </div>
      </div>
    )
  }

  return (
    <PageShell maxWidth="3xl">
        <Link
          href={ROUTES.public.itHilfe}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToList')}
        </Link>

        <div className="mb-8">
          <div className="ui-public-eyebrow">{t('eyebrow')}</div>
          <Heading level={1} className="ui-public-display-md mt-3">{t('title')}</Heading>
          <p className="ui-public-section-lede mt-4">{t('description')}</p>
        </div>

        {error && <ErrorAlert message={error} variant="inline" className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI-assist LEADS the form — describe the problem in plain words and
              the AI fills in category, urgency, skills, etc. Pure manual fill
              still works for users who prefer it; they scroll past this card. */}
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

          {status === 'unauthenticated' && (
            <div className="card-shell p-6 border-l-4 border-action">
              <Heading level={2} className="text-lg text-text-primary mb-2">
                Deine E-Mail-Adresse
              </Heading>
              <p className="text-sm text-text-secondary mb-3">
                Damit du Angebote sehen und mit Technikern kommunizieren kannst, brauchen
                wir deine E-Mail. Wir senden dir einen Link, um ein Passwort festzulegen —
                kein vorheriges Konto erforderlich.
              </p>
              <Input
                type="email"
                value={formData.submitterEmail}
                onChange={(e) => updateField('submitterEmail', e.target.value)}
                placeholder="dein@email.ch"
                required
                autoComplete="email"
                aria-label="E-Mail-Adresse"
              />
            </div>
          )}

          {formData.aiDiagnosis && (
            <AIDiagnosisCard
              diagnosis={formData.aiDiagnosis}
              deviceInfo={[formData.deviceBrand, formData.deviceModel].filter(Boolean).join(' ') || undefined}
            />
          )}

          {/* Device Category */}
          <div className="card-shell p-6">
            <Heading level={2} className="text-lg text-text-primary mb-4">{t('sectionDevice')}</Heading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <Button
                    key={cat.id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex-col h-auto p-4 rounded-xl border-2 transition-all ${
                      formData.categoryId === cat.id
                        ? 'border-action bg-action-muted'
                        : 'border hover:border-strong'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                  </Button>
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
                <Button as={Link} href={ROUTES.public.itHilfe} variant="secondary">
                  {t('cancelButton')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    loading ||
                    !formData.title.trim() ||
                    (status === 'unauthenticated' && !formData.submitterEmail.trim())
                  }
                >
                  {loading ? t('submittingButton') : t('submitButton')}
                </Button>
              </div>
            </>
          )}
        </form>
    </PageShell>
  )
}
