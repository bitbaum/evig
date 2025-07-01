'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

interface DropdownPosition {
  x: number
  y: number
  width: number
  alignment: 'left' | 'right' | 'center'
}

interface DropdownContextType {
  openDropdown: string | null
  dropdownPosition: DropdownPosition | null
  setOpenDropdown: (id: string | null) => void
  registerDropdownElement: (id: string, element: HTMLElement) => void
  calculatePosition: (triggerElement: HTMLElement, dropdownWidth: number) => DropdownPosition
  closeAllDropdowns: () => void
  // Enhanced hover management
  setHoverTimeout: (callback: () => void, delay?: number) => void
  clearHoverTimeout: () => void
  handleDropdownMouseEnter: () => void
  handleDropdownMouseLeave: () => void
}

const DropdownContext = createContext<DropdownContextType | null>(null)

export function useDropdown() {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('useDropdown must be used within a DropdownProvider')
  }
  return context
}

interface DropdownProviderProps {
  children: React.ReactNode
}

export function DropdownProvider({ children }: DropdownProviderProps) {
  const [openDropdown, setOpenDropdownState] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const dropdownElements = useRef<Map<string, HTMLElement>>(new Map())
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()

  const calculatePosition = useCallback((triggerElement: HTMLElement, dropdownWidth: number): DropdownPosition => {
    const rect = triggerElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY
    
    // Calculate available space
    const spaceLeft = rect.left
    const spaceRight = viewportWidth - rect.right
    const spaceBelow = viewportHeight - rect.bottom
    
    // Determine horizontal alignment
    let alignment: 'left' | 'right' | 'center' = 'left'
    let x = rect.left
    
    if (dropdownWidth > spaceRight && spaceLeft > dropdownWidth) {
      // Not enough space on right, but enough on left
      alignment = 'right'
      x = rect.right - dropdownWidth
    } else if (dropdownWidth > Math.max(spaceLeft, spaceRight)) {
      // Not enough space on either side, center it
      alignment = 'center'
      x = Math.max(20, (viewportWidth - dropdownWidth) / 2)
    }
    
    // Ensure dropdown doesn't go off-screen
    x = Math.max(20, Math.min(x, viewportWidth - dropdownWidth - 20))
    
    return {
      x,
      y: rect.bottom + scrollY - 2, // Position dropdown to overlap slightly with trigger hover area
      width: dropdownWidth,
      alignment
    }
  }, [])

  // Clear any existing hover timeout
  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = undefined
    }
  }, [])

  // Set a new hover timeout with longer delay for more forgiving UX
  const setHoverTimeout = useCallback((callback: () => void, delay: number = 500) => {
    clearHoverTimeout()
    hoverTimeoutRef.current = setTimeout(callback, delay)
  }, [clearHoverTimeout])

  // Handle dropdown content mouse enter
  const handleDropdownMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = undefined
    }
  }, [])

  // Handle dropdown content mouse leave
  const handleDropdownMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 500) // 500ms delay before closing
  }, [])

  const setOpenDropdown = useCallback((id: string | null) => {
    // Clear any existing timeout
    clearHoverTimeout()

    if (id && dropdownElements.current.has(id)) {
      const element = dropdownElements.current.get(id)!
      // Calculate dropdown width based on content type
      const isMultiColumn = element.dataset.multiColumn === 'true'
      
      // Determine appropriate width based on dropdown type
      let estimatedWidth = 320 // Default for simple dropdowns
      if (isMultiColumn) {
        estimatedWidth = Math.min(window.innerWidth - 40, 800) // Responsive multi-column width
      } else {
        estimatedWidth = 320 // Compact width for simple dropdowns like About
      }
      
      const position = calculatePosition(element, estimatedWidth)
      setDropdownPosition(position)
      setOpenDropdownState(id)
    } else {
      setOpenDropdownState(null)
      setDropdownPosition(null)
    }
  }, [calculatePosition, clearHoverTimeout])

  const registerDropdownElement = useCallback((id: string, element: HTMLElement) => {
    dropdownElements.current.set(id, element)
  }, [])

  const closeAllDropdowns = useCallback(() => {
    clearHoverTimeout()
    setOpenDropdownState(null)
    setDropdownPosition(null)
  }, [clearHoverTimeout])

  // Close dropdown on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (openDropdown) {
        closeAllDropdowns()
      }
    }

    window.addEventListener('scroll', handleScrollOrResize, { passive: true })
    window.addEventListener('resize', handleScrollOrResize)
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [openDropdown, closeAllDropdowns])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearHoverTimeout()
    }
  }, [clearHoverTimeout])

  // Enhanced global mouse tracking
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!openDropdown || !dropdownElements.current.has(openDropdown)) return
      
      const element = dropdownElements.current.get(openDropdown)!
      const rect = element.getBoundingClientRect()
      const isMultiColumn = element.dataset.multiColumn === 'true'
      
      // Expanded detection area for better UX
      const margin = isMultiColumn ? 60 : 30
      const isOverTrigger = (
        e.clientX >= rect.left - 16 &&
        e.clientX <= rect.right + 16 &&
        e.clientY >= rect.top - 8 &&
        e.clientY <= rect.bottom + 20
      )
      
      if (isOverTrigger) {
        handleDropdownMouseEnter()
      }
    }

    if (openDropdown) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      return () => document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [openDropdown, handleDropdownMouseEnter])

  const value: DropdownContextType = {
    openDropdown,
    dropdownPosition,
    setOpenDropdown,
    registerDropdownElement,
    calculatePosition,
    closeAllDropdowns,
    setHoverTimeout,
    clearHoverTimeout,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave
  }

  return (
    <DropdownContext.Provider value={value}>
      {children}
    </DropdownContext.Provider>
  )
} 