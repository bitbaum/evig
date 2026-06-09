'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/**
 * Sticky sub-nav for the Monitor-Upcycling mini-site.
 *
 * Lives below the main site nav, above every page in this section. Keeping
 * it as its own client component so the parent `layout.tsx` can stay a
 * server component (i18n message fetch).
 *
 * When this section eventually splits into its own domain, this component
 * becomes the primary top-nav of the standalone site — same structure,
 * different parent.
 */

type Item = { href: string; label: string }

export function UpcyclingSubNav({ items, brand }: { items: Item[]; brand: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label={brand}
      // z-50 wins over the main Header (z-40) so when the header animates
      // back in on scroll-up, it slides UNDER this nav instead of covering
      // it. Sticky top-0 keeps the sub-nav pinned through long pages.
      className="sticky top-0 z-50 border-b border-subtle bg-surface-base/85 backdrop-blur supports-[backdrop-filter]:bg-surface-base/70"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/projects/upcycling"
          className="flex shrink-0 items-center gap-2 py-3 font-mono text-xs uppercase tracking-[0.18em] text-text-primary"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-action"
          />
          {brand}
        </Link>

        <ul className="-mb-px flex flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => {
            const isActive =
              item.href === '/projects/upcycling'
                ? pathname === '/projects/upcycling'
                : pathname.startsWith(item.href)
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex items-center border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-action text-text-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-primary',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
