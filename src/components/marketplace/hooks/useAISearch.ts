'use client'

import { useState, useCallback } from 'react'

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
    try {
      const res = await fetch(`/api/ai/search-products?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results ?? [])
      }
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  const clearResults = useCallback(() => {
    setSearchResults([])
    setSearchQuery('')
  }, [])

  return { searchQuery, setSearchQuery, isSearching, searchResults, search, clearResults }
}
