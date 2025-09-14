import { useState, useEffect, useCallback } from 'react'
import { useAINativeCMS } from './useAINativeCMS'
import { Suggestion, SuggestionFilters, SuggestionStatus, SuggestionStats } from '@ai-native-cms/core'

export interface UseSuggestionsOptions {
  filters?: SuggestionFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseSuggestionsReturn {
  suggestions: Suggestion[]
  stats: SuggestionStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateSuggestionStatus: (id: string, status: SuggestionStatus) => Promise<void>
  generateAIInstructions: (id: string) => Promise<string>
}

export function useSuggestions(options: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const { cms, isReady } = useAINativeCMS()
  const { filters, autoRefresh = false, refreshInterval = 30000 } = options

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [stats, setStats] = useState<SuggestionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!cms || !isReady) return

    try {
      setLoading(true)
      setError(null)

      const [suggestionsData, statsData] = await Promise.all([
        cms.getSuggestions(filters),
        cms.getStats()
      ])

      setSuggestions(suggestionsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }, [cms, isReady, filters])

  const updateSuggestionStatus = useCallback(async (id: string, status: SuggestionStatus) => {
    if (!cms || !isReady) return

    try {
      const updatedSuggestion = await cms.updateSuggestionStatus(id, status)
      
      setSuggestions(prev => 
        prev.map(s => s.id === id ? updatedSuggestion : s)
      )

      // Refresh stats after status update
      const newStats = await cms.getStats()
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suggestion status')
      throw err
    }
  }, [cms, isReady])

  const generateAIInstructions = useCallback(async (id: string): Promise<string> => {
    if (!cms || !isReady) {
      throw new Error('CMS is not ready')
    }

    try {
      const instructions = await cms.generateAIInstructions(id)
      
      setSuggestions(prev =>
        prev.map(s => 
          s.id === id 
            ? { ...s, aiInstructions: instructions, status: SuggestionStatus.AI_GENERATED }
            : s
        )
      )

      return instructions
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate AI instructions')
      setError(error.message)
      throw error
    }
  }, [cms, isReady])

  // Initial load
  useEffect(() => {
    if (isReady) {
      refresh()
    }
  }, [isReady, refresh])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !isReady) return

    const interval = setInterval(refresh, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, isReady, refresh])

  // Listen to CMS events for real-time updates
  useEffect(() => {
    if (!cms || !isReady) return

    const handleSuggestionCreated = ({ suggestion }: { suggestion: Suggestion }) => {
      setSuggestions(prev => [suggestion, ...prev])
    }

    const handleSuggestionUpdated = ({ suggestion }: { suggestion: Suggestion }) => {
      setSuggestions(prev => 
        prev.map(s => s.id === suggestion.id ? suggestion : s)
      )
    }

    const handleSuggestionAIGenerated = ({ suggestion }: { suggestion: Suggestion }) => {
      setSuggestions(prev =>
        prev.map(s => s.id === suggestion.id ? suggestion : s)
      )
    }

    cms.on('suggestion:created', handleSuggestionCreated)
    cms.on('suggestion:updated', handleSuggestionUpdated)
    cms.on('suggestion:ai_generated', handleSuggestionAIGenerated)

    return () => {
      cms.off('suggestion:created', handleSuggestionCreated)
      cms.off('suggestion:updated', handleSuggestionUpdated)
      cms.off('suggestion:ai_generated', handleSuggestionAIGenerated)
    }
  }, [cms, isReady])

  return {
    suggestions,
    stats,
    loading,
    error,
    refresh,
    updateSuggestionStatus,
    generateAIInstructions
  }
}