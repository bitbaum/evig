'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sticky left-rail table-of-contents for the businessplan page.
 *
 * Client component because scroll-spy needs IntersectionObserver — the
 * rest of the businessplan page stays server-rendered. The contract is
 * just a list of {id, label} items; the page hands them in.
 *
 * Highlight rule: the section whose top is currently inside the upper
 * 40% of the viewport is "active". When no section is in that zone
 * (e.g. mid-section while a long one fills the screen), the most
 * recently entered section stays active. After the user clicks an
 * anchor, the browser scrolls and the observer settles on that section
 * automatically.
 */
export function DesktopTocRail({
  nav,
}: {
  nav: {
    label: string
    items: { id: string; label: string }[]
  }
}) {
  const [activeId, setActiveId] = useState<string>(nav.items[0]?.id ?? '')

  useEffect(() => {
    const targets = nav.items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el)
    if (targets.length === 0) return

    // Map id → last known intersectionRatio so we can pick the most-
    // visible section when more than one is in the active zone.
    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        // Pick the section with the highest intersection ratio.
        // Ties broken by document order (the first section listed wins).
        let bestId = ''
        let bestRatio = 0
        for (const item of nav.items) {
          const r = ratios.get(item.id) ?? 0
          if (r > bestRatio) {
            bestId = item.id
            bestRatio = r
          }
        }
        if (bestId) setActiveId(bestId)
      },
      {
        // Activation zone: top 10% to top 60% of viewport. A section
        // becomes "active" when its top enters this band and stays until
        // its top exits. Wider than typical scroll-spy because section
        // headings are large (display-md) and visitors scroll in chunks.
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const t of targets) observer.observe(t)
    return () => observer.disconnect()
  }, [nav.items])

  return (
    <nav aria-label={nav.label} className="ui-public-toc-rail hidden lg:block">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-3">
        {nav.label}
      </p>
      <ul className="space-y-1.5 text-sm">
        {nav.items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'relative block rounded-md px-2 py-1.5 transition-colors',
                  active
                    ? 'bg-surface-raised font-medium text-text-primary'
                    : 'text-text-tertiary hover:bg-surface-raised hover:text-text-primary',
                )}
              >
                {/* Subtle left-edge accent for the active item; only
                    shows on hover for the rest. Discipline: no off-
                    palette colour, no shadow. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-action"
                  />
                )}
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
