'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useDropdown } from '@/lib/contexts/DropdownContext'

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

  // Register this element with the dropdown context
  useEffect(() => {
    if (triggerRef.current && hasDropdown) {
      triggerRef.current.dataset.multiColumn = isMultiColumn.toString()
      registerDropdownElement(id, triggerRef.current)
    }
  }, [id, hasDropdown, isMultiColumn, registerDropdownElement])

  const handleMouseEnter = useCallback(() => {
    if (!onHover || !hasDropdown) return
    
    console.log(`Trigger ${id} mouse enter - clearing timeout and opening dropdown`)
    clearHoverTimeout()
    setOpenDropdown(id)
  }, [onHover, hasDropdown, clearHoverTimeout, setOpenDropdown, id])

  const handleMouseLeave = useCallback(() => {
    if (!onHover || !hasDropdown) return
    
    console.log(`Trigger ${id} mouse leave - setting timeout to close`)
    setHoverTimeout(() => {
      console.log(`Closing dropdown ${id} due to trigger timeout`)
      setOpenDropdown(null)
    })
  }, [onHover, hasDropdown, setHoverTimeout, setOpenDropdown, id])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hasDropdown && !onHover) {
      e.preventDefault()
      setOpenDropdown(isOpen ? null : id)
    }
  }, [hasDropdown, onHover, isOpen, setOpenDropdown, id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (hasDropdown && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpenDropdown(isOpen ? null : id)
    }
  }, [hasDropdown, isOpen, setOpenDropdown, id])

  const triggerClasses = `
    group flex items-center gap-x-1 text-sm font-semibold leading-6 
    text-gray-900 hover:text-green-600 transition-colors duration-200
    ${className}
  `

  const content = (
    <>
      <span>{children}</span>
      {hasDropdown && (
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-green-600' : 'group-hover:text-green-600'
          }`} 
          aria-hidden="true"
        />
      )}
    </>
  )

  return (
    <div 
      ref={triggerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Extended hover area for more reliable interaction */}
      <div 
        className="absolute bg-transparent"
        style={{
          left: '-16px',
          right: '-16px', 
          top: '-8px',
          bottom: '-12px' // Extend bottom more to connect with dropdown
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {hasDropdown ? (
        <button
          type="button"
          className={triggerClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup={true}
          aria-controls={`dropdown-${id}`}
        >
          {content}
        </button>
      ) : (
        <Link href={href} className={triggerClasses}>
          {content}
        </Link>
      )}
    </div>
  )
} 