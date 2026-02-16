'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  X,
  Eye,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  ImagePlus,
} from 'lucide-react'
import {
  MARKETPLACE_CATEGORIES,
  LISTING_CONDITIONS,
  DELIVERY_OPTIONS,
  DELIVERY_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  MARKETPLACE_LIMITS,
  formatCHF,
} from '@/config/marketplace'
import { ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { AIFormAssistBar } from '@/components/ai/AIFormAssistBar'

type Step = 'form' | 'preview'

function SellPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [deliveryOptions, setDeliveryOptions] = useState('pickup')
  const [shippingCost, setShippingCost] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [paymentMode, setPaymentMode] = useState('direct')

  // Load existing listing data when editing
  useEffect(() => {
    const id = searchParams.get('edit')
    if (!id || status !== 'authenticated' || !session?.user) return

    setEditId(id)
    setIsLoadingEdit(true)
    setError(null)

    fetch(`/api/listings/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.data) {
          setError('Inserat konnte nicht geladen werden')
          setEditId(null)
          return
        }

        const listing = data.data

        // Verify ownership
        if (session.user.id !== listing.seller_id) {
          setError('Sie können nur Ihre eigenen Inserate bearbeiten')
          setEditId(null)
          return
        }

        // Pre-populate all form fields
        setTitle(listing.title || '')
        setDescription(listing.description || '')
        setPrice(listing.price_chf != null ? String(listing.price_chf) : '')
        setCategory(listing.category || '')
        setCondition(listing.condition || '')
        setBrand(listing.brand || '')
        setModel(listing.model || '')
        setDeliveryOptions(listing.delivery_options || 'pickup')
        setShippingCost(listing.shipping_cost_chf != null ? String(listing.shipping_cost_chf) : '')
        setPickupLocation(listing.pickup_location || '')
        setPaymentMode(listing.payment_mode || 'direct')

        // Images come as objects with url property from the API
        if (Array.isArray(listing.images)) {
          setImages(listing.images.map((img: { url: string }) => img.url))
        }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (images.length + files.length > MARKETPLACE_LIMITS.MAX_IMAGES) {
      setError(`Maximal ${MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erlaubt`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => formData.append('files', file))

      const response = await fetch('/api/uploads', { method: 'POST', body: formData })
      const data = await response.json()

      if (data.success && data.data?.urls) {
        setImages(prev => [...prev, ...data.data.urls])
      } else {
        setError(data.error || 'Fehler beim Hochladen')
      }
    } catch {
      setError('Fehler beim Hochladen der Bilder')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Titel ist erforderlich'
    if (title.length < 3) return 'Titel muss mindestens 3 Zeichen lang sein'
    if (!description.trim()) return 'Beschreibung ist erforderlich'
    if (description.length < 10) return 'Beschreibung muss mindestens 10 Zeichen lang sein'
    if (!price || parseFloat(price) < 0) return 'Gültiger Preis ist erforderlich'
    if (!category) return 'Kategorie ist erforderlich'
    if (!condition) return 'Zustand ist erforderlich'
    if (images.length < 1) return 'Mindestens ein Bild ist erforderlich'
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
        title: title.trim(),
        description: description.trim(),
        price_chf: parseFloat(price),
        category,
        condition,
        brand: brand.trim() || null,
        model: model.trim() || null,
        images,
        delivery_options: deliveryOptions,
        shipping_cost_chf: shippingCost ? parseFloat(shippingCost) : null,
        pickup_location: pickupLocation.trim() || null,
        payment_mode: paymentMode,
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
    if (data.title) setTitle(String(data.title))
    if (data.description) setDescription(String(data.description))
    if (data.category) setCategory(String(data.category))
    if (data.price !== undefined) setPrice(String(data.price))
    if (data.condition) setCondition(String(data.condition))
    if (data.brand) setBrand(String(data.brand))
    if (data.model) setModel(String(data.model))
  }

  // Preview step
  if (step === 'preview') {
    const conditionLabel = ZUSTAND_OPTIONS.find(o => o.value === condition)?.label || condition
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setStep('form')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Bearbeitung
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vorschau
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              So wird Ihr Inserat im Marketplace angezeigt.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Images preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((url, idx) => (
                  <img key={idx} src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-3xl font-bold text-green-600 mt-2">{formatCHF(parseFloat(price) || 0)}</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{category}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{conditionLabel}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {brand && <div className="flex justify-between"><span className="text-gray-500">Marke</span><span>{brand}</span></div>}
                {model && <div className="flex justify-between"><span className="text-gray-500">Modell</span><span>{model}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Lieferung</span><span>{DELIVERY_LABELS[deliveryOptions as keyof typeof DELIVERY_LABELS]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Zahlung</span><span>{PAYMENT_MODE_LABELS[paymentMode as keyof typeof PAYMENT_MODE_LABELS]}</span></div>
                {pickupLocation && <div className="flex justify-between"><span className="text-gray-500">Standort</span><span>{pickupLocation}</span></div>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line text-sm">{description}</p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Bearbeiten
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editId ? 'Wird gespeichert...' : 'Wird veröffentlicht...'}
                </>
              ) : (
                editId ? 'Änderungen speichern' : 'Inserat veröffentlichen'
              )}
            </button>
          </div>
        </div>

        {success && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
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
          {/* AI Assistant */}
          <AIFormAssistBar
            formType="marketplace"
            placeholder="Beschreibe dein Produkt in 1-2 Sätzen..."
            onFieldsFilled={handleAIFieldsFilled}
            quickActions={[
              { key: 'improveDescription', label: 'Beschreibung verbessern' },
              { key: 'suggestPrice', label: 'Preis vorschlagen' },
            ]}
            currentData={{ title, description, price, category, condition, brand, model }}
          />

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bilder <span className="text-red-500">*</span>
              <span className="text-xs text-gray-400 ml-1">({images.length}/{MARKETPLACE_LIMITS.MAX_IMAGES})</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                      Hauptbild
                    </span>
                  )}
                </div>
              ))}
              {images.length < MARKETPLACE_LIMITS.MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-500 hover:border-gray-400 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-xs">Hochladen</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MARKETPLACE_LIMITS.MAX_TITLE_LENGTH}
              placeholder="z.B. ThinkPad T480 i5 16GB 256GB SSD"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MARKETPLACE_LIMITS.MAX_DESCRIPTION_LENGTH}
              rows={5}
              placeholder="Beschreiben Sie den Zustand, Spezifikationen und was enthalten ist..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
            />
          </div>

          {/* Price + Category + Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preis (CHF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategorie <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Wählen...</option>
                {MARKETPLACE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zustand <span className="text-red-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Wählen...</option>
                {ZUSTAND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand + Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marke <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="z.B. Lenovo, Dell, Apple"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modell <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="z.B. ThinkPad T480"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Delivery + Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lieferung
              </label>
              <select
                value={deliveryOptions}
                onChange={(e) => setDeliveryOptions(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {DELIVERY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{DELIVERY_LABELS[opt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zahlungsart
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {PAYMENT_MODES.map(opt => (
                  <option key={opt} value={opt}>{PAYMENT_MODE_LABELS[opt]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shipping cost (conditional) */}
          {deliveryOptions !== 'pickup' && (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Versandkosten (CHF)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Pickup location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Abholstandort <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="z.B. Zürich, 8005"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
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
