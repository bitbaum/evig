'use client'

/**
 * Header Component - Main navigation header
 *
 * Design principles:
 * - Clean, spacious layout
 * - Subtle hover states
 * - Single primary CTA
 * - Elegant mega menus
 */

import { useState, useRef, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { cn } from '@/lib/utils'

// Skip SSR — both use useSession which requires SessionProvider (lazy-loaded client-side only)
const UserMenu = dynamic(() => import('@/components/auth/UserMenu').then(m => ({ default: m.UserMenu })), { ssr: false })
const MobileMenu = dynamic(() => import('../MobileMenu').then(m => ({ default: m.MobileMenu })), { ssr: false })
import { mainNavigation } from '@/config/navigation'
import { NavItem } from './NavItem'

export function Header() {
  const tNav = useTranslations('nav')
  const tAccessibility = useTranslations('accessibility')
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
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "transition-all duration-300",
          isScrolled || anyDropdownOpen
            ? "bg-white/95 backdrop-blur-xl shadow-sm shadow-neutral-200/50 border-b border-neutral-100"
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
                    "px-4 py-2 text-sm font-medium text-neutral-600",
                    "hover:text-neutral-900 transition-colors duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
                  )}
                >
                  {contactItem.nameKey ? tNav(contactItem.nameKey as never) : contactItem.name}
                </Link>
              )}

              {/* Locale Switcher */}
              <LocaleSwitcher />

              {/* Divider */}
              <div className="w-px h-5 bg-neutral-200" />

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
                  "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100",
                  "transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                )}
                onClick={() => setMobileMenuOpen(true)}
                aria-label={tAccessibility('openMenu')}
                aria-expanded={mobileMenuOpen}
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
