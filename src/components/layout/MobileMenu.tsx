'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { NavigationItem } from '@/config/navigation'
import { ORG } from '@/config/org'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import { groupItemsBySection } from '@/components/layout/header/utils'
import { navItemDescription, navItemLabel, type NavTranslator } from '@/components/layout/header/nav-i18n'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
}

/**
 * MobileMenu Component
 * Clean, modern mobile navigation matching the new header design
 */
export function MobileMenu({
  isOpen,
  onClose,
  navigationItems,
}: MobileMenuProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const t = useTranslations('nav')
  const tBadge = useTranslations('nav.badge')
  const tAccessibility = useTranslations('accessibility')
  const tTheme = useTranslations('accessibility.theme')

  // navigation config uses `badge: 'new'` (i18n key, not literal). Map
  // here so consumers below stay simple.
  function badgeLabel(key: string | undefined): string | null {
    if (!key) return null
    try { return tBadge(key as never) } catch { return key }
  }
  // Escape-to-close, initial focus, focus restore (to the hamburger trigger)
  // and the Tab trap all live in the shared hook; attach its ref to the panel.
  const menuPanelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer setState to avoid synchronous update during effect
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Lock body scroll while the menu is open.
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  const handleNavigation = (href: string) => {
    if (href === '#') return
    router.push(href)
    setTimeout(() => {
      onClose()
      setOpenDropdown(null)
    }, 50)
  }

  const handleDropdownToggle = (itemName: string) => {
    setOpenDropdown(openDropdown === itemName ? null : itemName)
  }

  if (!mounted || !isOpen) return null

  // Separate primary nav from action items
  const primaryItems = navigationItems.filter(item => !item.highlight)
  const actionItems = navigationItems.filter(item => item.highlight)

  return createPortal(
    <div
      className="fixed inset-0 z-100 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-xs",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuPanelRef}
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-101 w-full sm:max-w-md",
          // Border-only separation matches the rest of the design system —
          // the translucent backdrop already provides the plane lift.
          "bg-surface-base border-l border",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle dark:border-white/6">
          <Button type="button" variant="ghost" onClick={onClose} className="cursor-pointer bg-transparent border-none p-0 h-auto">
            <Logo />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "-mr-2 rounded-lg",
              "text-text-tertiary hover:text-text-primary hover:bg-surface-raised dark:hover:bg-surface-base/6",
              "transition-colors duration-200"
            )}
            onClick={onClose}
            aria-label={tAccessibility('closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* Experimental Site Banner */}
        <div className="mx-4 mt-3 sm:mx-6">
          <div className="flex items-center gap-2 rounded-lg border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-400">
            <div className="w-2 h-2 bg-warning-400 rounded-full animate-pulse shrink-0" />
            <span>
              {t('experimentalBanner')} –
              <a
                href={ORG.websiteLegacy}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-warning-800 dark:text-warning-300 hover:text-warning-900 dark:hover:text-warning-200 underline ml-1"
                onClick={onClose}
              >
                {t('experimentalBannerLink')}
              </a>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <ul className="space-y-1">
            {primaryItems.map((item) => {
              const itemLabel = item.nameKey ? navItemLabel(t as NavTranslator, item.nameKey) : item.name
              return (
                <li key={item.name}>
                  {item.subItems ? (
                    // Expandable menu item
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          "flex w-full items-center justify-between py-3 px-4 -mx-4 h-auto",
                          "text-sm font-medium text-text-primary",
                          "rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200"
                        )}
                        onClick={() => handleDropdownToggle(item.name)}
                        aria-expanded={openDropdown === item.name}
                      >
                        {itemLabel}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-text-tertiary transition-transform duration-200",
                            openDropdown === item.name && "rotate-180 text-action"
                          )}
                        />
                      </Button>

                      {/* Sub-items — grouped by section, same contract as desktop mega menu */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          openDropdown === item.name
                            ? "max-h-[1200px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="mt-2 ml-2 space-y-4 border-l border-subtle pl-4">
                          {(() => {
                            const groups = groupItemsBySection(item.subItems)
                            const hasSections = groups.some((g) => g.section)
                            if (hasSections) {
                              return groups.map((group, groupIdx) => (
                                <div key={groupIdx}>
                                  {group.section && (
                                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                                      {group.section.nameKey
                                        ? navItemLabel(t as NavTranslator, group.section.nameKey)
                                        : group.section.name}
                                    </p>
                                  )}
                                  <ul className="space-y-0.5">
                                    {group.items.map((subItem) => (
                                      <MobileSubLink
                                        key={subItem.nameKey ?? subItem.name}
                                        subItem={subItem}
                                        t={t}
                                        badgeLabel={badgeLabel}
                                        onNavigate={handleNavigation}
                                        onClose={onClose}
                                      />
                                    ))}
                                  </ul>
                                </div>
                              ))
                            }
                            return (
                              <ul className="space-y-0.5">
                                {item.subItems
                                  .filter((sub) => !sub.isSection)
                                  .map((subItem) => (
                                    <MobileSubLink
                                      key={subItem.nameKey ?? subItem.name}
                                      subItem={subItem}
                                      t={t}
                                      badgeLabel={badgeLabel}
                                      onNavigate={handleNavigation}
                                      onClose={onClose}
                                    />
                                  ))}
                              </ul>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 py-3 px-4 -mx-4",
                        "text-sm font-medium text-text-primary",
                        "rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200"
                      )}
                      onClick={onClose}
                    >
                      {itemLabel}
                      <ExternalLink className="w-4 h-4 text-text-tertiary dark:text-text-tertiary" />
                    </a>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "block w-full text-left py-3 px-4 -mx-4 h-auto justify-start",
                        "text-sm font-medium text-text-primary",
                        "rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      {itemLabel}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Action Items (Contact) */}
          {actionItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-subtle dark:border-white/6">
              <ul className="space-y-1">
                {actionItems.map((item) => {
                  const actionLabel = item.nameKey ? navItemLabel(t as NavTranslator, item.nameKey) : item.name
                  return (
                    <li key={item.name}>
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          "block w-full text-left py-3 px-4 -mx-4 h-auto justify-start",
                          "text-base font-medium text-text-primary",
                          "rounded-xl hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200"
                        )}
                        onClick={() => handleNavigation(item.href)}
                      >
                        {actionLabel}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer - Language pills (one-tap) + theme toggle + Auth Actions.
            On phones the theme toggle lives here (the top bar hides it below
            sm to keep the scarce header width for account actions). */}
        <div className="border-t border-subtle dark:border-white/6 px-6 pt-3 pb-1 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-text-tertiary mb-2">{t('language')}</p>
              <LocaleSwitcher inline />
            </div>
            <div className="sm:hidden">
              <p className="text-xs font-medium text-text-tertiary mb-2">{tTheme('label')}</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <div className="px-6 pb-4">
          {session?.user ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-action-muted/8 rounded-xl border border-subtle dark:border-action/20">
                <div className="w-10 h-10 rounded-full bg-action flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {session.user.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || session.user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {session.user.name || t('defaultUser')}
                  </p>
                  <p className="text-xs text-action font-medium">
                    {t('loggedIn')}
                  </p>
                </div>
              </div>

              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                onClick={onClose}
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3",
                  "text-sm font-medium text-white",
                  "bg-action hover:bg-action rounded-xl",
                  "transition-colors duration-200"
                )}
              >
                {t('toDashboard')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                href={ROUTES.public.login}
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 text-center",
                  "text-sm font-medium text-text-secondary",
                  "border dark:border-white/10 rounded-xl",
                  "hover:bg-surface-raised dark:hover:bg-surface-base/6 hover:text-text-primary transition-colors duration-200"
                )}
              >
                {t('login')}
              </Link>
              <Link
                href={ROUTES.public.register}
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 text-center",
                  "text-sm font-medium text-white",
                  "bg-action rounded-xl",
                  "hover:bg-action transition-colors duration-200"
                )}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function MobileSubLink({
  subItem,
  t,
  badgeLabel,
  onNavigate,
  onClose,
}: {
  subItem: NavigationItem
  t: ReturnType<typeof useTranslations<'nav'>>
  badgeLabel: (key: string | undefined) => string | null
  onNavigate: (href: string) => void
  onClose: () => void
}) {
  const subLabel = subItem.nameKey ? navItemLabel(t as NavTranslator, subItem.nameKey) : subItem.name
  const subDescription = subItem.descriptionKey
    ? navItemDescription(t as NavTranslator, subItem.descriptionKey)
    : subItem.description

  if (subItem.external) {
    return (
      <li>
        <a
          href={subItem.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group block rounded-lg px-2 py-2.5',
            'hover:bg-surface-raised transition-colors duration-200',
          )}
          onClick={onClose}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            {subLabel}
            {subItem.badge && (
              <span className="rounded-full bg-action-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-action">
                {badgeLabel(subItem.badge)}
              </span>
            )}
            <ExternalLink className="h-3 w-3 text-text-tertiary" />
          </span>
          {subDescription && (
            <span className="mt-0.5 block text-xs leading-snug text-text-secondary line-clamp-2">
              {subDescription}
            </span>
          )}
        </a>
      </li>
    )
  }

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'group flex h-auto w-full flex-col items-start justify-start rounded-lg px-2 py-2.5',
          'hover:bg-surface-raised transition-colors duration-200',
        )}
        onClick={() => onNavigate(subItem.href)}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          {subLabel}
          {subItem.badge && (
            <span className="rounded-full bg-action-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-action">
              {badgeLabel(subItem.badge)}
            </span>
          )}
        </span>
        {subDescription && (
          <span className="mt-0.5 block text-left text-xs leading-snug text-text-secondary line-clamp-2">
            {subDescription}
          </span>
        )}
      </Button>
    </li>
  )
}
