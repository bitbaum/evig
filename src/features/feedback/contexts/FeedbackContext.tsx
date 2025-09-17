'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PageContext {
  path: string
  title: string
  section: string
  lastUpdated: Date
}

interface SuggestionContextType {
  currentPage: PageContext
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  refreshPage: () => void
}

const SuggestionContext = createContext<SuggestionContextType | undefined>(undefined)

export function SuggestionProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageContext>({
    path: '/',
    title: 'Home',
    section: 'Main',
    lastUpdated: new Date()
  })
  const [isVisible, setIsVisible] = useState(true)

  const updatePageContext = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const title = document.title || getPageTitle(path)
      const section = getPageSection(path)
      
      setCurrentPage({
        path,
        title,
        section,
        lastUpdated: new Date()
      })
    }
  }

  const refreshPage = () => {
    updatePageContext()
  }

  useEffect(() => {
    updatePageContext()

    // Listen for navigation changes
    const handleNavigation = () => {
      setTimeout(updatePageContext, 100) // Small delay to ensure DOM is updated
    }

    // Listen for popstate events (browser back/forward)
    const handlePopState = () => handleNavigation()
    
    let originalPushState: typeof window.history.pushState
    let originalReplaceState: typeof window.history.replaceState
    
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState)
      
      // Override pushState and replaceState to catch programmatic navigation
      originalPushState = window.history.pushState
      originalReplaceState = window.history.replaceState
      
      window.history.pushState = function(...args) {
        originalPushState.apply(this, args)
        handleNavigation()
      }
      
      window.history.replaceState = function(...args) {
        originalReplaceState.apply(this, args)
        handleNavigation()
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState)
        // Restore original methods
        if (originalPushState) window.history.pushState = originalPushState
        if (originalReplaceState) window.history.replaceState = originalReplaceState
      }
    }
  }, [])

  // Remove the problematic pathname dependency that causes SSR issues
  // The navigation handling above already covers path changes

  return (
    <SuggestionContext.Provider value={{
      currentPage,
      isVisible,
      setIsVisible,
      refreshPage
    }}>
      {children}
    </SuggestionContext.Provider>
  )
}

export function useSuggestionContext() {
  const context = useContext(SuggestionContext)
  if (context === undefined) {
    throw new Error('useSuggestionContext must be used within a SuggestionProvider')
  }
  return context
}

function getPageTitle(path: string): string {
  const titles: Record<string, string> = {
    '/': 'RevampIT - Sustainable Technology',
    '/about': 'About Us - RevampIT',
    '/services': 'Our Services - RevampIT',
    '/projects': 'Projects - RevampIT',
    '/workshops': 'Workshops - RevampIT',
    '/get-involved': 'Get Involved - RevampIT',
    '/contact': 'Contact Us - RevampIT',
    '/revamped': 'REVAMPED Certification - RevampIT',
    '/revamp-ux': 'Revamp-UX - RevampIT'
  }
  
  // Handle dynamic routes
  if (path.startsWith('/services/')) return 'Service Details - RevampIT'
  if (path.startsWith('/projects/')) return 'Project Details - RevampIT'
  if (path.startsWith('/get-involved/')) return 'Get Involved - RevampIT'
  
  return titles[path] || 'RevampIT'
}

function getPageSection(path: string): string {
  const sections: Record<string, string> = {
    '/': 'Home',
    '/about': 'About',
    '/services': 'Services',
    '/projects': 'Projects',
    '/workshops': 'Education',
    '/get-involved': 'Community',
    '/contact': 'Contact',
    '/revamped': 'Certification',
    '/revamp-ux': 'Technology'
  }
  
  // Handle dynamic routes
  if (path.startsWith('/services/')) return 'Services'
  if (path.startsWith('/projects/')) return 'Projects'
  if (path.startsWith('/get-involved/')) return 'Community'
  if (path.startsWith('/admin')) return 'Admin'
  
  return sections[path] || 'General'
}