import React from 'react'
import { ORG } from '@/config/org'
import { buildMarktplatzNavigationItems } from '@/config/customer-journeys'
import { DIVISION_PAGES, EVIG_DIVISIONS } from '@/config/divisions'
import { ROUTES } from '@/config/routes'
import { buildServicesNavigationItems } from '@/config/services-nav'

/**
 * Navigation Configuration - SSOT for all navigation data
 *
 * Design principles:
 * - Direct-link top-level items are lightweight (no dropdown cognitive load)
 * - Clear, action-oriented labels
 * - No "coming soon" items in nav (show when ready)
 * - Consolidated shop experience
 * - Progressive disclosure (simple → detailed)
 * - Mega menus use mono section eyebrows + equal-weight link rows (x.ai pattern)
 */

export interface NavigationItem {
  name: string
  nameKey?: string
  href: string
  description?: string
  descriptionKey?: string
  external?: boolean
  subItems?: NavigationItem[]
  highlight?: boolean
  isSection?: boolean
  badge?: string
  icon?: React.ReactNode
  isMultiColumn?: boolean
  dropdownAlignment?: 'left' | 'center' | 'right'
}

/**
 * Main navigation structure
 *
 * Strategic positioning (6 top-level items):
 * 1. Über uns       - Identity: mission, vision, projects, evig ai, trust pages
 * 2. Dienstleistungen - Professional services (B2C)
 * 3. Marktplatz     - ALL customer-facing buy/sell/help: Shop + Marketplace + IT-Hilfe
 * 4. Lernen         - Workshops, guides, blog
 * 5. Mitmachen      - Volunteer, donate, partner, membership
 * 6. Kontakt        - CTA (highlighted)
 *
 * Key decision: the storefront and IT-Hilfe live together under "Marktplatz"
 * because someone looking for a device or for help does not care about the
 * organisational boundary between evig's own stock and community listings.
 * Inside Marktplatz, demand-side links come before supply-side links: buy
 * first, find a technician next, then create a listing or offer repairs.
 */
export const mainNavigation: NavigationItem[] = [
  {
    name: 'Über uns',
    nameKey: 'about',
    href: '/about',
    descriptionKey: 'aboutDesc',
    subItems: [
      {
        name: 'Mission & Geschichte',
        nameKey: 'missionHistory',
        href: '/about',
        descriptionKey: 'missionHistoryDesc',
      },
      {
        // The manifesto — the clearest statement of what evig is for. It was
        // reachable only from the footer, which meant the page that answers
        // "why does this organisation exist" was the hardest one to find.
        name: 'Vision',
        nameKey: 'vision',
        href: ROUTES.public.vision,
        descriptionKey: 'visionDesc',
      },
      {
        // What evig builds — its own projects (SSOT: config/evig-projects.ts).
        name: 'Projekte',
        nameKey: 'projects',
        href: '/projects',
        descriptionKey: 'projectsDesc',
      },
      // The evig divisions that own a page (computers and repairs are reached
      // through Marktplatz). Wordmarks come from the divisions SSOT and are
      // proper nouns — they stay literal in every locale, so no nameKey.
      ...EVIG_DIVISIONS.filter((division) => division.id in DIVISION_PAGES).map((division) => ({
        name: division.wordmark,
        href: division.href,
        descriptionKey: `${division.id}Division`,
      })),
      {
        // Shared subscriptions sit next to `evig ai`, not under Mitmachen. The
        // old placement called them "a resource-sharing engagement model" — a
        // rationale that predates the AI thesis. A pooled seat in a paid
        // assistant is the most concrete thing on this site that makes
        // intelligence affordable, so it belongs where that claim is made.
        name: 'Abos teilen',
        nameKey: 'aboPools',
        href: ROUTES.public.abos,
        descriptionKey: 'aboPoolsDesc',
        badge: 'new',
      },
      {
        // The accountability hub: finances, key figures and the calculation
        // methods (incl. the CO₂ methodology). Distinct from "Unsere Wirkung"
        // (impact outcomes) — this is the "show me the math" trust page, which
        // was previously unreachable from the nav.
        name: 'Transparenz',
        nameKey: 'transparency',
        href: '/transparenz',
        descriptionKey: 'transparencyDesc',
      },
      {
        name: 'So funktioniert’s',
        nameKey: 'howItWorks',
        href: '/so-funktionierts',
        descriptionKey: 'howItWorksDesc',
      },
      {
        name: 'Reparaturbonus Zürich',
        nameKey: 'reparaturbonus',
        href: '/reparaturbonus',
        descriptionKey: 'reparaturbonusDesc',
        badge: 'new',
      },
      {
        name: 'FAQ',
        nameKey: 'faq',
        href: '/faq',
        descriptionKey: 'faqDesc',
      },
    ],
  },
  {
    name: 'Dienstleistungen',
    nameKey: 'services',
    href: '/services',
    descriptionKey: 'servicesDesc',
    isMultiColumn: true,
    // Derived from SERVICE_CONFIGS (services SSOT) — see buildServicesNavigationItems.
    subItems: buildServicesNavigationItems(),
  },
  {
    name: 'Marktplatz',
    nameKey: 'marketplace',
    href: '/marketplace',
    descriptionKey: 'marketplaceDesc',
    isMultiColumn: true,
    subItems: buildMarktplatzNavigationItems(),
  },
  {
    name: 'Lernen',
    nameKey: 'learn',
    href: '/knowhow',
    descriptionKey: 'learnDesc',
    subItems: [
      {
        name: 'Workshops',
        nameKey: 'workshops',
        href: '/workshops',
        descriptionKey: 'workshopsDesc',
      },
      {
        // "Guides" pointed at /knowhow#guides. There is no #guides element on
        // /knowhow — its only id is `ressourcen` — and the card ON that page
        // pointed at /#guides, a homepage anchor that does not exist either.
        // Two dead links that did not even agree with each other, for content
        // that has never been written.
        //
        // These two entries are what evig actually owns to teach with: a
        // 43-entry open-source alternatives registry, and a Linux page with a
        // distro-recommendation matrix. Both were filed under Dienstleistungen,
        // three levels from anyone looking to learn something.
        name: 'Open-Source-Alternativen',
        nameKey: 'openSourceSolutions',
        href: '/services/open-source-solutions',
        descriptionKey: 'openSourceSolutionsDesc',
      },
      {
        name: 'Linux einrichten',
        nameKey: 'linuxOpenSource',
        href: '/services/linux-open-source',
        descriptionKey: 'linuxOpenSourceDesc',
      },
      {
        name: 'Ressourcen',
        nameKey: 'resources',
        href: '/knowhow#ressourcen',
        descriptionKey: 'resourcesDesc',
      },
      {
        name: 'Blog',
        nameKey: 'blog',
        href: '/blog',
        descriptionKey: 'blogDesc',
      },
      // A "Wiki" entry stood here with href = EXTERNAL_LINKS.wiki, which is an
      // empty string — the same defect as the Marktplatz "evig Shop" entry:
      // it rendered as <a href="" target="_blank"> and opened a blank copy of
      // the current page. evig has no wiki.
    ],
  },
  {
    name: 'Mitmachen',
    nameKey: 'getInvolved',
    href: '/get-involved',
    descriptionKey: 'getInvolvedDesc',
    isMultiColumn: true,
    dropdownAlignment: 'right',
    subItems: [
      // Section: Engagement
      {
        name: 'Engagement',
        nameKey: 'engagement',
        href: '/get-involved',
        isSection: true,
      },
      {
        name: 'Freiwilligenarbeit',
        nameKey: 'volunteer',
        href: '/get-involved/volunteer',
        descriptionKey: 'volunteerDesc',
      },
      {
        name: 'Praktikum',
        nameKey: 'internship',
        href: '/get-involved/internships',
        descriptionKey: 'internshipDesc',
      },
      {
        name: 'Wiedereinstieg',
        nameKey: 'reintegration',
        href: '/get-involved/work-reintegration',
        descriptionKey: 'reintegrationDesc',
      },
      // Section: Unterstützen
      {
        name: 'Unterstützen',
        nameKey: 'support',
        href: '/get-involved',
        isSection: true,
      },
      {
        name: 'Spenden',
        nameKey: 'donate',
        href: '/get-involved/donate',
        descriptionKey: 'donateDesc',
      },
      {
        name: 'Geräte spenden',
        nameKey: 'donateDevices',
        href: '/get-involved/donate#geraete',
        descriptionKey: 'donateDevicesDesc',
      },
      {
        name: 'Partnerschaft',
        nameKey: 'partnership',
        href: '/get-involved/partnerships',
        descriptionKey: 'partnershipDesc',
      },
      {
        name: 'Mitgliedschaft',
        nameKey: 'membership',
        href: '/mitglied-werden',
        isSection: true,
      },
      {
        name: 'Mitglied werden',
        nameKey: 'becomeMember',
        href: '/mitglied-werden',
        descriptionKey: 'becomeMemberDesc',
        badge: 'new',
      },
    ],
  },
  {
    name: 'Kontakt',
    nameKey: 'contact',
    href: '/contact',
    descriptionKey: 'contactDesc',
    highlight: true,
  },
]

/**
 * Social media link type
 */
export interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

/**
 * Social media links. Empty until evig has its OWN profiles — the old handles
 * were Revamp-IT's, and evig must not claim them or drive its traffic there.
 * Add evig's channels here when they exist; the footer + JSON-LD render from this.
 */
export const socialLinks: SocialLink[] = []
