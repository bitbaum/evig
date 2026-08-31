import type { NavigationItem } from '@/config/navigation';
import {
  SERVICE_CONFIGS,
  type ServiceCategoryKey,
  type ServiceNavGroup,
} from '@/app/[locale]/services/data';

/**
 * Service links for the main navigation — derived from SERVICE_CONFIGS (the
 * services SSOT) so a menu can never drift from the actual service pages.
 * Add, remove, reorder, re-href or re-GROUP a service in SERVICE_CONFIGS and
 * both menus follow.
 *
 * Only the LINKS are derived (which services, their order, grouping, href).
 * Labels stay in the `nav` namespace because the menu uses intentionally
 * shorter wording than the full services.catalog titles (e.g. "Linux
 * einrichten" vs "Linux & Open Source"). Each service's i18n key matches its
 * SERVICE_CONFIGS `key`, so the nav resolves `nav.items.{key}` /
 * `nav.items.{key}Desc` with no per-service mapping.
 *
 * `available: false` services are omitted — the nav only surfaces live work.
 */

/** Categories shown under Dienstleistungen, in display order. */
const SERVICES_MENU_CATEGORIES: ServiceCategoryKey[] = ['organisations'];

function servicesInGroup(group: ServiceNavGroup) {
  return SERVICE_CONFIGS.filter((s) => s.navGroup === group && s.available);
}

function link(service: (typeof SERVICE_CONFIGS)[number]): NavigationItem {
  return {
    name: service.key,
    nameKey: service.key,
    href: service.href,
    descriptionKey: `${service.key}Desc`,
  };
}

/** Dienstleistungen mega-menu — what evig does FOR organisations. */
export function buildServicesNavigationItems(): NavigationItem[] {
  const items: NavigationItem[] = [];

  for (const categoryKey of SERVICES_MENU_CATEGORIES) {
    const inCategory = servicesInGroup('services').filter((s) => s.categoryKey === categoryKey);
    if (inCategory.length === 0) continue;

    // Section eyebrow — label + overview link resolve from nav.items.{category}.
    items.push({
      name: categoryKey,
      nameKey: categoryKey,
      href: '/services',
      isSection: true,
    });
    items.push(...inCategory.map(link));
  }

  return items;
}

/**
 * The service pages that belong under Lernen.
 *
 * Linux and the open-source registry are the two most substantial pieces of
 * teaching material evig owns — a distro-recommendation matrix and a 43-entry
 * alternatives registry. They were three levels deep under Dienstleistungen,
 * where nobody looking to learn would find them.
 */
export function buildLearnServiceNavigationItems(): NavigationItem[] {
  return servicesInGroup('learn').map(link);
}
