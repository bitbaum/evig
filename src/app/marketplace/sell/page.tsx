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
  AlertCircle,
} from 'lucide-react'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { AIFormAssistBar } from '@/components/ai/AIFormAssistBar'
import type { ListingFormData } from '@/components/marketplace-sell/types'
import { INITIAL_LISTING_FORM } from '@/components/marketplace-sell/types'
import { ImageUploadGrid } from '@/components/marketplace-sell/ImageUploadGrid'
import { ListingFormFields } from '@/components/marketplace-sell/ListingFormFields'
import { ListingPreview } from '@/components/marketplace-sell/ListingPreview'

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
        })
      })
      .catch(() => {
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

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Titel ist erforderlich'
    if (formData.title.length < 3) return 'Titel muss mindestens 3 Zeichen lang sein'
    if (!formData.description.trim()) return 'Beschreibung ist erforderlich'
    if (formData.description.length < 10) return 'Beschreibung muss mindestens 10 Zeichen lang sein'
    if (!formData.price || parseFloat(formData.price) < 0) return 'Gültiger Preis ist erforderlich'
    if (!formData.category) return 'Kategorie ist erforderlich'
    if (!formData.condition) return 'Zustand ist erforderlich'
    if (formData.images.length < 1) return 'Mindestens ein Bild ist erforderlich'
    return null
  }

  const handlePreview = () => {
    const validationError = validateForm()
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
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price_chf: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        images: formData.images,
        delivery_options: formData.deliveryOptions,
        shipping_cost_chf: formData.shippingCost ? parseFloat(formData.shippingCost) : null,
        pickup_location: formData.pickupLocation.trim() || null,
        payment_mode: formData.paymentMode,
      }

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

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setFormData(prev => ({
      ...prev,
      ...(data.title ? { title: String(data.title) } : {}),
      ...(data.description ? { description: String(data.description) } : {}),
      ...(data.category ? { category: String(data.category) } : {}),
      ...(data.price !== undefined ? { price: String(data.price) } : {}),
      ...(data.condition ? { condition: String(data.condition) } : {}),
      ...(data.brand ? { brand: String(data.brand) } : {}),
      ...(data.model ? { model: String(data.model) } : {}),
    }))
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
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
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

        <div className="p-6 space-y-6">
          <AIFormAssistBar
            formType="marketplace"
            placeholder="Beschreibe dein Produkt in 1-2 Sätzen..."
            onFieldsFilled={handleAIFieldsFilled}
            quickActions={[
              { key: 'improveDescription', label: 'Beschreibung verbessern' },
              { key: 'suggestPrice', label: 'Preis vorschlagen' },
            ]}
            currentData={{ title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model }}
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
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
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
