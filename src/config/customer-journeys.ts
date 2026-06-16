/**
 * Customer journeys — SSOT for why people come to RevampIT.
 *
 * First principles (two jobs):
 *   1. Hardware — buy or sell used computers and parts
 *   2. IT help — repair, reinstall OS, fix any IT problem
 *
 * Navigation, homepage CTAs, and feature hubs should derive paths
 * and grouping from here — not invent parallel labels/routes.
 */

import { ROUTES } from '@/config/routes'
import type { NavigationItem } from '@/config/navigation'

export const CUSTOMER_JOURNEYS = {
  hardware: {
    id: 'hardware',
    sectionKey: 'sectionBuySell',
    hubHref: ROUTES.public.marketplace,
    items: [
      {
        nameKey: 'communityListings',
        href: ROUTES.public.marketplace,
        descriptionKey: 'communityListingsDesc',
      },
      {
        nameKey: 'shopRevampIT',
        href: ROUTES.public.shop,
        descriptionKey: 'orgShopDesc',
      },
      {
        nameKey: 'storeZurich',
        href: `${ROUTES.public.shop}#ladenlokal`,
        descriptionKey: 'storeDesc',
      },
      {
        nameKey: 'createListing',
        href: ROUTES.public.marketplaceSell,
        descriptionKey: 'createListingDesc',
      },
    ],
  },
  itHelp: {
    id: 'it-help',
    sectionKey: 'sectionItHelp',
    hubHref: ROUTES.public.itHilfe,
    items: [
      {
        nameKey: 'findTechnician',
        href: ROUTES.public.techniker,
        descriptionKey: 'findTechnicianDesc',
      },
      {
        nameKey: 'requestHelp',
        href: ROUTES.public.itHilfeCreate,
        descriptionKey: 'requestHelpDesc',
      },
      {
        nameKey: 'services',
        href: ROUTES.public.services,
        descriptionKey: 'servicesDesc',
      },
      {
        nameKey: 'becomeTechnician',
        href: ROUTES.public.profilTechniker,
        descriptionKey: 'becomeTechnicianDesc',
      },
    ],
  },
} as const

/** Marktplatz mega-menu — both customer journeys in two columns. */
export function buildMarktplatzNavigationItems(): NavigationItem[] {
  const { hardware, itHelp } = CUSTOMER_JOURNEYS

  const section = (
    key: string,
    href: string,
  ): NavigationItem => ({
    name: key,
    nameKey: key,
    href,
    isSection: true,
  })

  const link = (item: {
    nameKey: string
    href: string
    descriptionKey: string
  }): NavigationItem => ({
    name: item.nameKey,
    nameKey: item.nameKey,
    href: item.href,
    descriptionKey: item.descriptionKey,
  })

  return [
    section(hardware.sectionKey, hardware.hubHref),
    ...hardware.items.map(link),
    section(itHelp.sectionKey, itHelp.hubHref),
    ...itHelp.items.map(link),
  ]
}

/** Primary homepage / marketing paths for each journey. */
export const JOURNEY_ENTRYPOINTS = {
  hardware: ROUTES.public.marketplace,
  itHelp: ROUTES.public.itHilfe,
  itHelpRequest: ROUTES.public.itHilfeCreate,
  itHelpTechnicians: ROUTES.public.techniker,
  itHelpBrowseRequests: ROUTES.public.itHilfeBrowseRequests,
  becomeTechnician: ROUTES.public.profilTechniker,
  orgShop: ROUTES.public.shop,
} as const
