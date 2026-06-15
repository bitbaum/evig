'use client'

/**
 * Navigation item with optional mega menu dropdown.
 *
 * Keyboard model (WCAG 2.1 — APG menubar pattern):
 *   • Trigger Enter / Space: toggle open. ArrowDown: open + focus first sub-link.
 *   • While open, Escape closes and returns focus to the trigger.
 *   • Tab leaves the dropdown naturally (no focus trap — menubars aren't dialogs).
 *
 * Hover behavior is preserved for pointer users (mouse-only opening was the
 * a11y bug — we keep mouse but add keyboard equivalents, not replace).
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '@/config/navigation'
import { groupItemsBySection } from './utils'
import { MegaMenuContent } from './MegaMenuContent'
import { navItemLabel, type NavTranslator } from './nav-i18n'

interface NavItemProps {
  item: NavigationItem
  onAnyOpen: () => void
  onAnyClose: () => void
}

export function NavItem({ item, onAnyOpen, onAnyClose }: NavItemProps) {
  const t = useTranslations('nav')
  const label = item.nameKey ? navItemLabel(t as NavTranslator, item.nameKey) : item.name
  const [isOpen, setIsOpen] = useState(false)
  const hasDropdown = item.subItems && item.subItems.length > 0
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)

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

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onAnyClose()
  }, [onAnyClose])

  // Focus the first focusable element inside the open dropdown.
  // Used by ArrowDown on the trigger and by Tab-into-dropdown.
  const focusFirstInDropdown = useCallback(() => {
    if (!containerRef.current) return
    const first = containerRef.current.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (first && first !== triggerRef.current) {
      first.focus()
    } else {
      // Skip the trigger itself — go to the next one
      const all = containerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const filtered = Array.from(all).filter(el => el !== triggerRef.current)
      filtered[0]?.focus()
    }
  }, [])

  // Trigger keyboard handler — Enter/Space toggles, ArrowDown opens + focuses.
  const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (!hasDropdown) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const next = !isOpen
      setIsOpen(next)
      next ? onAnyOpen() : onAnyClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        onAnyOpen()
      }
      // Wait one tick so the dropdown DOM exists before focusing.
      requestAnimationFrame(() => focusFirstInDropdown())
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      handleClose()
      triggerRef.current?.focus()
    }
  }

  // Global Escape handler — close the dropdown from anywhere inside it.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

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
          "relative px-4 py-2 text-sm font-medium text-text-secondary whitespace-nowrap",
          "hover:text-text-primary transition-colors duration-200",
          "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 rounded-lg"
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
        ref={triggerRef}
        href={item.href}
        onMouseEnter={handleMouseEnter}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap",
          "transition-all duration-200",
          isOpen
            ? "text-text-primary bg-surface-raised dark:bg-surface-base/6"
            : "text-text-secondary hover:text-text-primary dark:text-text-muted",
          "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-text-tertiary transition-transform duration-200 motion-reduce:transition-none",
            isOpen && "rotate-180 text-action"
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
