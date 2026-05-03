'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, ExternalLink, ArrowRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { NavigationItem } from '@/config/navigation'
import { ORG } from '@/config/org'
import { Logo } from '@/components/ui/Logo'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

/**
 * MobileMenu Component
 * Clean, modern mobile navigation matching the new header design
 */
export function MobileMenu({
  isOpen,
  onClose,
  navigationItems,
  triggerRef,
}: MobileMenuProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const t = useTranslations('nav')
  const tAccessibility = useTranslations('accessibility')
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer setState to avoid synchronous update during effect
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle body scroll lock and focus
  useEffect(() => {
    if (isOpen) {
      menuPanelRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      triggerRef?.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, triggerRef])

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
      className="fixed inset-0 z-[100] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm",
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
          "fixed inset-y-0 right-0 z-[101] w-full sm:max-w-md",
          "bg-white shadow-2xl",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <button type="button" onClick={onClose} className="cursor-pointer bg-transparent border-none p-0">
            <Logo />
          </button>
          <button
            type="button"
            className={cn(
              "p-2 -mr-2 rounded-lg",
              "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
              "transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            )}
            onClick={onClose}
            aria-label={tAccessibility('closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Experimental Site Banner */}
        <div className="mx-6 mt-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
            <span>
              {t('experimentalBanner')} –
              <a
                href={ORG.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-amber-800 hover:text-amber-900 underline ml-1"
                onClick={onClose}
              >
                {t('experimentalBannerLink')}
              </a>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="space-y-1">
            {primaryItems.map((item) => {
              const itemLabel = item.nameKey ? t(item.nameKey as never) : item.name
              return (
                <li key={item.name}>
                  {item.subItems ? (
                    // Expandable menu item
                    <div>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between py-3 px-4 -mx-4",
                          "text-base font-medium text-neutral-900",
                          "rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                        )}
                        onClick={() => handleDropdownToggle(item.name)}
                        aria-expanded={openDropdown === item.name}
                      >
                        {itemLabel}
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-neutral-500 transition-transform duration-200",
                            openDropdown === item.name && "rotate-180 text-emerald-600"
                          )}
                        />
                      </button>

                      {/* Sub-items */}
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-300",
                          openDropdown === item.name
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        <ul className="mt-1 ml-4 space-y-1 border-l-2 border-neutral-100 pl-4">
                          {item.subItems.filter(sub => !sub.isSection).map((subItem) => {
                            const subLabel = subItem.nameKey ? t(subItem.nameKey as never) : subItem.name
                            return (
                              <li key={subItem.name}>
                                {subItem.external ? (
                                  <a
                                    href={subItem.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "group flex items-center gap-2 py-2.5",
                                      "text-sm text-neutral-600 hover:text-neutral-900",
                                      "transition-colors duration-200"
                                    )}
                                    onClick={onClose}
                                  >
                                    <span>{subLabel}</span>
                                    {subItem.badge && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 rounded">
                                        {subItem.badge}
                                      </span>
                                    )}
                                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    className={cn(
                                      "group flex items-center gap-2 py-2.5 w-full text-left",
                                      "text-sm text-neutral-600 hover:text-neutral-900",
                                      "transition-colors duration-200"
                                    )}
                                    onClick={() => handleNavigation(subItem.href)}
                                  >
                                    <span>{subLabel}</span>
                                    {subItem.badge && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 rounded">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 py-3 px-4 -mx-4",
                        "text-base font-medium text-neutral-900",
                        "rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                      )}
                      onClick={onClose}
                    >
                      {itemLabel}
                      <ExternalLink className="w-4 h-4 text-neutral-500" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "block w-full text-left py-3 px-4 -mx-4",
                        "text-base font-medium text-neutral-900",
                        "rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                      )}
                      onClick={() => handleNavigation(item.href)}
                    >
                      {itemLabel}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Action Items (Contact) */}
          {actionItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <ul className="space-y-1">
                {actionItems.map((item) => {
                  const actionLabel = item.nameKey ? t(item.nameKey as never) : item.name
                  return (
                    <li key={item.name}>
                      <button
                        type="button"
                        className={cn(
                          "block w-full text-left py-3 px-4 -mx-4",
                          "text-base font-medium text-neutral-900",
                          "rounded-xl hover:bg-neutral-50 transition-colors duration-200"
                        )}
                        onClick={() => handleNavigation(item.href)}
                      >
                        {actionLabel}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </nav>

        {/* Footer - Locale Switcher + Auth Actions */}
        <div className="border-t border-neutral-100 px-6 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{t('language')}</span>
          <LocaleSwitcher />
        </div>
        <div className="px-6 pb-4">
          {session?.user ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {session.user.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || session.user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {session.user.name || t('defaultUser')}
                  </p>
                  <p className="text-xs text-primary-600 font-medium">
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
                  "bg-primary-600 hover:bg-primary-700 rounded-xl",
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
                href="/auth/login"
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 text-center",
                  "text-sm font-medium text-neutral-600",
                  "border border-neutral-200 rounded-xl",
                  "hover:bg-neutral-50 hover:text-neutral-900 transition-colors duration-200"
                )}
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/register"
                onClick={onClose}
                className={cn(
                  "flex-1 py-3 text-center",
                  "text-sm font-medium text-white",
                  "bg-primary-600 rounded-xl",
                  "hover:bg-primary-700 transition-colors duration-200"
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
