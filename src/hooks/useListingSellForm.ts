'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { UI_FEEDBACK_MS } from '@/config/limits'
import { validateListingForm, transformListingFormToPayload } from '@/lib/domain/marketplace'
import { type ListingFormData, INITIAL_LISTING_FORM } from '@/types/listing-form'
import type { DetectedProductData } from '@/components/marketplace/ai-camera/types'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'

type Step = 'form' | 'preview'

export function useListingSellForm() {
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
        const l = result.data
        if (session.user.id !== l.seller_id) {
          setError(t('ownListingError'))
          setEditId(null)
          return
        }
        setFormData({
          title: l.title || '',
          description: l.description || '',
          price: l.price_chf != null ? String(l.price_chf) : '',
          category: l.category || '',
          condition: l.condition || '',
          brand: l.brand || '',
          model: l.model || '',
          deliveryOptions: l.delivery_options || 'pickup',
          shippingCost: l.shipping_cost_chf != null ? String(l.shipping_cost_chf) : '',
          pickupLocation: l.pickup_location || '',
          paymentMode: l.payment_mode || 'both',
          images: Array.isArray(l.images) ? l.images.map(img => img.url) : [],
          specs: Array.isArray(l.specs) ? l.specs.map(s => ({ key: s.key, value: s.value || '', unit: s.unit })) : [],
          conditionChecks: Array.isArray(l.condition_checks)
            ? l.condition_checks.map(c => ({ key: c.key, label: c.label, checked: c.checked }))
            : [],
        })
      })
      .finally(() => setIsLoadingEdit(false))
  }, [searchParams, status, session, t])

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
      const body = transformListingFormToPayload(formData, { includeStatus: !editId })
      const url = editId ? `/api/listings/${editId}` : '/api/listings'
      const method = editId ? 'PATCH' : 'POST'
      const result = await apiFetch<{ id: string }>(url, { method, body })
      if (result.success && result.data?.id) {
        setSuccess(editId ? t('saveSuccess') : t('createSuccess'))
        setTimeout(() => router.push(`/marketplace/${result.data!.id}`), UI_FEEDBACK_MS.REDIRECT)
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

  return {
    session, status,
    step, setStep,
    isSubmitting, isUploading,
    error, success,
    editId, isLoadingEdit,
    formData, setFormData,
    showCamera, setShowCamera,
    handleAIFieldsFilled,
    handleImageUpload,
    removeImage,
    handlePreview,
    handleSubmit,
    handleCameraProductDetected,
  }
}
