/**
 * useAICapture — Inventory-specific wrapper around useAIProductAnalysis
 *
 * Used by /inventory/ai-capture for admin product intake.
 * Adds save-to-database capability.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useAIProductAnalysis } from './useAIProductAnalysis'
import { logger } from '@/lib/logger'

// Re-export types for consumers
export type { ProductAnalysis, SustainabilityScore } from './useAIProductAnalysis'
export { getConfidenceColor } from './useAIProductAnalysis'

export function useAICapture() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)

  const hook = useAIProductAnalysis({ saveToDatabase: false })

  const saveProduct = useCallback(async () => {
    if (!hook.image || !hook.analysis) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: hook.image, saveToDatabase: true }),
      })

      const result = await response.json()

      if (result.success && result.saved_product_id) {
        setSavedProductId(result.saved_product_id)
        setTimeout(() => {
          router.push(`/inventory/products/${result.saved_product_id}`)
        }, 2000)
      }
    } catch (err) {
      logger.error('Save product error', { error: err })
    } finally {
      setIsSaving(false)
    }
  }, [hook.image, hook.analysis, router])

  const resetCapture = useCallback(() => {
    hook.reset()
    setSavedProductId(null)
  }, [hook])

  return {
    image: hook.image,
    isAnalyzing: hook.isAnalyzing,
    analysis: hook.analysis,
    sustainabilityScore: hook.sustainabilityScore,
    error: hook.error,
    isSaving,
    savedProductId,
    fileInputRef: hook.fileInputRef,
    cameraInputRef: hook.fileInputRef,
    handleFileSelect: hook.handleFileSelect,
    handleCameraCapture: () => hook.fileInputRef.current?.click(),
    analyzeImage: () => hook.image ? hook.analyzeImage(hook.image) : Promise.resolve(null),
    saveProduct,
    resetCapture,
  }
}
