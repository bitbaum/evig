'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Eye,
  Package,
  Loader2,
  Camera,
} from 'lucide-react'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { validateListingForm, transformListingFormToPayload } from '@/lib/domain/marketplace'
import type { ListingFormData } from '@/types/listing-form'
import { INITIAL_LISTING_FORM } from '@/types/listing-form'
import { ImageUploadGrid } from '@/components/marketplace-sell/ImageUploadGrid'
import { ListingFormFields } from '@/components/marketplace-sell/ListingFormFields'
import { ListingPreview } from '@/components/marketplace-sell/ListingPreview'
import { AICameraProductListing } from '@/components/marketplace/ai-camera'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import type { DetectedProductData } from '@/components/marketplace/ai-camera/types'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useTranslations } from 'next-intl'

type Step = 'form' | 'preview'

function SellPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('marketplace.sell')

  const [step, setStep] = useState<Step>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [formData, setFormData] = useState<ListingFormData>(INITIAL_LISTING_FORM)
  const [showCamera, setShowCamera] = useState(false)

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>, _metadata: Record<string, AIFieldMetadataEntry>) => {
    setFormData(prev => {
      const updated = { ...prev }
      if (data.title) updated.title = String(data.title)
      if (data.description) updated.description = String(data.description)
      if (data.category) updated.category = String(data.category)
      if (data.price !== undefined) updated.price = String(data.price)
      if (data.condition) updated.condition = String(data.condition)
      if (data.brand) updated.brand = String(data.brand)
      if (data.model) updated.model = String(data.model)
      if (Array.isArray(data.specs)) {
        updated.specs = data.specs.map((s: Record<string, unknown>) => ({
          key: String(s.key || ''),
          value: String(s.value || ''),
          unit: s.unit ? String(s.unit) : undefined,
        }))
      }
      return updated
    })
  }

  // Load existing listing data when editing
  useEffect(() => {
    const id = searchParams.get('edit')
    if (!id || status !== 'authenticated' || !session?.user) return

    setEditId(id)
    setIsLoadingEdit(true)
    setError(null)

    apiFetch<{
      seller_id: string
      title?: string
      description?: string
      price_chf?: number | string | null
      category?: string
      condition?: string
      brand?: string
      model?: string
      delivery_options?: string
      shipping_cost_chf?: number | string | null
      pickup_location?: string
      payment_mode?: string
      images?: Array<{ url: string }>
      specs?: Array<{ key: string; value: string; unit?: string }>
      condition_checks?: Array<{ key: string; label: string; checked: boolean }>
    }>(`/api/listings/${id}`)
      .then(result => {
        if (!result.success || !result.data) {
          if (result.error) logger.warn('Failed to load listing for edit', { error: result.error })
          setError(t('loadListingError'))
          setEditId(null)
          return
        }

        const listing = result.data

        if (session.user.id !== listing.seller_id) {
          setError(t('ownListingError'))
          setEditId(null)
          return
        }

        setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price_chf != null ? String(listing.price_chf) : '',
          category: listing.category || '',
          condition: listing.condition || '',
          brand: listing.brand || '',
          model: listing.model || '',
          deliveryOptions: listing.delivery_options || 'pickup',
          shippingCost: listing.shipping_cost_chf != null ? String(listing.shipping_cost_chf) : '',
          pickupLocation: listing.pickup_location || '',
          paymentMode: listing.payment_mode || 'direct',
          images: Array.isArray(listing.images)
            ? listing.images.map(img => img.url)
            : [],
          specs: Array.isArray(listing.specs)
            ? listing.specs.map(s => ({ key: s.key, value: s.value || '', unit: s.unit }))
            : [],
          conditionChecks: Array.isArray(listing.condition_checks)
            ? listing.condition_checks.map(c => ({ key: c.key, label: c.label, checked: c.checked }))
            : [],
        })
      })
      .finally(() => {
        setIsLoadingEdit(false)
      })
  }, [searchParams, status, session, t])

  if (status === 'loading' || isLoadingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-gray-900 dark:text-white mb-2">
          {t('loginRequired')}
        </Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('loginRequiredDesc')}
        </p>
        <Link href="/auth/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
          {t('login')}
        </Link>
      </div>
    )
  }

  const handleImageUpload = async (files: FileList) => {
    if (formData.images.length + files.length > MARKETPLACE_LIMITS.MAX_IMAGES) {
      setError(t('maxImagesError', { max: MARKETPLACE_LIMITS.MAX_IMAGES }))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadData = new FormData()
      Array.from(files).forEach(file => uploadData.append('files', file))

      const result = await apiFetch<{ urls: string[] }>('/api/uploads', {
        method: 'POST',
        body: uploadData,
        formData: true,
      })

      if (result.success && result.data?.urls) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...result.data!.urls] }))
      } else {
        setError(result.error || t('uploadError'))
      }
    } catch (err) {
      logger.warn('Failed to upload listing images', { error: err })
      setError(t('uploadImagesError'))
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handlePreview = () => {
    const validationError = validateListingForm(formData)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep('preview')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const body = transformListingFormToPayload(formData)
      const url = editId ? `/api/listings/${editId}` : '/api/listings'
      const method = editId ? 'PATCH' : 'POST'

      const result = await apiFetch<{ id: string }>(url, { method, body })

      if (result.success && result.data?.id) {
        setSuccess(editId ? t('saveSuccess') : t('createSuccess'))
        setTimeout(() => router.push(`/marketplace/${result.data!.id}`), 1500)
      } else {
        setError(result.error || (editId ? t('saveError') : t('createError')))
        setStep('form')
      }
    } catch (err) {
      logger.warn('Failed to submit listing', { error: err })
      setError(t('unexpectedError'))
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCameraProductDetected = (product: DetectedProductData) => {
    setFormData(prev => ({
      ...prev,
      title: product.title || prev.title,
      description: product.description || prev.description,
      price: product.price || prev.price,
      category: product.category || prev.category,
      condition: product.condition || prev.condition,
      brand: product.brand || prev.brand,
    }))
    setShowCamera(false)
  }

  // Preview step
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

  // Form step
  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
          <Heading level={1} className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            {editId ? t('editTitle') : t('createTitle')}
          </Heading>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {editId ? t('editSubtitle') : t('createSubtitle')}
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* AI Camera overlay */}
          {showCamera && (
            <AICameraProductListing
              onProductDetected={handleCameraProductDetected}
              onClose={() => setShowCamera(false)}
            />
          )}

          {/* === AI ASSISTANT === */}
          {!showCamera && (
            <>
              <AIFormAssist
                formType="marketplace"
                currentData={{ title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model, specs: formData.specs }}
                onFieldsFilled={handleAIFieldsFilled}
                placeholder={t('aiPlaceholder')}
                defaultExpanded={true}
                variant="section"
              />
              {/* Camera trigger (creation mode only, when no form data yet) */}
              {!editId && !formData.title && !formData.description && (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  {t('cameraButton')}
                </button>
              )}
            </>
          )}

          {/* Images */}
          <ImageUploadGrid
            images={formData.images}
            isUploading={isUploading}
            onUpload={handleImageUpload}
            onRemove={removeImage}
          />

          {/* Form fields */}
          <ListingFormFields formData={formData} setFormData={setFormData} />
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-700">
          {error && <ErrorAlert message={error} variant="inline" className="mb-4" />}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href="/marketplace"
              className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
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
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    }>
      <SellPageContent />
    </Suspense>
  )
}
