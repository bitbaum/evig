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
      // An "evig Shop" entry stood here, pointing at EXTERNAL_LINKS.shopware —
      // an empty string. It rendered as <a href="" target="_blank">, so the
      // first item of the Marktplatz menu opened a blank copy of the current
      // page in a new tab. Its comment still described "the official RevampIT
      // storefront". evig has ONE store and it is /marketplace (see the
      // storefront architecture rule in .claude/CLAUDE.md), so there is no
      // second shop to link to.
      {
        nameKey: 'communityListings',
        href: ROUTES.public.marketplace,
        descriptionKey: 'communityListingsDesc',
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
        nameKey: 'requestHelp',
        href: ROUTES.public.itHilfeCreate,
        descriptionKey: 'requestHelpDesc',
      },
      {
        // Helper side of the two-sided flow: technicians browse open requests
        // and make offers. The page existed but was unreachable from the nav.
        nameKey: 'browseRequests',
        href: ROUTES.public.itHilfeBrowseRequests,
        descriptionKey: 'browseRequestsDesc',
      },
      {
        nameKey: 'findTechnician',
        href: ROUTES.public.techniker,
        descriptionKey: 'findTechnicianDesc',
      },
      {
        nameKey: 'becomeTechnician',
        href: ROUTES.public.profilTechniker,
        descriptionKey: 'becomeTechnicianDesc',
      },
    ],
  },
  /**
   * Access to intelligence — the third thing a person can get from evig, and
   * the one the whole organisation is named for.
   *
   * Both of these lived under "Über uns", which asks who evig is. A division
   * page explaining the AI offer and a pool you can join and pay a share of
   * are not answers to that question; they are answers to "what can I get".
   */
  ai: {
    id: 'ai',
    sectionKey: 'sectionAiAccess',
    hubHref: ROUTES.public.ai,
    items: [
      {
        nameKey: 'aiDivisionLink',
        href: ROUTES.public.ai,
        descriptionKey: 'aiDivision',
      },
      {
        nameKey: 'aboPools',
        href: ROUTES.public.abos,
        descriptionKey: 'aboPoolsDesc',
      },
    ],
  },
} as const

/** Marktplatz mega-menu — the three things you can get from evig. */
export function buildMarktplatzNavigationItems(): NavigationItem[] {
  const { hardware, itHelp, ai } = CUSTOMER_JOURNEYS

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
    external?: boolean
  }): NavigationItem => ({
    name: item.nameKey,
    nameKey: item.nameKey,
    href: item.href,
    descriptionKey: item.descriptionKey,
    external: item.external,
  })

  return [
    section(hardware.sectionKey, hardware.hubHref),
    ...hardware.items.map(link),
    section(itHelp.sectionKey, itHelp.hubHref),
    ...itHelp.items.map(link),
    section(ai.sectionKey, ai.hubHref),
    ...ai.items.map(link),
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
  orgShop: `${ROUTES.public.marketplace}?seller_type=revampit`,
} as const
