'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Drawer } from '@/components/ui/Drawer'
import { NavigationItem } from '@/config/navigation'
import { ORG } from '@/config/org'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { MobileMenuNav } from '@/components/layout/mobile-menu/MobileMenuNav'
import { MobileMenuFooter } from '@/components/layout/mobile-menu/MobileMenuFooter'

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
  // Portal, backdrop, focus-trap (Escape / initial focus / Tab cycle / focus
  // restore) and body scroll-lock all live in <Drawer>.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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

  // Separate primary nav from action items
  const primaryItems = navigationItems.filter(item => !item.highlight)
  const actionItems = navigationItems.filter(item => item.highlight)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      ariaLabel="Mobile Navigation"
      rootClassName="lg:hidden"
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

        {/* Experimental Site Banner — only when a legacy site exists to link to */}
        {ORG.websiteLegacy && (
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
        )}

        {/* Navigation */}
        <MobileMenuNav
          primaryItems={primaryItems}
          actionItems={actionItems}
          openDropdown={openDropdown}
          handleDropdownToggle={handleDropdownToggle}
          handleNavigation={handleNavigation}
          t={t}
          badgeLabel={badgeLabel}
          onClose={onClose}
        />

        <MobileMenuFooter
          session={session}
          t={t}
          tTheme={tTheme}
          onClose={onClose}
        />
    </Drawer>
  )
}
