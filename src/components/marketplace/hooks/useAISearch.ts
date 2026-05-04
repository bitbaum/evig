'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'

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

interface UseAISearchReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isSearching: boolean
  searchResults: SearchResult[]
  search: () => Promise<void>
  clearResults: () => void
}

export function useAISearch(): UseAISearchReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const search = useCallback(async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    const result = await apiFetch<{ results: SearchResult[] }>(`/api/ai/search-products?q=${encodeURIComponent(searchQuery)}`)
    if (result.success && result.data) {
      setSearchResults(result.data.results ?? [])
    }
    setIsSearching(false)
  }, [searchQuery])

  const clearResults = useCallback(() => {
    setSearchResults([])
    setSearchQuery('')
  }, [])

  return { searchQuery, setSearchQuery, isSearching, searchResults, search, clearResults }
}
