/**
 * ProductListingForm Component (Refactored)
 * 
 * Main product listing form - now modular and maintainable
 * Uses extracted sections, modals, and hooks
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Refactored to use modular components
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Loader2, Zap, Search, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor, getButtonVariant } from '@/lib/design-system'

// Extracted components
import { BasicInfoSection } from './sections/BasicInfoSection'
import { ConditionSection } from './sections/ConditionSection'
import { ImageUploadSection } from './sections/ImageUploadSection'
import { ContactInfoSection } from './sections/ContactInfoSection'
import { AISearchModal } from './modals/AISearchModal'
import { SuccessModal } from './modals/SuccessModal'

// Hooks
import { useProductForm } from './hooks/useProductForm'
import { useProductSubmission } from './hooks/useProductSubmission'
import { useAISearch } from './hooks/useAISearch'
import type { ProductFormData } from './types'

// External components
import AICameraProductListing from './AICameraProductListing'

interface ListedProductResult {
  id: string
  title: string
  price: string
  brand: string
  condition: string
  createdAt: string
  views: number
}

// DetectedProductData type from AICameraProductListing
interface DetectedProductData {
  title?: string
  price?: string
  category?: string
  brand?: string
  condition?: string
  description?: string
  images?: string[] | File[]
  location?: string
  contactInfo?: string
}

export default function ProductListingForm() {
  const {
    formData,
    errors,
    updateField,
    addImages,
    removeImage,
    validate,
    reset,
  } = useProductForm()

  const {
    submitProduct,
    isSubmitting,
    error: submissionError,
  } = useProductSubmission()

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    search,
    selectResult,
    clearSearch,
  } = useAISearch()

  const [showAICamera, setShowAICamera] = useState(false)
  const [showAISearch, setShowAISearch] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [listedProduct, setListedProduct] = useState<ListedProductResult | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    try {
      addImages(files)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleProductDetected = (detectedProduct: DetectedProductData) => {
    updateField('title', detectedProduct.title || formData.title)
    updateField('description', detectedProduct.description || formData.description)
    updateField('price', detectedProduct.price || formData.price)
    updateField('category', detectedProduct.category || formData.category)
    updateField('brand', detectedProduct.brand || formData.brand)
    updateField('condition', detectedProduct.condition || formData.condition)
    updateField('location', detectedProduct.location || formData.location)
    updateField('contactInfo', detectedProduct.contactInfo || formData.contactInfo)
    setShowAICamera(false)
  }

  const handleAISearchSubmit = async () => {
    await search(searchQuery)
  }

  const handleSelectSearchResult = (result: Parameters<ReturnType<typeof useAISearch>['selectResult']>[0]) => {
    const conditionText = 
      result.condition === 'excellent' ? 'Wie neu' :
      result.condition === 'good' ? 'Gut' :
      result.condition === 'fair' ? 'Akzeptabel' : 'Neu'

    updateField('title', `${result.brand} ${result.name} - ${conditionText}`)
    updateField('description', `AI-erkanntes Produkt: ${result.name}. Features: ${result.features.join(', ')}. Zustand: ${conditionText}. Preisvorschlag basierend auf Marktdaten.`)
    updateField('price', result.estimatedPrice.toString())
    updateField('category', result.category)
    updateField('brand', result.brand)
    updateField('condition', result.condition)
    setShowAISearch(false)
    clearSearch()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const result = await submitProduct(formData, formData.images)

    if (result.success) {
      setListedProduct({
        id: result.inventoryId || '',
        title: formData.title,
        price: formData.price,
        brand: formData.brand,
        condition: formData.condition,
        createdAt: new Date().toISOString(),
        views: 0,
      })
      setShowSuccessModal(true)
      setSubmitSuccess(true)
    } else {
      setSubmitResult({
        success: false,
        message: result.message || 'Fehler beim Erstellen der Anzeige'
      })
    }
  }

  const handleResetForm = () => {
    reset()
    setSubmitSuccess(false)
    setListedProduct(null)
  }

  if (submitSuccess && !showSuccessModal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center"
      >
        <CheckCircle className="w-16 h-16 text-success-600 mx-auto mb-4" />
        <h2 className={cn('text-2xl font-bold mb-2', getTextColor('white', 'primary'))}>
          Produkt erfolgreich aufgelistet!
        </h2>
        <p className={cn('mb-6', getTextColor('white', 'muted'))}>
          Ihre Anzeige wurde erfolgreich auf dem RevampIT Marketplace veröffentlicht.
          Sie erhalten eine Bestätigung per E-Mail.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleResetForm}
            className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors min-h-[touch] touch-target"
          >
            Weiteres Produkt auflisten
          </button>
          <a
            href="/marketplace"
            className={cn(
              'px-6 py-3 rounded-lg transition-colors min-h-[touch] touch-target',
              getButtonVariant('primary').bg,
              getButtonVariant('primary').text,
              getButtonVariant('primary').hover
            )}
          >
            Zum Marketplace
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn('text-xl font-semibold', getTextColor('white', 'primary'))}>
              Produkt-Details
            </h2>
            <p className={cn('mt-1', getTextColor('white', 'muted'))}>
              Geben Sie alle relevanten Informationen zu Ihrem Produkt an
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAISearch(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[touch] touch-target',
                getButtonVariant('primary').bg,
                getButtonVariant('primary').text,
                getButtonVariant('primary').hover
              )}
            >
              <Search className="w-4 h-4" />
              Schnellsuche
            </button>
            <button
              onClick={() => setShowAICamera(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors min-h-[touch] touch-target"
            >
              <Zap className="w-4 h-4" />
              AI Kamera
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {(submissionError || submitResult) && (
        <div className="mx-6 mt-4 p-4 bg-error-50 border-2 border-error-200 rounded-lg">
          <p className="text-error-800">{submissionError || submitResult?.message}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <BasicInfoSection
          formData={formData}
          errors={errors}
          onFieldChange={updateField}
        />

        <ConditionSection
          formData={formData}
          errors={errors}
          onConditionChange={(value) => updateField('condition', value)}
        />

        <ImageUploadSection
          images={formData.images}
          onImageUpload={handleImageUpload}
          onImageRemove={removeImage}
        />

        <ContactInfoSection
          contactInfo={formData.contactInfo}
          onContactInfoChange={(value) => updateField('contactInfo', value)}
        />

        {/* Terms and Submit */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              required
            />
            <label htmlFor="terms" className={cn('text-sm', getTextColor('white', 'secondary'))}>
              Ich bestätige, dass alle Angaben korrekt sind und das Produkt meinen Besitz ist.
              Ich akzeptiere die{' '}
              <a href="/terms" className="text-primary-600 hover:text-primary-700">
                Nutzungsbedingungen
              </a>{' '}
              des RevampIT Marketplace.
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-8 py-3 font-medium rounded-lg transition-colors flex items-center gap-2 min-h-[touch] touch-target',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                getButtonVariant('primary').bg,
                getButtonVariant('primary').text,
                getButtonVariant('primary').hover
              )}
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
      <AISearchModal
        isOpen={showAISearch}
        onClose={() => {
          setShowAISearch(false)
          clearSearch()
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleAISearchSubmit}
        isSearching={isSearching}
        searchResults={searchResults}
        onSelectResult={handleSelectSearchResult}
      />

      {/* AI Camera Modal */}
      {showAICamera && (
        <AICameraProductListing
          onProductDetected={handleProductDetected}
          onClose={() => setShowAICamera(false)}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          handleResetForm()
        }}
        product={listedProduct}
        onResetForm={handleResetForm}
      />
    </div>
  )
}



