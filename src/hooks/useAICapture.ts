'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'

export interface ProductAnalysis {
  product_name: string
  product_name_confidence: number
  brand: string
  brand_confidence: number
  category: string
  category_confidence: number
  estimated_price_chf: number
  price_confidence: number
  condition: string
  condition_confidence: number
  color: string
  color_confidence: number
  specifications: Record<string, string | number | boolean | string[]>
  total_confidence: number
}

export interface SustainabilityScore {
  overall_score: number
  environmental_score: number
  social_score: number
  economic_score: number
  factors: Record<string, number>
  recommendations: string[]
}

export function useAICapture() {
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null)
  const [sustainabilityScore, setSustainabilityScore] = useState<SustainabilityScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
        setAnalysis(null)
        setSustainabilityScore(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleCameraCapture = useCallback(() => {
    cameraInputRef.current?.click()
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!image) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, saveToDatabase: false }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()

      if (result.success) {
        setAnalysis(result.analysis)
        setSustainabilityScore(result.sustainability_score)
      } else {
        setError(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Failed to analyze image. Please try again.')
      logger.error('Analysis error', { error: err })
    } finally {
      setIsAnalyzing(false)
    }
  }, [image])

  const saveProduct = useCallback(async () => {
    if (!image || !analysis) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, saveToDatabase: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to save product')
      }

      const result = await response.json()

      if (result.success && result.saved_product_id) {
        setSavedProductId(result.saved_product_id)
        setTimeout(() => {
          router.push(`/inventory/products/${result.saved_product_id}`)
        }, 2000)
      } else {
        setError('Failed to save product')
      }
    } catch (err) {
      setError('Failed to save product. Please try again.')
      logger.error('Save error', { error: err })
    } finally {
      setIsSaving(false)
    }
  }, [image, analysis, router])

  const resetCapture = useCallback(() => {
    setImage(null)
    setAnalysis(null)
    setSustainabilityScore(null)
    setError(null)
    setSavedProductId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [])

  return {
    // State
    image,
    isAnalyzing,
    analysis,
    sustainabilityScore,
    error,
    isSaving,
    savedProductId,
    // Refs
    fileInputRef,
    cameraInputRef,
    // Actions
    handleFileSelect,
    handleCameraCapture,
    analyzeImage,
    saveProduct,
    resetCapture,
  }
}

export function getConfidenceColor(confidence: number) {
  if (confidence >= 0.9) return 'text-green-600'
  if (confidence >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}
