'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import type { ProductFormData, SmartEntryState } from './types'

export function useSmartEntry(
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
) {
  const [state, setState] = useState<SmartEntryState>({
    query: '',
    isLoading: false,
    error: null,
    success: null,
  })

  const setQuery = (query: string) => {
    setState(prev => ({ ...prev, query, error: null, success: null }))
  }

  const handleSmartEntry = async () => {
    if (!state.query.trim()) {
      setState(prev => ({ ...prev, error: 'Bitte gib einen Produktnamen ein' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, success: null }))

    try {
      const response = await fetch('/api/admin/ai/smart-product-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: state.query.trim() }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fehler bei der Produkterkennung')
      }

      const product = result.data.product

      const handle = product.handle || product.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      let description = product.description || ''
      if (product.specs && product.specs.length > 0) {
        const specsText = product.specs
          .map((s: { key: string; value: string }) => `${s.key}: ${s.value}`)
          .join('\n')
        if (description) {
          description += '\n\nTechnische Daten:\n' + specsText
        }
      }

      setFormData(prev => ({
        ...prev,
        title: product.title || prev.title,
        handle,
        description,
        category: product.category || prev.category,
        tags: product.tags || prev.tags,
        variants: [{
          ...prev.variants[0],
          title: 'Default Variant',
          sku: product.sku || prev.variants[0].sku,
          price: product.price || prev.variants[0].price,
        }],
      }))

      setState(prev => ({
        ...prev,
        success: `Produkt erkannt: ${product.title}`,
        query: '',
        isLoading: false,
      }))

      logger.info('Smart entry completed', {
        product: product.title,
        processingTime: result.data.metadata?.processingTime,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setState(prev => ({ ...prev, error: message, isLoading: false }))
      logger.error('Smart entry failed', { error: message })
    }
  }

  return {
    smartQuery: state.query,
    isSmartLoading: state.isLoading,
    smartError: state.error,
    smartSuccess: state.success,
    setSmartQuery: setQuery,
    handleSmartEntry,
  }
}
