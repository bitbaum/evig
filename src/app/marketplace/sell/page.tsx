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
  Sparkles,
  Wand2,
  Send,
} from 'lucide-react'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { validateListingForm, transformListingFormToPayload } from '@/lib/domain/marketplace'
import { useAIFormAssist } from '@/hooks/useAIFormAssist'
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
  const [aiInput, setAiInput] = useState('')

  // AI form assist hook
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

  const { extractFromText, refineFields, runQuickAction, isExtracting } =
    useAIFormAssist({ formType: 'marketplace', onFieldsFilled: handleAIFieldsFilled })

  const formHasData = formData.title.trim() !== '' || formData.description.trim() !== ''

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
          setError('du kannst nur deine eigenen Inserate bearbeiten')
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
      .catch((err) => {
        logger.error('Failed to load listing for edit', { error: err })
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
        <Heading level={2} className="text-xl text-gray-900 dark:text-white mb-2">
          Anmeldung erforderlich
        </Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Melde dich an, um Inserate zu erstellen.
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
        setError(data.error || (editId ? 'Fehler beim Speichern' : 'Fehler beim Erstellen'))
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

  const handleAISubmit = () => {
    if (!aiInput.trim() || isExtracting) return
    if (formHasData) {
      refineFields(
        { title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model, specs: formData.specs },
        aiInput
      )
    } else {
      extractFromText(aiInput)
    }
    setAiInput('')
  }

  const currentFormData = { title: formData.title, description: formData.description, price: formData.price, category: formData.category, condition: formData.condition, brand: formData.brand, model: formData.model, specs: formData.specs }

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
          <Heading level={1} className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            {editId ? 'Inserat bearbeiten' : 'Inserat erstellen'}
          </Heading>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {editId
              ? 'Änderungen an deinem Inserat speichern.'
              : 'Beschreibe dein Produkt oder mach ein Foto — die KI füllt den Rest aus.'}
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

          {/* === AI ASSISTANT (unified: creation OR refinement) === */}
          {!editId && !showCamera && (
            <div className={`rounded-xl border p-4 md:p-6 space-y-4 ${
              formHasData
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
            }`}>
              {formHasData ? (
                /* --- REFINEMENT MODE: quick actions + compact custom input --- */
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm font-medium">
                      <Wand2 className="w-4 h-4" />
                      KI-Verbesserungen
                    </div>
                    {isExtracting && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        KI arbeitet...
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => runQuickAction(currentFormData, 'improveDescription')} disabled={isExtracting} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                      Beschreibung verbessern
                    </button>
                    <button type="button" onClick={() => runQuickAction(currentFormData, 'suggestPrice')} disabled={isExtracting} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                      Preis vorschlagen
                    </button>
                    <button type="button" onClick={() => runQuickAction(currentFormData, 'extractSpecs')} disabled={isExtracting} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                      Specs erkennen
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAISubmit() } }}
                      placeholder="Eigene Anweisung..."
                      disabled={isExtracting}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 placeholder:text-gray-400"
                    />
                    <button type="button" onClick={handleAISubmit} disabled={isExtracting || !aiInput.trim()} className="px-3 py-2 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                /* --- CREATION MODE: describe product or take photo --- */
                <>
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200 font-semibold">
                    <Sparkles className="w-5 h-5" />
                    Was möchten du verkaufst?
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <textarea
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit() } }}
                        placeholder='z.B. "ThinkPad T480, 16GB RAM, guter Zustand, möchte 400 CHF"'
                        rows={2}
                        disabled={isExtracting}
                        className="flex-1 px-4 py-3 text-sm border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 placeholder:text-gray-400"
                      />
                      <Button type="button" onClick={handleAISubmit} disabled={isExtracting || !aiInput.trim()} className="px-4 py-2 self-end">
                        {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-green-200 dark:border-green-700" /></div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-500 dark:text-green-400">oder</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setShowCamera(true)} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Camera className="w-5 h-5" />
                      Foto aufnehmen — KI erkennt das Produkt
                    </button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Die KI füllt das Formular anhand deiner Beschreibung oder des Fotos aus. du kannst alles danach anpassen.
                  </p>
                </>
              )}
            </div>
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
              Abbrechen
            </Link>
            <Button onClick={handlePreview} className="flex-1 gap-2 px-6 py-2.5">
              <Eye className="w-4 h-4" />
              {editId ? 'Vorschau & Speichern' : 'Vorschau & Veröffentlichen'}
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
