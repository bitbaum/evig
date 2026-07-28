'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { BottomNav } from '@/components/layout/BottomNav'
import { Drawer } from '@/components/ui/Drawer'
import { navLinkClass } from '@/lib/design/nav'
import {
  DASHBOARD_CATEGORIES,
  getAllDashboardCards,
  groupCardsByCategory,
  type DashboardCategory,
} from '@/config/dashboard'

/**
 * User dashboard mobile navigation (`<lg` only) — a thumb-reachable bottom tab
 * bar (the sections flagged `dashboardBottomNavOrder` in sections.ts) plus a
 * "Mehr" button that opens a bottom-sheet with every dashboard destination
 * grouped by category. Replaces the horizontal-scroll strip on phones/tablets;
 * desktop keeps `DashboardNav`. Mirrors the admin MobileBottomNav pattern.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardMobileNav({
  role,
  isStaff,
  isSuperAdmin,
  isTechnician,
}: {
  role: string | null
  isStaff: boolean
  isSuperAdmin: boolean
  isTechnician: boolean
}) {
  const pathname = usePathname()

  // Compute cards here (client-side) rather than receiving them as props: the
  // cards carry lucide icon components (functions) which can't cross the RSC
  // server→client boundary. The layout passes serializable flags instead.
  const items = useMemo(
    () => getAllDashboardCards({
      role,
      isStaff,
      isSuperAdmin,
      communityRoles: isTechnician ? ['repairer'] : [],
    }),
    [role, isStaff, isSuperAdmin, isTechnician],
  )
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the sheet on navigation.
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  if (items.length === 0) return null

  const barItems = items
    .filter(i => typeof i.bottomNavOrder === 'number')
    .sort((a, b) => (a.bottomNavOrder ?? 0) - (b.bottomNavOrder ?? 0))
    .slice(0, 4)

  const grouped = groupCardsByCategory(items)
  const orderedCategories = (Object.keys(DASHBOARD_CATEGORIES) as DashboardCategory[])
    .map(id => ({ id, config: DASHBOARD_CATEGORIES[id], cards: grouped.get(id) ?? [] }))
    .filter(g => g.cards.length > 0)
    .sort((a, b) => a.config.priority - b.config.priority)

  return (
    <>
      {/* Bottom tab bar — SSOT bar chrome; the "Mehr" sheet is dashboard-specific. */}
      <BottomNav
        ariaLabel="Dashboard"
        items={barItems.map(item => ({
          key: item.id,
          href: item.href,
          label: item.shortLabel ?? item.title,
          icon: item.icon,
          active: isActive(pathname, item.href),
        }))}
        more={{ label: 'Mehr', ariaLabel: 'Mehr anzeigen', onClick: () => setMoreOpen(true), expanded: moreOpen }}
      />

      {/* "Mehr" bottom sheet — Drawer supplies the portal, focus-trap and scroll-lock. */}
      <Drawer
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        side="bottom"
        ariaLabel="Dashboard-Menü"
        rootClassName="lg:hidden"
        className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-card"
      >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Alle Bereiche</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen(false)}
                aria-label="Schliessen"
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4">
              {orderedCategories.map(group => (
                <div key={group.id}>
                  <p className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
                    {group.config.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.cards.map(card => {
                      const active = isActive(pathname, card.href)
                      const Icon = card.icon
                      return (
                        <Link
                          key={card.id}
                          href={card.href}
                          aria-current={active ? 'page' : undefined}
                          className={navLinkClass('pill', active)}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 truncate">{card.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
      </Drawer>
    </>
  )
}
