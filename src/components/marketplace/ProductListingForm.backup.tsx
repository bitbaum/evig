"use client";

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  X,
  Image as ImageIcon,
  DollarSign,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Camera,
  Search,
  Package,
  Eye,
  TrendingUp,
  Plus,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import AICameraProductListing from './AICameraProductListing'

interface ProductFormData {
  title: string
  description: string
  price: string
  category: string
  brand: string
  condition: string
  images: File[]
  location: string
  contactInfo: string
}

const categories = [
  'Laptops',
  'Desktops',
  'Monitore',
  'Zubehör',
  'Drucker',
  'Netzwerk',
  'Speicher',
  'Sonstiges'
]

const conditions = [
  { value: 'new', label: 'Neu (Originalverpackung)', description: 'Unbenutzt, originale Verpackung' },
  { value: 'excellent', label: 'Sehr gut', description: 'Kaum Gebrauchsspuren, voll funktionsfähig' },
  { value: 'good', label: 'Gut', description: 'Leichte Gebrauchsspuren, alles funktioniert' },
  { value: 'fair', label: 'Akzeptabel', description: 'Deutliche Gebrauchsspuren, aber funktionsfähig' }
]

export default function ProductListingForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    condition: '',
    images: [],
    location: '',
    contactInfo: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState<Partial<ProductFormData>>({})
  const [showAICamera, setShowAICamera] = useState(false)
  const [showAISearch, setShowAISearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; brand: string; category: string; estimatedPrice: number; condition: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [listedProduct, setListedProduct] = useState<ProductFormData | null>(null)

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 5) {
      alert('Maximal 5 Bilder erlaubt')
      return
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {}

    if (!formData.title.trim()) newErrors.title = 'Titel ist erforderlich'
    if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich'
    if (!formData.price.trim()) newErrors.price = 'Preis ist erforderlich'
    if (!formData.category) newErrors.category = 'Kategorie ist erforderlich'
    if (!formData.condition) newErrors.condition = 'Zustand ist erforderlich'
    if (!formData.location.trim()) newErrors.location = 'Standort ist erforderlich'

    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) newErrors.price = 'Gültiger Preis erforderlich'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProductDetected = (detectedProduct: Partial<ProductFormData> | { title?: string; price?: string; category?: string; brand?: string; condition?: string; description?: string; images?: string[] | File[]; location?: string; contactInfo?: string }) => {
    setFormData(prev => ({
      ...prev,
      title: detectedProduct.title ?? prev.title,
      description: detectedProduct.description ?? prev.description,
      price: detectedProduct.price ?? prev.price,
      category: detectedProduct.category ?? prev.category,
      brand: detectedProduct.brand ?? prev.brand,
      condition: detectedProduct.condition ?? prev.condition,
      // images from AI are base64 strings, keep existing File[] if provided
      images: Array.isArray(detectedProduct.images) && detectedProduct.images.length > 0 
        ? (detectedProduct.images[0] instanceof File ? detectedProduct.images as File[] : prev.images)
        : prev.images,
      location: detectedProduct.location ?? prev.location,
      contactInfo: detectedProduct.contactInfo ?? prev.contactInfo,
    }))
    setShowAICamera(false)
  }

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/ai/analyze-product?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.suggestions)
      }
    } catch (error) {
      logger.error('AI search error', { error })
    } finally {
      setIsSearching(false)
    }
  }

  const selectSearchResult = (result: { id: string; name: string; brand: string; category: string; estimatedPrice: number; condition: string }) => {
    const conditionText = result.condition === 'excellent' ? 'Wie neu' :
                         result.condition === 'good' ? 'Gut' :
                         result.condition === 'fair' ? 'Akzeptabel' : 'Neu'

    setFormData(prev => ({
      ...prev,
      title: `${result.brand} ${result.name} - ${conditionText}`,
      description: `AI-erkanntes Produkt: ${result.name}. Features: ${result.features.join(', ')}. Zustand: ${conditionText}. Preisvorschlag basierend auf Marktdaten.`,
      price: result.estimatedPrice.toString(),
      category: result.category,
      brand: result.brand,
      condition: result.condition
    }))

    setShowAISearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      // 1) Upload images
      let imageUrls: string[] = []
      if (formData.images.length > 0) {
        const fd = new FormData()
        formData.images.forEach((file) => fd.append('files', file))
        const uploadResp = await fetch('/api/uploads', { method: 'POST', body: fd })
        if (!uploadResp.ok) {
          const err = await uploadResp.json().catch(() => ({}))
          throw new Error(err?.error || 'Upload fehlgeschlagen')
        }
        const uploadData = await uploadResp.json()
        // API returns { ok: true, urls: [...] }
        imageUrls = uploadData.urls || []
        
        if (imageUrls.length === 0) {
          throw new Error('Keine Bilder wurden hochgeladen')
        }
      } else {
        throw new Error('Mindestens ein Bild ist erforderlich')
      }

      // 2) Convert price to cents (API expects price in cents)
      const priceInCents = Math.round(parseFloat(formData.price) * 100)
      if (isNaN(priceInCents) || priceInCents <= 0) {
        throw new Error('Ungültiger Preis')
      }

      // 3) Create seller product - API expects specific format
      const createResp = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imageUrls, // Array of image URLs
          title: formData.title,
          description: formData.description,
          condition: formData.condition,
          category: formData.category,
          price: priceInCents, // Price in cents
          location: formData.location,
          useAiAnalysis: false, // Can be made configurable
        })
      })

      if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}))
        throw new Error(err?.error || 'Produktanlage fehlgeschlagen')
      }

      const data = await createResp.json()

      if (!data.success) {
        throw new Error(data.message || 'Unbekannter Fehler')
      }

      // API returns { success: true, message, inventoryId, aiProductId }
      setListedProduct({
        id: data.inventoryId,
        title: formData.title,
        price: formData.price,
        brand: formData.brand,
        condition: formData.condition,
        createdAt: new Date().toISOString(),
        views: 0,
      })
      setShowSuccessModal(true)
      setSubmitSuccess(true)

    } catch (error) {
      logger.error('Error submitting product', { error })
      const errorMessage = (error as Error)?.message || 'Fehler beim Erstellen der Anzeige. Bitte versuchen Sie es erneut.'
      setSubmitResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Produkt erfolgreich aufgelistet!
        </h2>
        <p className="text-gray-600 mb-6">
          Ihre Anzeige wurde erfolgreich auf dem RevampIT Marketplace veröffentlicht.
          Sie erhalten eine Bestätigung per E-Mail.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setSubmitSuccess(false)}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Weiteres Produkt auflisten
          </button>
          <a
            href="/marketplace"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Zum Marketplace
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Produkt-Details
            </h2>
            <p className="text-gray-600 mt-1">
              Geben Sie alle relevanten Informationen zu Ihrem Produkt an
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAISearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Schnellsuche
            </button>
            <button
              onClick={() => setShowAICamera(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              AI Kamera
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Grundinformationen</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produkt-Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  errors.title ? "border-red-300" : "border-gray-300"
                )}
                placeholder="z.B. Dell Latitude E7470 Laptop"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preis (CHF) *
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                    errors.price ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="599.00"
                />
              </div>
              {errors.price && (
                <p className="text-red-600 text-sm mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                errors.description ? "border-red-300" : "border-gray-300"
              )}
              placeholder="Beschreiben Sie den Zustand, Ausstattung, eventuelle Mängel und alle wichtigen Details..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  errors.category ? "border-red-300" : "border-gray-300"
                )}
              >
                <option value="">Kategorie wählen</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marke
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="z.B. Dell, Apple, Lenovo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standort *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  errors.location ? "border-red-300" : "border-gray-300"
                )}
                placeholder="z.B. Zürich, Bern, Basel"
              />
              {errors.location && (
                <p className="text-red-600 text-sm mt-1">{errors.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Zustand *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.map((condition) => (
              <label
                key={condition.value}
                className={cn(
                  "relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors",
                  formData.condition === condition.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={formData.condition === condition.value}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{condition.label}</div>
                  <div className="text-sm text-gray-600">{condition.description}</div>
                </div>
                {formData.condition === condition.value && (
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                )}
              </label>
            ))}
          </div>
          {errors.condition && (
            <p className="text-red-600 text-sm">{errors.condition}</p>
          )}
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Produkt-Bilder</h3>
          <p className="text-gray-600">
            Fügen Sie bis zu 5 klare Bilder Ihres Produkts hinzu
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Existing images */}
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Bild ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Upload button */}
            {formData.images.length < 5 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm text-gray-600">Bild hinzufügen</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Kontaktinformationen</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Kontaktinformationen (optional)
            </label>
            <textarea
              value={formData.contactInfo}
              onChange={(e) => handleInputChange('contactInfo', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="z.B. Telefonnummer, bevorzugte Kontaktzeiten, Versandmöglichkeiten..."
            />
          </div>
        </div>

        {/* Terms and Submit */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              Ich bestätige, dass alle Angaben korrekt sind und das Produkt meinen Besitz ist.
              Ich akzeptiere die{' '}
              <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                Nutzungsbedingungen
              </a>{' '}
              des RevampIT Marketplace.
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird veröffentlicht...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Produkt veröffentlichen
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* AI Search Modal */}
      <AnimatePresence>
        {showAISearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAISearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        AI Schnellsuche
                      </h2>
                      <p className="text-sm text-gray-600">
                        Geben Sie einen Produktnamen oder Artikelnummer ein
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAISearch(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Input */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
                        placeholder="z.B. iPhone 13 Pro Max, Dell XPS 13, Artikel-Nr. 12345..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleAISearch}
                      disabled={!searchQuery.trim() || isSearching}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Suchen
                    </button>
                  </div>

                  {/* Search Examples */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Beispiele:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'iPhone 13 Pro Max',
                        'MacBook Air M1',
                        'Dell Latitude E7470',
                        'Samsung Galaxy S21',
                        'Artikel-Nr. 12345'
                      ].map((example) => (
                        <button
                          key={example}
                          onClick={() => setSearchQuery(example)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {searchResults.length} Produkt{searchResults.length !== 1 ? 'e' : ''} gefunden
                    </h3>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => selectSearchResult(result)}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{result.name}</h4>
                                <span className={cn(
                                  "px-2 py-1 text-xs rounded-full",
                                  result.confidence > 0.8 ? "bg-green-100 text-green-800" :
                                  result.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                )}>
                                  {Math.round(result.confidence * 100)}% Übereinstimmung
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {result.brand} • {result.category} • CHF {result.estimatedPrice}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {result.features.slice(0, 3).map((feature: string, index: number) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSearchResults([])
                          setSearchQuery('')
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Neue Suche
                      </button>
                      <button
                        onClick={() => setShowAISearch(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Manueller Eintrag
                      </button>
                    </div>
                  </div>
                )}

                {isSearching && (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Produkt wird gesucht...
                    </h3>
                    <p className="text-gray-600">
                      Durchsuche Produktdatenbank nach passenden Artikeln
                    </p>
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && searchQuery && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Keine Produkte gefunden
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Für "{searchQuery}" wurden keine passenden Produkte gefunden.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Neue Suche
                      </button>
                      <button
                        onClick={() => setShowAISearch(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Manueller Eintrag
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Camera Modal */}
      {showAICamera && (
        <AICameraProductListing
          onProductDetected={handleProductDetected}
          onClose={() => setShowAICamera(false)}
        />
      )}

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && listedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Produkt erfolgreich aufgelistet! 🎉</h2>
                    <p className="text-green-100 mt-1">Ihr {listedProduct.title} ist jetzt live im RevampIT Marketplace</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Product Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {listedProduct.images?.[0] ? (
                        <img src={listedProduct.images[0]} alt={listedProduct.title} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{listedProduct.title}</h3>
                      <p className="text-sm text-gray-600">
                        CHF {listedProduct.price} • {listedProduct.brand} • {listedProduct.condition}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Aufgelistet am {new Date(listedProduct.createdAt).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-blue-900">{listedProduct.views}</div>
                    <div className="text-xs text-blue-700">Aufrufe</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-green-900">0</div>
                    <div className="text-xs text-green-700">Anfragen</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-purple-900">CHF {listedProduct.price}</div>
                    <div className="text-xs text-purple-700">Preis</div>
                  </div>
                </div>

                {/* What happens next */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Was passiert als nächstes?</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Ihr Produkt ist sofort sichtbar im Marketplace</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Potenzielle Käufer können Sie direkt kontaktieren</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Sie erhalten Benachrichtigungen bei Anfragen</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Was möchten Sie als nächstes tun?</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Actions */}
                    <button
                      onClick={() => {
                        // Reset form for new listing
                        setFormData({
                          title: '',
                          description: '',
                          price: '',
                          category: '',
                          brand: '',
                          condition: '',
                          images: [],
                          location: '',
                          contactInfo: ''
                        })
                        setShowSuccessModal(false)
                        setListedProduct(null)
                      }}
                      className="flex items-center gap-3 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Weiteres Produkt auflisten</div>
                        <div className="text-sm opacity-90">Sofort neues Produkt hinzufügen</div>
                      </div>
                    </button>

                    <a
                      href="/marketplace"
                      className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Im Marketplace ansehen</div>
                        <div className="text-sm opacity-90">Ihr Produkt live erleben</div>
                      </div>
                    </a>

                    {/* Secondary Actions */}
                    <a
                      href="/dashboard/seller/products"
                      className="flex items-center gap-3 p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Package className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Meine Produkte verwalten</div>
                        <div className="text-sm opacity-90">Alle Ihre Listings bearbeiten</div>
                      </div>
                    </a>

                    <a
                      href="/dashboard/seller"
                      className="flex items-center gap-3 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <BarChart3 className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Verkaufsstatistiken</div>
                        <div className="text-sm opacity-90">Performance analysieren</div>
                      </div>
                    </a>
                  </div>

                  {/* Social Sharing */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Teilen Sie Ihr Produkt:</p>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                        📘 Facebook
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-sky-500 text-white text-sm rounded hover:bg-sky-600 transition-colors">
                        🐦 Twitter
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-600 transition-colors">
                        💬 WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">💡 Tipp für mehr Verkäufe</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Fügen Sie gute Fotos hinzu für höhere Klickraten</li>
                    <li>• Seien Sie schnell bei Anfragen - das baut Vertrauen auf</li>
                    <li>• Bieten Sie faire Preise für schnelle Verkäufe</li>
                    <li>• Listen Sie weitere Produkte auf für mehr Sichtbarkeit</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
