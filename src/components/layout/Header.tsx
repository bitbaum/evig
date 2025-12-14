'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { MobileMenu } from './MobileMenu'
import { WelcomeModal } from '@/components/ui/WelcomeModal'
import { UserMenu } from '@/components/auth/UserMenu'
import { cn } from '@/lib/utils'
import { mainNavigation, NavigationItem } from '@/config/navigation'

// Helper function to group navigation items by sections
function groupItemsBySection(items: NavigationItem[]) {
  const groups: { section: NavigationItem | null; items: NavigationItem[] }[] = []
  let currentSection: NavigationItem | null = null
  let currentItems: NavigationItem[] = []

  items.forEach((item) => {
    if (item.isSection) {
      if (currentSection || currentItems.length > 0) {
        groups.push({ section: currentSection, items: [...currentItems] })
      }
      currentSection = item
      currentItems = []
    } else {
      currentItems.push(item)
    }
  })

  if (currentSection || currentItems.length > 0) {
    groups.push({ section: currentSection, items: [...currentItems] })
  }

  return groups
}

/**
 * NavItem Component - Navigation item with optional mega menu
 */
function NavItem({ 
  item,
  onAnyOpen,
  onAnyClose
}: { 
  item: NavigationItem
  onAnyOpen: () => void
  onAnyClose: () => void
}) {
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
        {item.name}
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
        {item.name}
        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
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
              <div 
                className={cn(
                  "mt-2 bg-white rounded-2xl shadow-2xl shadow-gray-200/50",
                  "border border-gray-100",
                  "overflow-hidden",
                  "animate-in fade-in slide-in-from-top-2 duration-200",
                  hasMultipleGroups ? "p-0" : "p-2"
                )}
              >
                {hasMultipleGroups ? (
                  // Multi-column layout
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    {groups.map((group, idx) => (
                      <div key={idx} className="p-6">
                        {group.section && (
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            {group.section.name}
                          </h3>
                        )}
                        <ul className="space-y-1">
                          {group.items.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                onClick={handleClose}
                                className={cn(
                                  "group flex items-start gap-3 p-3 -mx-3 rounded-xl",
                                  "transition-all duration-200",
                                  "hover:bg-gray-50"
                                )}
                                {...(subItem.external && { target: "_blank", rel: "noopener noreferrer" })}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                                      {subItem.name}
                                    </span>
                                    {subItem.badge && (
                                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 rounded-full">
                                        {subItem.badge}
                                      </span>
                                    )}
                                    {subItem.external && (
                                      <ExternalLink className="w-3 h-3 text-gray-400" />
                                    )}
                                  </div>
                                  {subItem.description && (
                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                      {subItem.description}
                                    </p>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single column layout
                  <div className="py-2">
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={handleClose}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-3 rounded-xl",
                          "transition-all duration-200",
                          "hover:bg-gray-50"
                        )}
                        {...(subItem.external && { target: "_blank", rel: "noopener noreferrer" })}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {subItem.name}
                            </span>
                            {subItem.badge && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-50 text-emerald-700 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                            {subItem.external && (
                              <ExternalLink className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          {subItem.description && (
                            <p className="mt-0.5 text-sm text-gray-500">
                              {subItem.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Header Component - Main navigation header
 * Design principles:
 * - Clean, spacious layout
 * - Subtle hover states
 * - Single primary CTA
 * - Elegant mega menus
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null)

  // Filter navigation - separate main nav from action items
  const primaryNavItems = mainNavigation.filter(item => !item.highlight)
  const contactItem = mainNavigation.find(item => item.highlight)

  // Scroll detection for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      <WelcomeModal />
      
      <header 
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-300",
          isScrolled || anyDropdownOpen
            ? "bg-white/95 backdrop-blur-xl shadow-sm shadow-gray-200/50 border-b border-gray-100"
            : "bg-white/80 backdrop-blur-md"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center justify-between h-16 px-6 lg:px-8">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo className="h-10" />
            </div>

            {/* Primary Navigation - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center gap-1">
                {primaryNavItems.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    onAnyOpen={() => setAnyDropdownOpen(true)}
                    onAnyClose={() => setAnyDropdownOpen(false)}
                  />
                ))}
              </div>
            </div>

            {/* Right Side Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Contact Link - subtle */}
              {contactItem && (
                <Link
                  href={contactItem.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium text-gray-600",
                    "hover:text-gray-900 transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                  )}
                >
                  {contactItem.name}
                </Link>
              )}
              
              {/* Divider */}
              <div className="w-px h-5 bg-gray-200" />
              
              {/* User Menu / Auth */}
              <UserMenu />
            </div>

            {/* Mobile Right Side - Auth + Menu */}
            <div className="lg:hidden flex items-center gap-2">
              {/* User Menu - Mobile */}
              <UserMenu />
              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuTriggerRef}
                type="button"
                className={cn(
                  "relative p-2 rounded-lg",
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  "transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                )}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menü öffnen"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-16" />

      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        navigationItems={mainNavigation}
        triggerRef={mobileMenuTriggerRef}
      />
    </>
  )
}
