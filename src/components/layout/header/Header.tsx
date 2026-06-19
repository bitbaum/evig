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
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
  // "headroom" pattern: header hides on scroll DOWN past a threshold,
  // re-appears on scroll UP. Always visible near the top of the page so
  // the brand isn't missing on first paint.
  const [isHidden, setIsHidden] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const lastScrollY = useRef(0)

  // Filter navigation - separate main nav from action items
  const primaryNavItems = mainNavigation.filter(item => !item.highlight)
  const contactItem = mainNavigation.find(item => item.highlight)

  // Scroll detection for header styling + smart hide/show.
  // Threshold of 5px on the delta filters out micro-jitter from trackpads
  // and inertial scrolling; 120px floor below which we never hide so the
  // header always appears near the top of any page.
  useEffect(() => {
    const REVEAL_FLOOR = 120
    const DELTA_THRESHOLD = 5
    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = currentY - lastScrollY.current
      setIsScrolled(currentY > 10)
      if (currentY < REVEAL_FLOOR) {
        setIsHidden(false)
      } else if (delta > DELTA_THRESHOLD) {
        setIsHidden(true)
      } else if (delta < -DELTA_THRESHOLD) {
        setIsHidden(false)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Never hide the header while a dropdown is open — folding nav out from
  // under the user mid-interaction is disorienting.
  const effectivelyHidden = isHidden && !anyDropdownOpen && !mobileMenuOpen

  // Publish the current header offset as a CSS custom property on the
  // document root so any sub-nav (sticky strip below the header) can
  // follow the smart-hide state. When the header is visible the offset
  // is its own height (h-16 → 4rem). When hidden the offset is 0, which
  // lets sticky sub-navs slide up into the freed space instead of leaving
  // a 64-px gap above themselves. CSS transition on the consumer side
  // animates the change smoothly.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--header-offset', effectivelyHidden ? '0px' : '4rem')
    return () => {
      // Reset on unmount so downstream consumers don't see a stale offset.
      root.style.removeProperty('--header-offset')
    }
  }, [effectivelyHidden])

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
          // z-50 sits above sub-navs (z-40). Sub-navs follow the smart-hide
          // state via --header-offset (set in the useEffect above), so we
          // can keep the natural stacking order — header on top — without
          // the two ever visually colliding: when the header is visible the
          // sub-nav sits exactly below it; when it hides, the sub-nav
          // smoothly slides up into the freed space.
          "fixed top-0 left-0 right-0 z-50",
          "transition-[transform,background-color,backdrop-filter,border-color] duration-300 ease-out",
          effectivelyHidden ? "-translate-y-full" : "translate-y-0",
          // Scrolled state: border-only (no shadow). Double-cueing scroll
          // with both shadow + border was a calmer-than-x.com signal.
          isScrolled || anyDropdownOpen
            ? "bg-surface-base/95 backdrop-blur-xl border-b border dark:border-white/6"
            : "bg-surface-base/80 backdrop-blur-md"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center justify-between h-16 px-6 lg:px-8">
            {/* Logo */}
            <div className="shrink-0">
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
                    "px-4 py-2 text-sm font-medium text-text-secondary",
                    "hover:text-text-primary transition-colors duration-200",
                    "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 rounded-lg"
                  )}
                >
                  {contactItem.nameKey ? tNav(contactItem.nameKey as never) : contactItem.name}
                </Link>
              )}

              {/* Locale Switcher */}
              <LocaleSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Divider */}
              <div className="w-px h-5 bg-surface-overlay dark:bg-surface-base/10" />

              {/* User Menu / Auth */}
              <UserMenu />
            </div>

            {/* Mobile Right Side - Auth + Menu */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Theme Toggle - Mobile */}
              <ThemeToggle />
              {/* User Menu - Mobile */}
              <UserMenu />
              {/* Mobile Menu Button */}
              <Button
                ref={mobileMenuTriggerRef}
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "relative rounded-lg",
                  "text-text-secondary hover:text-text-primary hover:bg-surface-raised dark:text-text-muted dark:hover:bg-surface-base/6"
                )}
                onClick={() => setMobileMenuOpen(true)}
                aria-label={tAccessibility('openMenu')}
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </Button>
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
      />
    </>
  )
}
