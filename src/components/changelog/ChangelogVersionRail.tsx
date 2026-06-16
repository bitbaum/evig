'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ChangelogVersionRailProps {
  label: string
  items: { id: string; label: string }[]
}

/**
 * Sticky left-rail version index — scroll-spy highlights the release
 * currently in view. Same contract as businessplan DesktopTocRail.
 */
export function ChangelogVersionRail({ label, items }: ChangelogVersionRailProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el)
    if (targets.length === 0) return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestId = ''
        let bestRatio = 0
        for (const item of items) {
          const r = ratios.get(item.id) ?? 0
          if (r > bestRatio) {
            bestId = item.id
            bestRatio = r
          }
        }
        if (bestId) setActiveId(bestId)
      },
      {
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const t of targets) observer.observe(t)
    return () => observer.disconnect()
  }, [items])

  return (
    <nav aria-label={label} className="ui-public-toc-rail hidden lg:block">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'relative block rounded-md px-2 py-1.5 font-mono text-xs transition-colors',
                  active
                    ? 'bg-surface-raised font-medium text-text-primary'
                    : 'text-text-tertiary hover:bg-surface-raised hover:text-text-primary',
                )}
              >
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
