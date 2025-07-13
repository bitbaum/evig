'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useDropdown } from '@/lib/contexts/DropdownContext'
import { cn } from '@/lib/utils'

interface DropdownTriggerProps {
  id: string
  href: string
  children: React.ReactNode
  hasDropdown?: boolean
  isMultiColumn?: boolean
  className?: string
  onHover?: boolean
}

export function DropdownTrigger({ 
  id, 
  href, 
  children, 
  hasDropdown = false, 
  isMultiColumn = false,
  className = '',
  onHover = true
}: DropdownTriggerProps) {
  const { 
    openDropdown, 
    setOpenDropdown, 
    registerDropdownElement,
    setHoverTimeout,
    clearHoverTimeout
  } = useDropdown()
  
  const triggerRef = useRef<HTMLDivElement>(null)
  const isOpen = openDropdown === id
  
  useEffect(() => {
    if (triggerRef.current && hasDropdown) {
      triggerRef.current.dataset.multiColumn = isMultiColumn.toString()
      registerDropdownElement(id, triggerRef.current)
      
      // Add direct DOM event listeners for more reliable mouse event handling
      const element = triggerRef.current
      
      const handleMouseEnterDOM = () => {
        if (!onHover || !hasDropdown) return
        clearHoverTimeout()
        setOpenDropdown(id)
      }
      
      const handleMouseLeaveDOM = () => {
        if (!onHover || !hasDropdown) return
        setHoverTimeout(() => {
          setOpenDropdown(null)
        }, 150)
      }
      
      element.addEventListener('mouseenter', handleMouseEnterDOM)
      element.addEventListener('mouseleave', handleMouseLeaveDOM)
      
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnterDOM)
        element.removeEventListener('mouseleave', handleMouseLeaveDOM)
      }
    }
  }, [id, isMultiColumn, hasDropdown, registerDropdownElement, onHover, setOpenDropdown, clearHoverTimeout, setHoverTimeout])

  const baseClasses = cn(
    "relative inline-flex items-center gap-1 px-4 py-2.5 rounded-lg",
    "text-base font-medium transition-all duration-200 ease-in-out",
    "hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
    "text-gray-700 hover:text-gray-900",
    isOpen && hasDropdown && "text-gray-900 bg-gray-50/80",
    className
  )

  // Always render as a Link for navigation, but add hover behavior for dropdowns
  const linkContent = (
    <>
      <span className="relative z-10">
        {children}
      </span>
      {hasDropdown && (
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            "text-gray-400 group-hover:text-green-600",
            isOpen && "rotate-180 text-green-600"
          )}
          aria-hidden="true"
        />
      )}
    </>
  )

  if (!hasDropdown) {
    return (
      <Link
        href={href}
        className={baseClasses}
      >
        {linkContent}
      </Link>
    )
  }

  // For dropdown items, wrap in a div with hover behavior but keep Link clickable
  return (
    <div 
      ref={triggerRef} 
      className="relative group"
    >
      {/* Hover bridge for better UX */}
      <div
        className="absolute inset-0 -inset-x-2 -inset-y-1 bg-transparent pointer-events-none"
        style={{
          top: '-8px',
          bottom: '-12px',
          left: '-8px',
          right: '-8px'
        }}
      />
      
      <Link
        href={href}
        className={baseClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={hasDropdown ? `dropdown-${id}` : undefined}
        id={`dropdown-trigger-${id}`}
      >
        {linkContent}
      </Link>
    </div>
  )
} 