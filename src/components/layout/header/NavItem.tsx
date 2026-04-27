'use client'

/**
 * Navigation item with optional mega menu dropdown
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '@/config/navigation'
import { groupItemsBySection } from './utils'
import { MegaMenuContent } from './MegaMenuContent'

interface NavItemProps {
  item: NavigationItem
  onAnyOpen: () => void
  onAnyClose: () => void
}

export function NavItem({ item, onAnyOpen, onAnyClose }: NavItemProps) {
  const t = useTranslations('nav')
  const label = item.nameKey ? t(item.nameKey as never) : item.name
  const [isOpen, setIsOpen] = useState(false)
  const hasDropdown = item.subItems && item.subItems.length > 0
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (hasDropdown) {
      setIsOpen(true)
      onAnyOpen()
    }
  }

  const handleMouseLeave = () => {
    if (hasDropdown) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false)
        onAnyClose()
      }, 100)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onAnyClose()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Simple link without dropdown
  if (!hasDropdown) {
    return (
      <Link
        href={item.href}
        className={cn(
          "relative px-4 py-2 text-sm font-medium text-gray-600",
          "hover:text-gray-900 transition-colors duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
        )}
      >
        {label}
      </Link>
    )
  }

  // Group items by sections for mega menu
  const groups = groupItemsBySection(item.subItems!)
  const hasMultipleGroups = groups.length > 1

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <Link
        href={item.href}
        onMouseEnter={handleMouseEnter}
        className={cn(
          "group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg",
          "transition-all duration-200",
          isOpen
            ? "text-gray-900 bg-gray-50"
            : "text-gray-600 hover:text-gray-900",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-500 transition-transform duration-200",
            isOpen && "rotate-180 text-emerald-600"
          )}
        />
      </Link>

      {/* Dropdown Panel - Full width mega menu */}
      {isOpen && (
        <>
          {/* Invisible hover bridge */}
          <div className="absolute left-0 right-0 h-4 top-full" />

          {/* Mega Menu Container - Positioned from header edge */}
          <div
            className="fixed left-0 right-0 top-16 z-50"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <MegaMenuContent
                groups={groups}
                subItems={item.subItems!}
                hasMultipleGroups={hasMultipleGroups}
                onClose={handleClose}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
