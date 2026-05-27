/**
 * SuggestionContext
 * @fileoverview Context provider for suggestion system state management
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface PageInfo {
  path: string
  title?: string
  url: string
}

interface SuggestionContextValue {
  currentPage: PageInfo
  isVisible: boolean
}

const SuggestionContext = createContext<SuggestionContextValue | undefined>(undefined)

interface SuggestionProviderProps {
  children: ReactNode
}

export function SuggestionProvider({ children }: SuggestionProviderProps) {
  const [currentPage, setCurrentPage] = useState<PageInfo>({
    path: '/',
    title: 'Startseite',
    url: typeof window !== 'undefined' ? window.location.href : '/'
  })
  const [isVisible, setIsVisible] = useState(true)

  // Update page info when route changes
  useEffect(() => {
    const updatePageInfo = () => {
      const path = window.location.pathname
      const title = document.title || path
      const url = window.location.href

      setCurrentPage({
        path,
        title: title === 'Startseite' ? undefined : title, // Don't duplicate "Startseite"
        url
      })
    }

    // Initial update
    updatePageInfo()

    // Listen for navigation changes
    const handleNavigation = () => {
      setTimeout(updatePageInfo, 100) // Small delay to ensure DOM updates
    }

    window.addEventListener('popstate', handleNavigation)

    // Listen for Next.js router changes if available
    // Note: We check for __NEXT_DATA__ which is always present in Next.js apps
    if (typeof window !== 'undefined' && '__NEXT_DATA__' in window) {
      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState

      history.pushState = function(...args) {
        originalPushState.apply(this, args)
        handleNavigation()
      }

      history.replaceState = function(...args) {
        originalReplaceState.apply(this, args)
        handleNavigation()
      }
    }

    return () => {
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])

  // Hide suggestion button on certain pages if needed
  useEffect(() => {
    const hiddenPaths = ['/admin', '/dashboard'] // Add paths where button should be hidden
    const shouldHide = hiddenPaths.some(path => currentPage.path.startsWith(path))
    setIsVisible(!shouldHide)
  }, [currentPage.path])

  const value: SuggestionContextValue = {
    currentPage,
    isVisible
  }

  return (
    <SuggestionContext.Provider value={value}>
      {children}
    </SuggestionContext.Provider>
  )
}

export function useSuggestionContext(): SuggestionContextValue {
  const context = useContext(SuggestionContext)
  if (context === undefined) {
    throw new Error('useSuggestionContext must be used within a SuggestionProvider')
  }
  return context
}






