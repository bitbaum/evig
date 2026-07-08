'use client'

import { Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import NextLink from 'next/link'
import { ArrowLeft, Eye, Package, Loader2, Camera, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageUploadGrid } from '@/components/marketplace-sell/ImageUploadGrid'
import { ListingFormFields } from '@/components/marketplace-sell/ListingFormFields'
import { ListingPreview } from '@/components/marketplace-sell/ListingPreview'
import dynamic from 'next/dynamic'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useTranslations } from 'next-intl'
import { useListingSellForm } from '@/hooks/useListingSellForm'
import { ROUTES } from '@/config/routes'

// framer-motion is heavy — load the camera flow lazily, only when opened.
const AICameraProductListing = dynamic(
  () => import('@/components/marketplace/ai-camera/AICameraProductListing').then(m => m.AICameraProductListing),
  { ssr: false }
)

function SellPageContent() {
  const t = useTranslations('marketplace.sell')
  const {
    session, status,
    step, setStep,
    isSubmitting, isUploading,
    error,
    editId, isLoadingEdit,
    formData, setFormData,
    showCamera, setShowCamera,
    success,
    handleAIFieldsFilled,
    handleImageUpload,
    removeImage,
    handlePreview,
    handleSubmit,
    handleCameraProductDetected,
  } = useListingSellForm()

  if (status === 'loading' || isLoadingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Package className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl text-text-primary mb-2">
          {t('loginRequired')}
        </Heading>
        <p className="text-text-secondary mb-6">
          {t('loginRequiredDesc')}
        </p>
        <Button as={Link} href={ROUTES.public.login} variant="primary">
          {t('login')}
        </Button>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <ListingPreview
        formData={formData}
        editId={editId}
        isSubmitting={isSubmitting}
        success={success}
        error={error}
        onEdit={() => setStep('form')}
        onSubmit={handleSubmit}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={ROUTES.public.marketplace}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-action mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-action text-white text-xs font-bold flex items-center justify-center">1</span>
          <span className="text-sm font-semibold text-action">{t('stepDetails')}</span>
        </div>
        <div className="flex-1 h-px bg-surface-overlay mx-3" />
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-surface-overlay text-text-tertiary text-xs font-bold flex items-center justify-center">2</span>
          <span className="text-sm text-text-tertiary">{t('stepPreview')}</span>
        </div>
      </div>

      {/* Poster clarity — what kind of listing this is. The channel decides
          ownership, never the email: the sell form is always a private
          Community listing (is_revampit=false), even for staff. Staff get a
          non-blocking nudge toward Erfassung for actual RevampIT stock. */}
      {!editId && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-default bg-surface-raised p-4 text-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-text-tertiary" aria-hidden />
          <div className="min-w-0">
            <p className="text-text-primary">
              Du erstellst ein <span className="font-semibold">Community-Inserat</span> (Privatverkauf) — kein RevampIT-Lagerbestand.
            </p>
            {session.user.isStaff && (
              <p className="text-text-secondary mt-1">
                Ist das RevampIT-Lagerbestand? Dann über{' '}
                <NextLink href="/admin/erfassung" className="font-medium text-action underline underline-offset-2 hover:text-action">
                  Produkt aufnehmen → Erfassung
                </NextLink>{' '}
                erfassen — wird als RevampIT-Produkt mit Inventar gelistet. Nicht zwingend: persönliche Verkäufe gehören hierher.
              </p>
            )}
          </div>
        </div>
      )}

      {showCamera && (
        <AICameraProductListing
          onProductDetected={handleCameraProductDetected}
          onClose={() => setShowCamera(false)}
        />
      )}

      {!showCamera && (
        <div className="space-y-3 mb-6">
          <AIFormAssist
            formType="marketplace"
            currentData={{ title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model, specs: formData.specs }}
            onFieldsFilled={handleAIFieldsFilled}
            placeholder={t('aiPlaceholder')}
            defaultExpanded={false}
            variant="section"
          />
          {!editId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-default text-text-tertiary hover:border-action hover:text-action transition-colors text-sm"
            >
              <Camera className="w-4 h-4" />
              {t('cameraButton')}
            </Button>
          )}
        </div>
      )}

      <div className="card-shell">
        <div className="p-4 md:p-6 border-b border-subtle">
          <Heading level={1} className="text-xl text-text-primary flex items-center gap-2">
            <Package className="w-5 h-5 text-action" />
            {editId ? t('editTitle') : t('createTitle')}
          </Heading>
          <p className="text-sm text-text-tertiary mt-1">
            {editId ? t('editSubtitle') : t('createSubtitle')}
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-8">
          <div>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
              {t('sectionPhotos')}
            </h2>
            <ImageUploadGrid
              images={formData.images}
              isUploading={isUploading}
              onUpload={handleImageUpload}
              onRemove={removeImage}
            />
          </div>

          <div className="border-t border-subtle" />

          <ListingFormFields formData={formData} setFormData={setFormData} />
        </div>

        <div className="p-4 md:p-6 border-t border-subtle">
          {error && <ErrorAlert message={error} variant="inline" className="mb-4" />}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button as={Link} href={ROUTES.public.marketplace} variant="outline">
              {t('cancelButton')}
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!formData.title.trim() || !formData.description.trim() || !formData.category}
              className="flex-1 gap-2 px-6 py-2.5"
            >
              <Eye className="w-4 h-4" />
              {editId ? t('previewSave') : t('previewPublish')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SellPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    }>
      <SellPageContent />
    </Suspense>
  )
}
