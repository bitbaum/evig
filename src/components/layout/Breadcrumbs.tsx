'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbsProps {
  /** Override the home path (default: contextual — /admin for admin pages, / for others) */
  homePath?: string
  /** Additional class names */
  className?: string
}

// Segments that map directly to a breadcrumb translation key.
// If a route exists in src/config/routes.ts that produces a URL segment not in
// this map, the breadcrumb falls back to a Title-Cased English label — which
// is wrong on every non-English locale. Keep this in sync with admin routes.
const SEGMENT_KEYS: Record<string, string> = {
  admin: 'admin', workshops: 'workshops',
  services: 'services', users: 'users', team: 'team',
  locations: 'locations', content: 'content', analyse: 'analyse',
  approvals: 'approvals', settings: 'settings', hirn: 'hirn',
  finanzen: 'finanzen', erfassung: 'erfassung', inventory: 'inventory',
  dashboard: 'dashboard', seller: 'seller', repairer: 'repairer',
  techniker: 'techniker', messages: 'messages', profile: 'profile',
  shop: 'shop', cart: 'cart', checkout: 'checkout', search: 'search',
  category: 'category', orders: 'orders', blog: 'blog',
  marketplace: 'marketplace', 'it-hilfe': 'itHilfe',
  new: 'new', edit: 'edit', create: 'create',
  // Admin routes added since the SSOT was last touched
  protocols: 'protocols', tasks: 'tasks', decisions: 'decisions',
  hr: 'hr', vacancies: 'vacancies', applications: 'applications',
  projects: 'projects', timecards: 'timecards', payroll: 'payroll',
  donations: 'donations', membership: 'membership', intake: 'intake',
  reviews: 'reviews', analytics: 'analytics', kennzahlen: 'kennzahlen',
  wirkung: 'wirkung', transparenz: 'transparenz', appointments: 'appointments',
}

export function Breadcrumbs({ homePath, className }: BreadcrumbsProps) {
  const t = useTranslations('components.breadcrumbs')
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  // Determine home path from context
  const isAdmin = segments[0] === 'admin'
  const isDashboard = segments[0] === 'dashboard'
  const resolvedHomePath = homePath ?? (isAdmin ? '/admin' : isDashboard ? '/dashboard' : '/')
  const homeLabel = isAdmin ? t('admin') : isDashboard ? t('dashboard') : t('home')

  function getLabel(segment: string): string {
    const key = SEGMENT_KEYS[segment]
    if (key) return t(key as Parameters<typeof t>[0])
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }

  // Build breadcrumb items (skip the first segment since it's covered by home)
  const items = segments.slice(1).map((segment, index) => {
    const path = '/' + segments.slice(0, index + 2).join('/')
    const isLast = index === segments.length - 2

    // Skip UUID-like segments in display but keep them in path
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    const label = isUuid ? t('detail') : getLabel(segment)

    return { path, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-text-tertiary">
        <li>
          <Link
            href={resolvedHomePath}
            className="flex items-center gap-1 hover:text-text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>
        {items.map(({ path, label, isLast }) => (
          <li key={path} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
            {isLast ? (
              <span className="font-medium text-text-primary truncate max-w-[200px]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={path}
                className="hover:text-text-primary transition-colors truncate max-w-[200px]"
              >
                {label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
