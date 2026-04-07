/**
 * useAICamera — Marketplace-specific wrapper around useAIProductAnalysis
 *
 * Maps the full ProductAnalysis to the marketplace's ProductSuggestion format.
 * Camera + file upload + analysis in one hook.
 */

import { useState, useCallback } from 'react'
import { useAIProductAnalysis, type ProductAnalysis } from './useAIProductAnalysis'
import { getCategoryIcon } from '@/components/marketplace/ai-camera/config'
import type { ProductSuggestion } from '@/components/marketplace/ai-camera/types'

export function useAICamera() {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])

  const mapToSuggestion = useCallback((result: ProductAnalysis): void => {
    const suggestion: ProductSuggestion = {
      id: `ai-${Date.now()}`,
      name: result.product_name || 'Unbekanntes Produkt',
      category: result.category || 'Electronics',
      estimatedPrice: result.estimated_price_chf || 0,
      confidence: result.total_confidence || 0.5,
      brand: result.brand,
      model: result.model,
      condition: (result.condition || 'good') as 'new' | 'excellent' | 'good' | 'fair',
      features: result.specifications
        ? Object.entries(result.specifications).map(([key, value]) => `${key}: ${value}`)
        : [],
      icon: getCategoryIcon(result.category || ''),
    }
    setSuggestions([suggestion])
  }, [])

  const hook = useAIProductAnalysis({ onAnalyzed: mapToSuggestion })

  const resetCapture = useCallback(() => {
    hook.reset()
    setSuggestions([])
  }, [hook])

  return {
    isCapturing: !!hook.videoRef.current?.srcObject,
    capturedImage: hook.image,
    isAnalyzing: hook.isAnalyzing,
    suggestions,
    analysisError: hook.error,
    videoRef: hook.videoRef,
    canvasRef: hook.canvasRef,
    fileInputRef: hook.fileInputRef,
    startCamera: hook.startCamera,
    stopCamera: hook.stopCamera,
    capturePhoto: hook.capturePhoto,
    handleFileUpload: hook.handleFileSelect,
    resetCapture,
  }
}
