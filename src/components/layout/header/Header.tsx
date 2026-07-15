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
const UserCommandPalette = dynamic(() => import('@/components/search/UserCommandPalette').then(m => ({ default: m.UserCommandPalette })), { ssr: false })
const CommandPaletteTrigger = dynamic(() => import('@/components/search/CommandPaletteTrigger').then(m => ({ default: m.CommandPaletteTrigger })), { ssr: false })
const MobileMenu = dynamic(() => import('../MobileMenu').then(m => ({ default: m.MobileMenu })), { ssr: false })
import { mainNavigation } from '@/config/navigation'
import { NavItem } from './NavItem'
import { navItemLabel, type NavTranslator } from './nav-i18n'

export function Header() {
  const tAccessibility = useTranslations('accessibility')
  const tNav = useTranslations('nav')
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
  // Highlighted items (e.g. Kontakt) render as a CTA in the desktop action
  // cluster — previously they were filtered out of the bar with no desktop
  // render path, so the contact CTA was unreachable on desktop.
  const actionNavItems = mainNavigation.filter(item => item.highlight)

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
  // is its measured height (h-14 on phones, h-16 from sm up — measured,
  // not hardcoded, so the two stay in sync). When hidden the offset is 0,
  // which lets sticky sub-navs slide up into the freed space instead of
  // leaving a gap above themselves. CSS transition on the consumer side
  // animates the change smoothly.
  useEffect(() => {
    const root = document.documentElement
    const publish = () => {
      const height = headerRef.current?.offsetHeight ?? 64
      root.style.setProperty('--header-offset', effectivelyHidden ? '0px' : `${height}px`)
    }
    publish()
    window.addEventListener('resize', publish)
    return () => {
      window.removeEventListener('resize', publish)
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
          <nav className="flex items-center justify-between gap-3 sm:gap-6 h-14 sm:h-16 px-3 sm:px-6 lg:px-8">
            {/* Logo — the ONE flexible item in the row (min-w-0, no shrink-0).
                On narrow phones it scales down so the action cluster — most
                importantly the menu button — is never pushed off-screen. */}
            <div className="min-w-0">
              <Logo className="h-9 sm:h-10" />
            </div>

            {/* Primary Navigation — inline only at xl+ (below xl the hamburger menu
                is used). Content-width + the nav's gap-6/justify-between keep clean
                space from the logo and actions — NOT flex-1, which made the items
                overflow and collide with the logo. */}
            <div className="hidden xl:flex items-center">
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

            {/* Right Side Actions — desktop (xl+). shrink-0 so the account actions
                (bell, avatar / login) can never be clipped by the nav. */}
            <div className="hidden xl:flex shrink-0 items-center gap-2 ml-auto">
              {/* Command palette trigger (logged-in users) */}
              <CommandPaletteTrigger />

              {/* Locale Switcher */}
              <LocaleSwitcher />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Highlighted CTA(s) — e.g. Kontakt (was unreachable on desktop) */}
              {actionNavItems.map((item) => (
                <Button key={item.name} href={item.href} variant="outline" size="sm">
                  {item.nameKey ? navItemLabel(tNav as NavTranslator, item.nameKey) : item.name}
                </Button>
              ))}

              {/* Divider */}
              <div className="w-px h-5 bg-surface-overlay dark:bg-surface-base/10" />

              {/* User Menu / Auth */}
              <UserMenu />
            </div>

            {/* Compact Right Side — phones, tablets and laptops below xl. Account
                actions (bell + avatar / login) stay visible; full nav is in the menu. */}
            <div className="xl:hidden flex shrink-0 items-center gap-1.5 ml-auto">
              {/* One-tap theme toggle from sm up. On phones the top bar is the
                  scarcest surface on the site — the toggle lives in the mobile
                  menu footer instead (next to the language switcher). */}
              <ThemeToggle className="hidden sm:inline-flex" />
              <CommandPaletteTrigger />
              <UserMenu />
              {/* Mobile Menu Button */}
              <Button
                ref={mobileMenuTriggerRef}
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  // Boxed like the theme toggle — the bare ghost icon was easy
                  // to miss on phones (thin faint lines at the screen edge).
                  // h-9 w-9 matches every other icon control in the bar.
                  "relative h-9 w-9 rounded-lg border border-subtle bg-surface-raised",
                  "text-text-primary hover:border-strong hover:bg-surface-raised"
                )}
                onClick={() => setMobileMenuOpen(true)}
                aria-label={tAccessibility('openMenu')}
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Single command-palette dialog (always rendered, not in an lg-gated
                container, so showModal works at every width). Triggers above open
                it via a window event. */}
            <UserCommandPalette />
          </nav>
        </div>
      </header>

      {/* Spacer for fixed header — must mirror the nav's responsive height */}
      <div className="h-14 sm:h-16" />

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navigationItems={mainNavigation}
      />
    </>
  )
}
