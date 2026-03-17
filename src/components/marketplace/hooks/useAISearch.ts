/**
 * useAISearch Hook
 * 
 * Handles AI product search functionality
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted AI search logic from ProductListingForm
 */

import { useState } from 'react'
import { ProductFormData } from '../types'
import { logger } from '@/lib/logger'
import { getConditionLabel, normalizeConditionValue } from '@/config/erfassung/conditions'

interface SearchResult {
  id: string
  name: string
  brand: string
  category: string
  estimatedPrice: number
  confidence: number
  features: string[]
  condition: string
}

export function useAISearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const search = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []

    setIsSearching(true)
    try {
      const response = await fetch(`/api/ai/analyze-product?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success && data.suggestions) {
        setSearchResults(data.suggestions)
        return data.suggestions
      }
      return []
    } catch (error) {
      logger.error('AI search error', { error, query })
      return []
    } finally {
      setIsSearching(false)
    }
  }

  const selectResult = (result: SearchResult) => {
    // Normalize legacy condition values (e.g. 'excellent' → 'like_new')
    const normalizedCondition = normalizeConditionValue(result.condition)
    const conditionText = getConditionLabel(normalizedCondition)

    return {
      title: `${result.brand} ${result.name} - ${conditionText}`,
      description: `AI-erkanntes Produkt: ${result.name}. Features: ${result.features.join(', ')}. Zustand: ${conditionText}. Preisvorschlag basierend auf Marktdaten.`,
      price: result.estimatedPrice.toString(),
      category: result.category,
      brand: result.brand,
      condition: normalizedCondition
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    search,
    selectResult,
    clearSearch,
  }
}



