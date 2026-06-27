import type { NavigationItem } from '@/config/navigation'
import { SERVICE_CONFIGS, type ServiceCategoryKey } from '@/app/[locale]/services/data'

/**
 * Services mega-menu items — derived from SERVICE_CONFIGS (the services SSOT)
 * so the menu can never drift from the actual service pages. Add, remove,
 * reorder or re-href a service in SERVICE_CONFIGS and the nav follows.
 *
 * Only the LINKS are derived (which services, their order, grouping by
 * category, and href). Labels stay in the `nav` namespace because the menu
 * uses intentionally shorter wording than the full services.catalog titles
 * (e.g. "Reparatur & Upgrades" vs "Computerreparatur & Aufrüstungen"). Each
 * service's i18n key matches its SERVICE_CONFIGS `key`, so the nav resolves
 * `nav.items.{key}` / `nav.items.{key}Desc` with no per-service mapping.
 *
 * `soon`/unavailable services (e.g. build-your-computer) are omitted — the nav
 * only surfaces live services.
 */

/** Categories shown in the menu, in display order. `soon` is intentionally excluded. */
const MENU_CATEGORIES: ServiceCategoryKey[] = ['hardware', 'software']

export function buildServicesNavigationItems(): NavigationItem[] {
  const items: NavigationItem[] = []

  for (const categoryKey of MENU_CATEGORIES) {
    // Section eyebrow — label + overview link resolve from nav.items.{category}.
    items.push({
      name: categoryKey,
      nameKey: categoryKey,
      href: '/services',
      isSection: true,
    })

    for (const service of SERVICE_CONFIGS) {
      if (service.categoryKey !== categoryKey || !service.available) continue
      items.push({
        name: service.key,
        nameKey: service.key,
        href: service.href,
        descriptionKey: `${service.key}Desc`,
      })
    }
  }

  return items
}
