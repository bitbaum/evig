"use client"

/**
 * AI Camera Product Listing
 *
 * Main component that orchestrates:
 * - Camera capture or file upload
 * - AI analysis of product image
 * - Product suggestions selection
 * - Auto-fill form with detected data
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useAICamera } from '@/hooks/useAICamera'
import { ProductSuccessModal } from './ProductSuccessModal'
import { CameraCapture } from './CameraCapture'
import { AIAnalysisLoader } from './AIAnalysisLoader'
import { AIProductResults } from './AIProductResults'
import { getConditionLabel, generateProductDescription } from './config'
import type { AICameraProductListingProps, ProductSuggestion, DetectedProductData } from './types'

export function AICameraProductListing({ onProductDetected, onClose }: AICameraProductListingProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ProductSuggestion | null>(null)

  const {
    isCapturing,
    capturedImage,
    isAnalyzing,
    suggestions,
    analysisError,
    videoRef,
    canvasRef,
    fileInputRef,
    startCamera,
    stopCamera,
    capturePhoto,
    handleFileUpload,
    resetCapture
  } = useAICamera()

  const selectProduct = (suggestion: ProductSuggestion) => {
    setSelectedSuggestion(suggestion)

    const detectedData: DetectedProductData = {
      title: `${suggestion.brand || ''} ${suggestion.model || ''} - ${getConditionLabel(suggestion.condition)}`.trim(),
      price: suggestion.estimatedPrice.toString(),
      category: suggestion.category,
      brand: suggestion.brand,
      condition: suggestion.condition,
      description: generateProductDescription(suggestion),
      images: capturedImage ? [capturedImage] : []
    }

    onProductDetected(detectedData)
  }

  // Show success modal after product selection
  if (selectedSuggestion) {
    return <ProductSuccessModal suggestion={selectedSuggestion} onClose={onClose} />
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface-base dark:border dark:border-white/6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <ModalHeader onClose={onClose} />

          {/* Content */}
          <div className="p-6">
            {!capturedImage ? (
              <CameraCapture
                isCapturing={isCapturing}
                videoRef={videoRef}
                canvasRef={canvasRef}
                fileInputRef={fileInputRef}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onCapturePhoto={capturePhoto}
                onFileUpload={handleFileUpload}
              />
            ) : isAnalyzing ? (
              <AIAnalysisLoader />
            ) : (
              <>
                {analysisError && (
                  <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 rounded-lg text-sm text-warning-800 dark:text-warning-200">
                    {analysisError}
                  </div>
                )}
                <AIProductResults
                  capturedImage={capturedImage}
                  suggestions={suggestions}
                  onSelectProduct={selectProduct}
                  onRetry={resetCapture}
                  onClose={onClose}
                />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6 border-b border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-action-muted-muted rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-action" />
          </div>
          <div>
            <Heading level={2} className="text-xl font-semibold text-text-primary">
              AI Produkt-Erkennung
            </Heading>
            <p className="text-sm text-text-secondary">
              Mache ein Foto - wir identifizieren dein Produkt automatisch
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
