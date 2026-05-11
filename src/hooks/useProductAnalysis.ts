'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { callAnalyzeProductAPI } from '@/lib/api/ai-product-analysis'
import type { ErfassungFormData } from '@/types/erfassung'

interface AnalysisResult {
  formData: Partial<ErfassungFormData>
}

interface UseProductAnalysisResult {
  isAnalyzing: boolean
  error: string | null
  analyzeProduct: (imageBase64: string) => Promise<AnalysisResult | null>
}

export function useProductAnalysis(): UseProductAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeProduct = useCallback(async (imageBase64: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await callAnalyzeProductAPI(imageBase64, false)

      if (!result.success) {
        throw new Error(result.error || 'Analyse fehlgeschlagen')
      }

      const a = result.data?.analysis
      if (!a) throw new Error('Keine Analysedaten erhalten')

      const formData: Partial<ErfassungFormData> = {
        hersteller: a.brand || '',
        produktname: a.product_name || '',
        zustand: a.condition || '',
        verkaufspreis: a.estimated_price_chf?.toString() || '',
      }

      logger.info('Image analysis completed', { product: a.product_name })
      return { formData }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analyse fehlgeschlagen'
      logger.error('Image analysis failed', { error: err })
      setError(message)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    isAnalyzing,
    error,
    analyzeProduct,
  }
}
