/**
 * useAIProductAnalysis — SSOT for AI image-based product analysis
 *
 * Consolidates useAICamera + useAICapture into a single hook.
 * Both called the same endpoint (/api/ai/analyze-product) with
 * different response transformations. This hook supports both modes.
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'

// Full analysis response from the API
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
  model?: string
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

interface UseAIProductAnalysisOptions {
  /** If true, saves product to inventory on analyze (admin flow) */
  saveToDatabase?: boolean
  /** Called after successful analysis */
  onAnalyzed?: (analysis: ProductAnalysis, sustainability?: SustainabilityScore) => void
}

export function useAIProductAnalysis(options: UseAIProductAnalysisOptions = {}) {
  const { saveToDatabase = false, onAnalyzed } = options

  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null)
  const [sustainabilityScore, setSustainabilityScore] = useState<SustainabilityScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)

  // Camera refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const analyzeImage = useCallback(async (imageData: string) => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setSustainabilityScore(null)

    try {
      const res = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, saveToDatabase }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Analyse fehlgeschlagen')
        return null
      }

      const result = data.data?.analysis || data.analysis
      if (!result) {
        setError('Keine Produktdaten erkannt. Versuche es mit der Text-Eingabe.')
        return null
      }

      setAnalysis(result)
      if (data.data?.sustainability_score || data.sustainability_score) {
        setSustainabilityScore(data.data?.sustainability_score || data.sustainability_score)
      }
      if (data.saved_product_id) {
        setSavedProductId(data.saved_product_id)
      }

      onAnalyzed?.(result, data.data?.sustainability_score || data.sustainability_score)
      return result
    } catch (err) {
      logger.error('AI image analysis failed', { error: err })
      setError('Netzwerkfehler. Bitte versuche es erneut.')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [saveToDatabase, onAnalyzed])

  // Camera: start live video
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      logger.error('Camera access failed', { error: err })
      setError('Kamera-Zugriff fehlgeschlagen. Bitte erlaube den Zugriff.')
    }
  }, [])

  // Camera: stop live video
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  // Camera: capture frame and analyze
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setImage(imageData)
        stopCamera()
        analyzeImage(imageData)
      }
    }
  }, [stopCamera, analyzeImage])

  // File input: select and analyze
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setImage(imageData)
        analyzeImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }, [analyzeImage])

  // Reset all state
  const reset = useCallback(() => {
    setImage(null)
    setAnalysis(null)
    setSustainabilityScore(null)
    setError(null)
    setSavedProductId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return {
    // State
    image,
    isAnalyzing,
    analysis,
    sustainabilityScore,
    error,
    savedProductId,

    // Refs
    videoRef,
    canvasRef,
    fileInputRef,

    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    handleFileSelect,
    analyzeImage,
    reset,
  }
}

/** Utility: confidence level color */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-green-600'
  if (confidence >= 0.7) return 'text-yellow-600'
  return 'text-red-600'
}
