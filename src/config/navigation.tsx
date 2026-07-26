import React from 'react'
import { ORG, EXTERNAL_LINKS } from '@/config/org'
import { buildMarktplatzNavigationItems } from '@/config/customer-journeys'
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
 * 1. Über uns       - About, mission, history (identity)
 * 2. Dienstleistungen - Professional services (B2C)
 * 3. Marktplatz     - ALL customer-facing buy/sell/help: Shop + Marketplace + IT-Hilfe
 * 4. Lernen         - Workshops, guides, blog
 * 5. Mitmachen      - Volunteer, donate, partner
 * 6. Kontakt        - CTA (highlighted)
 *
 * Key decision: Shop + Marketplace (P2P) + IT-Hilfe live together under "Marktplatz" because
 * a customer looking for tech or help doesn't care about the organizational boundary between
 * RevampIT inventory vs community listings. Inside Marktplatz, demand-side
 * links come before supply-side links: buy from RevampIT/community first,
 * find repairers next, then create listings or become a technician.
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
        name: 'Guides',
        nameKey: 'guides',
        href: '/knowhow#guides',
        descriptionKey: 'guidesDesc',
      },
      {
        name: 'Blog',
        nameKey: 'blog',
        href: '/blog',
        descriptionKey: 'blogDesc',
      },
      {
        name: 'Wiki',
        nameKey: 'wiki',
        href: EXTERNAL_LINKS.wiki,
        descriptionKey: 'wikiDesc',
        external: true,
      },
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
      // Section: Mitgliedschaft + Teilen
      // Abo-Pools live here, not in Marktplatz — they are a resource-sharing
      // engagement model, not a buy/sell flow. Logically grouped with
      // "Mitmachen" (volunteer time, donate, share resources).
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
      {
        name: 'Abo-Pools',
        nameKey: 'aboPools',
        href: '/abos',
        descriptionKey: 'aboPoolsDesc',
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
