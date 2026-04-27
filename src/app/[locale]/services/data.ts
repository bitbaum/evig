import {
  Wrench,
  HardDrive,
  Server,
  Shield,
  Code,
  Globe,
  Cpu,
} from 'lucide-react'
import type { FilterConfig } from '@/hooks/useFiltering'

export type ServiceCategoryKey = 'hardware' | 'software' | 'soon'

/** Pure config — no translatable strings. Translations come from services.catalog.* */
export interface ServiceConfig {
  key: string                  // camelCase i18n key (maps to services.catalog.{key})
  slug?: string                // booking API slug (only services that support online booking)
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href: string
  available: boolean
  categoryKey: ServiceCategoryKey
  badge?: string
}

/** Fully hydrated service with translated strings — built in page.tsx */
export type Service = ServiceConfig & {
  title: string
  description: string
  features: string[]
  category: string
  highlight: string
  pricing?: string
}

export const SERVICE_CONFIGS: ServiceConfig[] = [
  // Hardware Services
  {
    key: 'computerRepair',
    slug: 'computer-repair',
    icon: Wrench,
    href: '/services/computer-repair-upgrades',
    available: true,
    categoryKey: 'hardware',
  },
  {
    key: 'dataRecovery',
    slug: 'data-recovery',
    icon: HardDrive,
    href: '/services/data-recovery-transfer',
    available: true,
    categoryKey: 'hardware',
  },
  {
    key: 'hardwareRecycling',
    icon: Shield,
    href: '/services/hardware-recycling',
    available: true,
    categoryKey: 'hardware',
  },

  // Software Solutions
  {
    key: 'webDesign',
    icon: Globe,
    href: '/services/web-design-development',
    available: true,
    categoryKey: 'software',
  },
  {
    key: 'linuxOpenSource',
    slug: 'linux-installation',
    icon: Server,
    href: '/services/linux-open-source',
    available: true,
    categoryKey: 'software',
  },
  {
    key: 'openSourceSolutions',
    icon: Code,
    href: '/services/open-source-solutions',
    available: true,
    categoryKey: 'software',
  },

  // Coming Soon
  {
    key: 'buildYourComputer',
    icon: Cpu,
    href: '/services/build-your-computer',
    available: false,
    badge: 'Soon',
    categoryKey: 'soon',
  },
]

/** Category keys in display order — used to build filter options */
export const SERVICE_CATEGORY_KEYS: ServiceCategoryKey[] = ['hardware', 'software', 'soon']

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
      color: 'green',
    },
  ]
}
