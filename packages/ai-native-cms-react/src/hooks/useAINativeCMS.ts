import { useContext, useEffect, useState } from 'react'
import { AINativeCMSContext } from '../providers/AINativeCMSProvider'
import { AINativeCMS, SuggestionInput } from '@ai-native-cms/core'

export interface UseAINativeCMSReturn {
  cms: AINativeCMS | null
  isReady: boolean
  submitSuggestion: (input: SuggestionInput) => Promise<void>
  error: string | null
}

export function useAINativeCMS(): UseAINativeCMSReturn {
  const context = useContext(AINativeCMSContext)
  
  if (!context) {
    throw new Error('useAINativeCMS must be used within AINativeCMSProvider')
  }

  const { cms, config } = context
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeCMS = async () => {
      if (!cms) return

      try {
        if (!cms.isInitialized()) {
          await cms.init()
        }
        
        if (mounted) {
          setIsReady(true)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize CMS')
          setIsReady(false)
        }
      }
    }

    initializeCMS()

    return () => {
      mounted = false
    }
  }, [cms])

  const submitSuggestion = async (input: SuggestionInput) => {
    if (!cms || !isReady) {
      throw new Error('CMS is not ready')
    }

    try {
      const clientIP = 'unknown' // In browser context, IP detection is limited
      await cms.submitSuggestion(input, clientIP)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit suggestion')
      setError(error.message)
      throw error
    }
  }

  return {
    cms,
    isReady,
    submitSuggestion,
    error
  }
}