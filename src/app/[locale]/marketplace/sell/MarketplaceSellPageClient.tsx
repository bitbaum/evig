'use client'

import { Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Eye, Package, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageUploadGrid } from '@/components/marketplace-sell/ImageUploadGrid'
import { ListingFormFields } from '@/components/marketplace-sell/ListingFormFields'
import { ListingPreview } from '@/components/marketplace-sell/ListingPreview'
import { AICameraProductListing } from '@/components/marketplace/ai-camera'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useTranslations } from 'next-intl'
import { useListingSellForm } from '@/hooks/useListingSellForm'

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
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-neutral-900 dark:text-white mb-2">
          {t('loginRequired')}
        </Heading>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {t('loginRequiredDesc')}
        </p>
        <Link href="/auth/login" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium">
          {t('login')}
        </Link>
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
        href="/marketplace"
        className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">1</span>
          <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">{t('stepDetails')}</span>
        </div>
        <div className="flex-1 h-px bg-neutral-300 dark:bg-neutral-600 mx-3" />
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-600 text-neutral-500 text-xs font-bold flex items-center justify-center">2</span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('stepPreview')}</span>
        </div>
      </div>

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
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-primary-400 hover:text-primary-600 transition-colors text-sm"
            >
              <Camera className="w-4 h-4" />
              {t('cameraButton')}
            </button>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700">
        <div className="p-4 md:p-6 border-b border-neutral-100 dark:border-neutral-700">
          <Heading level={1} className="text-xl text-neutral-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-600" />
            {editId ? t('editTitle') : t('createTitle')}
          </Heading>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {editId ? t('editSubtitle') : t('createSubtitle')}
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-8">
          <div>
            <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3">
              {t('sectionPhotos')}
            </h2>
            <ImageUploadGrid
              images={formData.images}
              isUploading={isUploading}
              onUpload={handleImageUpload}
              onRemove={removeImage}
            />
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-700" />

          <ListingFormFields formData={formData} setFormData={setFormData} />
        </div>

        <div className="p-4 md:p-6 border-t border-neutral-100 dark:border-neutral-700">
          {error && <ErrorAlert message={error} variant="inline" className="mb-4" />}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href="/marketplace"
              className="px-6 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-center"
            >
              {t('cancelButton')}
            </Link>
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
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    }>
      <SellPageContent />
    </Suspense>
  )
}
