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
import { logger } from '@/lib/logger'
import { validateListingForm, transformListingFormToPayload } from '@/lib/domain/marketplace'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import type { ListingFormData } from '@/components/marketplace-sell/types'
import { INITIAL_LISTING_FORM } from '@/components/marketplace-sell/types'
import { ImageUploadGrid } from '@/components/marketplace-sell/ImageUploadGrid'
import { ListingFormFields } from '@/components/marketplace-sell/ListingFormFields'
import { ListingPreview } from '@/components/marketplace-sell/ListingPreview'
import { AICameraProductListing } from '@/components/marketplace/ai-camera'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import type { DetectedProductData } from '@/components/marketplace/ai-camera/types'

type Step = 'form' | 'preview'

function SellPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [formData, setFormData] = useState<ListingFormData>(INITIAL_LISTING_FORM)
  const [showCamera, setShowCamera] = useState(false)

  // Load existing listing data when editing
  useEffect(() => {
    const id = searchParams.get('edit')
    if (!id || status !== 'authenticated' || !session?.user) return

    setEditId(id)
    setIsLoadingEdit(true)
    setError(null)

    fetch(`/api/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        if (!data.success || !data.data) {
          setError('Inserat konnte nicht geladen werden')
          setEditId(null)
          return
        }

        const listing = data.data

        if (session.user.id !== listing.seller_id) {
          setError('Sie können nur Ihre eigenen Inserate bearbeiten')
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
            ? listing.images.map((img: { url: string }) => img.url)
            : [],
          specs: Array.isArray(listing.specs)
            ? listing.specs.map((s: { key: string; value: string; unit?: string }) => ({
                key: s.key,
                value: s.value || '',
                unit: s.unit,
              }))
            : [],
          conditionChecks: Array.isArray(listing.condition_checks)
            ? listing.condition_checks.map((c: { key: string; label: string; checked: boolean }) => ({
                key: c.key,
                label: c.label,
                checked: c.checked,
              }))
            : [],
        })
      })
      .catch((error) => {
        logger.error('Failed to load listing for edit', { error })
        setError('Fehler beim Laden des Inserats')
        setEditId(null)
      })
      .finally(() => {
        setIsLoadingEdit(false)
      })
  }, [searchParams, status, session])

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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Anmeldung erforderlich
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Melden Sie sich an, um Inserate zu erstellen.
        </p>
        <Link href="/auth/login" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium">
          Anmelden
        </Link>
      </div>
    )
  }

  const handleImageUpload = async (files: FileList) => {
    if (formData.images.length + files.length > MARKETPLACE_LIMITS.MAX_IMAGES) {
      setError(`Maximal ${MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erlaubt`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadData = new FormData()
      Array.from(files).forEach(file => uploadData.append('files', file))

      const response = await fetch('/api/uploads', { method: 'POST', body: uploadData })
      const data = await response.json()

      if (data.success && data.data?.urls) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...data.data.urls] }))
      } else {
        setError(data.error || 'Fehler beim Hochladen')
      }
    } catch {
      setError('Fehler beim Hochladen der Bilder')
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()

      if (data.success && data.data?.id) {
        setSuccess(editId ? 'Änderungen erfolgreich gespeichert!' : 'Inserat erfolgreich erstellt!')
        setTimeout(() => router.push(`/marketplace/${data.data.id}`), 1500)
      } else {
        setError(data.error || (editId ? 'Fehler beim Speichern der Änderungen' : 'Fehler beim Erstellen des Inserats'))
        setStep('form')
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
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

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
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
        Zurück zum Marketplace
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            {editId ? 'Inserat bearbeiten' : 'Inserat erstellen'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {editId
              ? 'Änderungen an Ihrem Inserat speichern.'
              : 'Verkaufen Sie Ihr gebrauchtes IT-Equipment direkt an die Community.'}
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

          {/* AI Camera button */}
          {!editId && !showCamera && (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Mit Kamera erfassen
            </button>
          )}

          <AIFormAssist
            formType="marketplace"
            placeholder="Beschreibe dein Produkt in 1-2 Sätzen..."
            onFieldsFilled={handleAIFieldsFilled}
            currentData={{ title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model, specs: formData.specs }}
          />

          <ImageUploadGrid
            images={formData.images}
            isUploading={isUploading}
            onUpload={handleImageUpload}
            onRemove={removeImage}
          />

          <ListingFormFields formData={formData} setFormData={setFormData} />
        </div>

        {/* Form Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-gray-700">
          {error && (
            <ErrorAlert message={error} variant="inline" className="mb-4" />
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Link
              href="/marketplace"
              className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Abbrechen
            </Link>
            <button
              onClick={handlePreview}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
            >
              <Eye className="w-4 h-4" />
              {editId ? 'Vorschau & Speichern' : 'Vorschau & Veröffentlichen'}
            </button>
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
