import { Server, Code, Globe, Factory } from 'lucide-react'
import type { FilterConfig } from '@/hooks/useFiltering'

export type ServiceCategoryKey = 'software' | 'organisations'

/**
 * Where a service appears in the main navigation.
 *
 * This exists because placement was drifting. Linux and the open-source
 * registry are teaching material — someone looking to learn should find them
 * under Lernen — but they are also services with a `/services/*` page, so the
 * first attempt hardcoded them into the Lernen menu in `navigation.tsx` while
 * `SERVICE_CONFIGS` still fed them to the Dienstleistungen menu. One item, two
 * menus, two independent lists to keep in step: exactly the drift this config
 * exists to prevent.
 *
 * Now placement is DATA. Each service declares its menu once, and both menus
 * derive from that one declaration, so a service can never be in two places or
 * in none.
 */
export type ServiceNavGroup = 'services' | 'learn'

/** Pure config — no translatable strings. Translations come from services.catalog.* */
export interface ServiceConfig {
  key: string                  // camelCase i18n key (maps to services.catalog.{key})
  slug?: string                // booking API slug (only services that support online booking)
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
  available: boolean
  categoryKey: ServiceCategoryKey
  /** Which top-level menu surfaces this service. See ServiceNavGroup. */
  navGroup: ServiceNavGroup
  badgeKey?: 'soon'
}

/** Fully hydrated service with translated strings — built in page.tsx */
export type Service = ServiceConfig & {
  title: string
  description: string
  features: string[]
  category: string
  highlight: string
  pricing?: string
  badge?: string
}

/**
 * What evig offers.
 *
 * Four services removed on 2026-08-26, in the refocus onto AI and robotics
 * for everyone:
 *
 *   computerRepair    → /it-hilfe. It advertised evig repairing your machine
 *                       at CHF 70/h, which is not the model: evig is where you
 *                       FIND a technician, and they set their price. Two front
 *                       doors for one job, and the "booking slug" booked
 *                       nothing — the seeded service_types slugs never matched
 *                       these hrefs, so the page always fell through to the
 *                       presentation-only path with isBookable: false.
 *   dataRecovery      → /it-hilfe, same reason.
 *   hardwareRecycling → removed. "Verantwortungsvolle Entsorgung" is disposal.
 *                       evig is not a recycler, and the homepage now says so.
 *   buildYourComputer → removed. 549 lines of interactive configurator for a
 *                       service flagged `available: false`, still selling the
 *                       previous organisation's "Revamped"-Zertifizierung
 *                       under an English title.
 *
 * `aiAdoption` is new: pillar 5 had no page at all and pointed at /contact.
 */
export const SERVICE_CONFIGS: ServiceConfig[] = [
  // ── Learning material that happens to also be a service ────────────────
  {
    // Bespoke static page (no DB template / online booking) — no `slug`.
    key: 'linuxOpenSource',
    icon: Server,
    href: '/services/linux-open-source',
    available: true,
    categoryKey: 'software',
    navGroup: 'learn',
  },
  {
    key: 'openSourceSolutions',
    icon: Code,
    href: '/services/open-source-solutions',
    available: true,
    categoryKey: 'software',
    navGroup: 'learn',
  },

  // ── Work evig does for organisations ───────────────────────────────────
  {
    key: 'aiAdoption',
    icon: Factory,
    href: '/services/ai-robotics',
    available: true,
    categoryKey: 'organisations',
    navGroup: 'services',
  },
  {
    key: 'webDesign',
    icon: Globe,
    href: '/services/web-design-development',
    available: true,
    categoryKey: 'organisations',
    navGroup: 'services',
  },
]

/** Category keys in display order — used to build filter options */
export const SERVICE_CATEGORY_KEYS: ServiceCategoryKey[] = ['software', 'organisations']

/** Stable filter shape — labels populated from translations in page.tsx */
export const SERVICE_FILTER_KEY = 'category' as const

/** Type-safe filter config builder */
export function buildServiceFilters(
  byCategory: string,
  categoryLabels: Record<ServiceCategoryKey, string>,
): FilterConfig[] {
  return [
    {
      key: SERVICE_FILTER_KEY,
      label: byCategory,
      options: SERVICE_CATEGORY_KEYS.map(k => categoryLabels[k]),
    },
  ]
}
