'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import type { ErfassungFormData, AIFieldMetadata, VoiceProductData } from '@/types/erfassung'

interface AnalysisResult {
  formData: Partial<ErfassungFormData>
  metadata: AIFieldMetadata
}

interface UseProductAnalysisResult {
  isAnalyzing: boolean
  error: string | null
  analyzeProduct: (imageBase64: string) => Promise<AnalysisResult | null>
}

/** Whitelist AI output to real form fields so formData stays clean. */
function toFormData(data: VoiceProductData): Partial<ErfassungFormData> {
  return {
    hersteller: data.hersteller,
    produktname: data.produktname,
    kurzbeschreibung: data.kurzbeschreibung,
    specs: data.specs,
    verkaufspreis: data.verkaufspreis,
    zustand: data.zustand,
    hauptkategorie: data.hauptkategorie,
    unterkategorie: data.unterkategorie,
    kundenprofile: data.kundenprofile,
  }
}

export function useProductAnalysis(): UseProductAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeProduct = useCallback(async (imageBase64: string): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Full-fidelity staff route — fills ALL fields (specs, category,
      // description, profiles) with confidence metadata, same as text intake.
      const result = await apiFetch<{ data: VoiceProductData; metadata: AIFieldMetadata }>(
        '/api/admin/erfassung/image',
        { method: 'POST', body: { image: imageBase64 } },
      )

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analyse fehlgeschlagen')
      }

      const productData = result.data.data
      if (!productData) throw new Error('Keine Analysedaten erhalten')

      logger.info('Image analysis completed', { product: productData.produktname })
      return { formData: toFormData(productData), metadata: result.data.metadata || {} }
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
