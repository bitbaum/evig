'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useDropdown } from '@/lib/contexts/DropdownContext'
import { NavigationItem } from '@/config/navigation'

interface MultiColumnDropdownProps {
  id: string
  items: NavigationItem[]
  className?: string
}

interface DropdownSectionProps {
  title: string
  items: NavigationItem[]
  className?: string
}

function DropdownSection({ title, items, className = '' }: DropdownSectionProps) {
  const { setOpenDropdown } = useDropdown()

  return (
    <div className={`space-y-1 ${className}`}>
      {title && (
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          if (item.href === '#') {
            return (
              <div
                key={item.name}
                className="block rounded-lg px-3 py-2 text-sm leading-6 text-gray-400 cursor-not-allowed"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-400">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 ml-2 flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            )
          }

          const ItemContent = (
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed group-hover:text-gray-600 transition-colors duration-200">
                    {item.description}
                  </div>
                )}
              </div>
              {item.badge && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 ml-2 flex-shrink-0 group-hover:bg-green-200 transition-colors duration-200">
                  {item.badge}
                </span>
              )}
            </div>
          )

          return item.external ? (
            <a
              key={item.name}
              href={item.href}
              className="group block rounded-lg px-3 py-2 text-sm leading-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpenDropdown(null)}
            >
              {ItemContent}
            </a>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className="group block rounded-lg px-3 py-2 text-sm leading-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
              onClick={() => setOpenDropdown(null)}
            >
              {ItemContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function MultiColumnDropdown({ id, items, className = '' }: MultiColumnDropdownProps) {
  const { 
    openDropdown, 
    dropdownPosition, 
    setOpenDropdown, 
    closeAllDropdowns,
    handleDropdownMouseEnter,
    handleDropdownMouseLeave
  } = useDropdown()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if items have sections
  const hasSections = items.some(item => item.isSection)

  // Group items by sections or create a default section
  const sections: { [key: string]: NavigationItem[] } = {}
  let currentSection = ''

  if (hasSections) {
    // Handle sectioned items (Services, Projects, Get Involved)
    items.forEach(item => {
      if (item.isSection) {
        currentSection = item.name
        sections[currentSection] = []
      } else if (currentSection) {
        sections[currentSection].push(item)
      }
    })
  } else {
    // Handle non-sectioned items (About, etc.)
    const nonSectionItems = items.filter(item => !item.isSection)
    if (nonSectionItems.length > 0) {
      sections['Menu'] = nonSectionItems
    }
  }

  const sectionEntries = Object.entries(sections)
  const isVisible = openDropdown === id && dropdownPosition

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeAllDropdowns()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, closeAllDropdowns])

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAllDropdowns()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, closeAllDropdowns])

  if (!isVisible || !dropdownPosition || sectionEntries.length === 0) {
    return null
  }

  // Calculate responsive columns based on content
  const getColumnCount = () => {
    if (!hasSections) {
      // For simple dropdowns like About, use single column
      return 1
    }
    
    const sectionCount = sectionEntries.length
    if (sectionCount <= 2) return 2
    if (sectionCount <= 3) return 3
    return 4
  }

  const columnCount = getColumnCount()
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columnCount] || 'grid-cols-1'

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: dropdownPosition.x,
        top: dropdownPosition.y,
        width: hasSections ? dropdownPosition.width : Math.min(dropdownPosition.width, 400)
      }}
      onMouseEnter={handleDropdownMouseEnter}
      onMouseLeave={handleDropdownMouseLeave}
    >
      {/* Extended hover bridge to prevent gaps when moving mouse down */}
      <div 
        className="absolute -top-8 bg-transparent"
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
        style={{ 
          left: '-40px',
          right: '-40px',
          height: '32px', // Larger bridge area
          top: '-32px'
        }}
      />
      
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm lg:hidden"
        onClick={closeAllDropdowns}
      />
      
      {/* Dropdown content */}
      <div className="relative">
        {/* Arrow pointer */}
        <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />
        
        {/* Main dropdown */}
        <div className={`
          relative bg-white rounded-xl shadow-xl border border-gray-200/60 
          backdrop-blur-sm p-6 max-h-[80vh] overflow-y-auto dropdown-scroll
          ${className}
        `}>
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
            <button
              onClick={closeAllDropdowns}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Multi-column layout */}
          <div className={`
            grid gap-8 
            grid-cols-1 sm:${hasSections ? 'grid-cols-2' : 'grid-cols-1'} lg:${gridCols}
            ${hasSections ? 'lg:gap-12' : 'lg:gap-6'}
          `}>
            {sectionEntries.map(([sectionName, sectionItems]) => (
              <DropdownSection
                key={sectionName}
                title={hasSections ? sectionName : ''} // Hide title for non-sectioned dropdowns
                items={sectionItems}
                className="min-w-0"
              />
            ))}
          </div>

          {/* Optional footer - only show for multi-section dropdowns */}
          {hasSections && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Need help? Contact our team</span>
                <Link 
                  href="/contact" 
                  className="text-green-600 hover:text-green-700 font-medium"
                  onClick={() => setOpenDropdown(null)}
                >
                  Get Support →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
} 