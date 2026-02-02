import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { AINativeCMS, AINativeCMSConfig, createAINativeCMS } from '@ai-native-cms/core'

export interface AINativeCMSContextValue {
  cms: AINativeCMS | null
  config: AINativeCMSConfig | null
  isInitialized: boolean
  error: string | null
}

export const AINativeCMSContext = createContext<AINativeCMSContextValue | undefined>(undefined)

export interface AINativeCMSProviderProps {
  config: AINativeCMSConfig
  children: ReactNode
  onInitialized?: (cms: AINativeCMS) => void
  onError?: (error: Error) => void
}

export function AINativeCMSProvider({ 
  config, 
  children, 
  onInitialized, 
  onError 
}: AINativeCMSProviderProps) {
  const [cms, setCMS] = useState<AINativeCMS | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cmsRef = useRef<AINativeCMS | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeCMS = async () => {
      try {
        setError(null)
        const cmsInstance = await createAINativeCMS(config)

        if (mounted) {
          cmsRef.current = cmsInstance
          setCMS(cmsInstance)
          setIsInitialized(true)

          if (onInitialized) {
            onInitialized(cmsInstance)
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize AI-Native CMS')

        if (mounted) {
          setError(error.message)
          setIsInitialized(false)

          if (onError) {
            onError(error)
          }
        }
      }
    }

    initializeCMS()

    return () => {
      mounted = false
      if (cmsRef.current) {
        cmsRef.current.destroy().catch(console.error)
      }
    }
  }, [config, onInitialized, onError])

  const value: AINativeCMSContextValue = {
    cms,
    config,
    isInitialized,
    error
  }

  return (
    <AINativeCMSContext.Provider value={value}>
      {children}
    </AINativeCMSContext.Provider>
  )
}

// Convenience hook to use the context
export function useAINativeCMSContext() {
  const context = useContext(AINativeCMSContext)
  
  if (!context) {
    throw new Error('useAINativeCMSContext must be used within AINativeCMSProvider')
  }
  
  return context
}