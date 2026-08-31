import React from 'react';
import { ORG } from '@/config/org';
import { buildMarktplatzNavigationItems } from '@/config/customer-journeys';
import { ROUTES } from '@/config/routes';
import {
  buildLearnServiceNavigationItems,
  buildServicesNavigationItems,
} from '@/config/services-nav';

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
  name: string;
  nameKey?: string;
  href: string;
  description?: string;
  descriptionKey?: string;
  external?: boolean;
  subItems?: NavigationItem[];
  highlight?: boolean;
  isSection?: boolean;
  badge?: string;
  icon?: React.ReactNode;
  isMultiColumn?: boolean;
  dropdownAlignment?: 'left' | 'center' | 'right';
}

/**
 * Main navigation structure
 *
 * Strategic positioning (6 top-level items):
 * 1. Über uns       - Identity + trust ONLY, in two sections
 * 2. Dienstleistungen - Professional services (B2C)
 * 3. Marktplatz     - the three things you can GET: Geräte · IT-Hilfe · KI
 * 4. Lernen         - workshops, the OSS registry, Linux, resources, blog
 * 5. Mitmachen      - Volunteer, donate, partner, membership
 * 6. Kontakt        - CTA (highlighted)
 *
 * Each dropdown answers exactly ONE question, and every multi-item menu uses
 * `isSection` eyebrows. "Über uns" used to answer five at once — it carried a
 * brand division, a transactional product and a municipal subsidy programme
 * alongside the mission — which is what made it unreadable.
 *
 * Key decision: the storefront and IT-Hilfe live together under "Marktplatz"
 * because someone looking for a device or for help does not care about the
 * organisational boundary between evig's own stock and community listings.
 * Access to AI joins them for the same reason: from the reader's side these
 * are three ways to get something, not three parts of an org chart.
 */
export const mainNavigation: NavigationItem[] = [
  {
    name: 'Über uns',
    nameKey: 'about',
    href: '/about',
    descriptionKey: 'aboutDesc',
    subItems: [
      // This dropdown held NINE unsectioned items spanning five unrelated
      // groups: identity, a brand division (evig ai), a transactional product
      // (Abos teilen — join a pool, pay a share), trust pages, and two
      // operational explainers, one of them a City of Zürich subsidy evig does
      // not administer and cannot redeem. Two carried a `new` badge at once.
      // It was the only multi-item menu with no `isSection` eyebrows, so nine
      // heterogeneous rows arrived as one flat list.
      //
      // It answers one question now — who is this and can I trust them — in
      // two groups. `evig ai` and `Abos teilen` moved to Marktplatz, where the
      // things you can actually GET from evig live. `So funktioniert’s` and
      // `Reparaturbonus Zürich` left the nav entirely; both pages remain and
      // stay reachable in context, but neither is an answer to "who are you".
      {
        name: 'Wer wir sind',
        nameKey: 'whoWeAre',
        href: '/about',
        isSection: true,
      },
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
      {
        name: 'Vertrauen',
        nameKey: 'trust',
        href: '/transparenz',
        isSection: true,
      },
      {
        // The accountability hub: finances, key figures and the calculation
        // methods (incl. the CO₂ methodology).
        name: 'Transparenz',
        nameKey: 'transparency',
        href: '/transparenz',
        descriptionKey: 'transparencyDesc',
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
      // "Guides" pointed at /knowhow#guides. There is no #guides element on
      // /knowhow — its only id is `ressourcen` — and the card ON that page
      // pointed at /#guides, a homepage anchor that does not exist either.
      // Two dead links that did not even agree with each other, for content
      // that has never been written.
      //
      // What replaces them is DERIVED, not retyped: the service pages that
      // declare `navGroup: 'learn'` in SERVICE_CONFIGS. Listing them here by
      // hand — as the first version of this change did — put the same two
      // items in two menus fed by two independent lists.
      ...buildLearnServiceNavigationItems(),
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
];

/**
 * Social media link type
 */
export interface SocialLink {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Social media links. Empty until evig has its OWN profiles — the old handles
 * were Revamp-IT's, and evig must not claim them or drive its traffic there.
 * Add evig's channels here when they exist; the footer + JSON-LD render from this.
 */
export const socialLinks: SocialLink[] = [];
