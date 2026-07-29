'use client'

// Owns the scrollable navigation slice: primary items (expandable groups, external + plain links) and action items.

import { ChevronDown, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { NavigationItem } from '@/config/navigation'
import { Button } from '@/components/ui/button'
import { NAV_STATE } from '@/lib/design/nav'
import { cn } from '@/lib/utils'
import { groupItemsBySection } from '@/components/layout/header/utils'
import { navItemLabel, type NavTranslator } from '@/components/layout/header/nav-i18n'
import { MobileSubLink } from '@/components/layout/mobile-menu/MobileSubLink'

export function MobileMenuNav({
  primaryItems,
  actionItems,
  openDropdown,
  handleDropdownToggle,
  handleNavigation,
  t,
  badgeLabel,
  onClose,
}: {
  primaryItems: NavigationItem[]
  actionItems: NavigationItem[]
  openDropdown: string | null
  handleDropdownToggle: (itemName: string) => void
  handleNavigation: (href: string) => void
  t: ReturnType<typeof useTranslations<'nav'>>
  badgeLabel: (key: string | undefined) => string | null
  onClose: () => void
}) {
  const pathname = usePathname()
  return (
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
                                <Eyebrow className="mb-2">
                                  {group.section.nameKey
                                    ? navItemLabel(t as NavTranslator, group.section.nameKey)
                                    : group.section.name}
                                </Eyebrow>
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
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    "block w-full text-left py-3 px-4 -mx-4 h-auto justify-start",
                    "text-sm font-medium text-text-primary",
                    "rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200",
                    pathname === item.href && NAV_STATE.sidebar.active
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
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={cn(
                      "block w-full text-left py-3 px-4 -mx-4 h-auto justify-start",
                      "text-base font-medium text-text-primary",
                      "rounded-xl hover:bg-surface-raised dark:hover:bg-surface-base/4 transition-colors duration-200",
                      pathname === item.href && NAV_STATE.sidebar.active
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
  )
}
