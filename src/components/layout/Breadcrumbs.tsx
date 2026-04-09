'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb path label overrides
 *
 * Maps URL path segments to German display labels.
 * Add entries here when new routes need readable breadcrumbs.
 */
const PATH_LABELS: Record<string, string> = {
  // Admin sections
  admin: 'Admin',
  products: 'Produkte',
  workshops: 'Workshops',
  services: 'Dienstleistungen',
  users: 'Benutzer',
  team: 'Team',
  locations: 'Standorte',
  content: 'Inhalte',
  analyse: 'Analyse',
  approvals: 'Freigaben',
  settings: 'Einstellungen',
  hirn: 'Hirn',
  finanzen: 'Finanzen',
  erfassung: 'Erfassung',
  inventory: 'Inventar',

  // Dashboard sections
  dashboard: 'Dashboard',
  seller: 'Verkäufer',
  repairer: 'Techniker',
  techniker: 'Techniker',
  messages: 'Nachrichten',
  profile: 'Profil',

  // Shop sections
  shop: 'Shop',
  cart: 'Warenkorb',
  checkout: 'Kasse',
  search: 'Suche',
  category: 'Kategorie',
  orders: 'Bestellungen',

  // Other
  blog: 'Blog',
  marketplace: 'Marktplatz',
  'it-hilfe': 'IT-Hilfe',

  // Actions
  new: 'Neu',
  edit: 'Bearbeiten',
  create: 'Erstellen',
}

/**
 * Get a readable label for a path segment
 */
function getLabel(segment: string): string {
  return PATH_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

interface BreadcrumbsProps {
  /** Override the home path (default: contextual — /admin for admin pages, / for others) */
  homePath?: string
  /** Additional class names */
  className?: string
}

export function Breadcrumbs({ homePath, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  // Determine home path from context
  const isAdmin = segments[0] === 'admin'
  const isDashboard = segments[0] === 'dashboard'
  const resolvedHomePath = homePath ?? (isAdmin ? '/admin' : isDashboard ? '/dashboard' : '/')
  const homeLabel = isAdmin ? 'Admin' : isDashboard ? 'Dashboard' : 'Home'

  // Build breadcrumb items (skip the first segment since it's covered by home)
  const items = segments.slice(1).map((segment, index) => {
    const path = '/' + segments.slice(0, index + 2).join('/')
    const isLast = index === segments.length - 2

    // Skip UUID-like segments in display but keep them in path
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
    const label = isUuid ? 'Detail' : getLabel(segment)

    return { path, label, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
      <ol className="flex items-center gap-1.5 text-sm text-gray-600">
        <li>
          <Link
            href={resolvedHomePath}
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>
        {items.map(({ path, label, isLast }) => (
          <li key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-gray-900 truncate max-w-[200px]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                href={path}
                className="hover:text-gray-900 transition-colors truncate max-w-[200px]"
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
