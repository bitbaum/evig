import React from 'react'
import { EXTERNAL_LINKS } from '@/config/org'

/**
 * Navigation Configuration - SSOT for all navigation data
 *
 * Design principles:
 * - 5-6 primary items max (cognitive load)
 * - Clear, action-oriented labels
 * - No "coming soon" items in nav (show when ready)
 * - Consolidated shop experience
 * - Progressive disclosure (simple → detailed)
 */

export interface NavigationItem {
  name: string
  href: string
  description?: string
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
 * Strategic positioning (6 items):
 * 1. Über uns - About, mission, history, projects
 * 2. Dienstleistungen - Professional services (B2C)
 * 3. Marktplatz - ALL customer-facing buy/sell/help: Shop + Marketplace + IT-Hilfe
 * 4. Lernen - Workshops, guides, blog
 * 5. Mitmachen - Volunteer, donate, partner
 * 6. Kontakt - CTA (highlighted)
 *
 * Key decision: Shop (team's legacy) + Marketplace (P2P) + IT-Hilfe (services marketplace)
 * live together under "Marktplatz" because a customer looking for tech or help doesn't care
 * about the organizational boundary between RevampIT inventory vs community listings.
 */
export const mainNavigation: NavigationItem[] = [
  {
    name: 'Über uns',
    href: '/about',
    description: 'Mission, Wirkung und Projekte',
    subItems: [
      {
        name: 'Mission & Geschichte',
        href: '/about',
        description: 'Wer wir sind und was uns antreibt',
      },
      {
        name: 'Unsere Wirkung',
        href: '/about/impact',
        description: 'Messbare Erfolge und Transparenz',
      },
      {
        name: 'Projekte',
        href: '/projects',
        description: 'Unsere Initiativen',
      },
      {
        name: 'Standorte',
        href: '/space',
        description: 'Unsere Räumlichkeiten in Zürich',
      },
      {
        name: 'FAQ',
        href: '/faq',
        description: 'Häufig gestellte Fragen',
      },
    ],
  },
  {
    name: 'Dienstleistungen',
    href: '/services',
    description: 'Professionelle IT-Services',
    isMultiColumn: true,
    subItems: [
      // Section: Hardware
      {
        name: 'Hardware',
        href: '/services',
        isSection: true,
      },
      {
        name: 'Reparatur & Upgrades',
        href: '/services/computer-repair-upgrades',
        description: 'Computer wieder fit machen',
      },
      {
        name: 'Datenrettung',
        href: '/services/data-recovery-transfer',
        description: 'Daten sichern und übertragen',
      },
      {
        name: 'Hardware-Recycling',
        href: '/services/hardware-recycling',
        description: 'Verantwortungsvolle Entsorgung',
      },
      // Section: Software
      {
        name: 'Software',
        href: '/services',
        isSection: true,
      },
      {
        name: 'Linux & Open Source',
        href: '/services/linux-open-source',
        description: 'Installation und Support',
      },
      {
        name: 'Webentwicklung',
        href: '/services/web-design-development',
        description: 'Websites mit Open Source',
      },
      {
        name: 'Open Source-Lösungen',
        href: '/services/open-source-solutions',
        description: 'Beratung und Implementierung',
      },
    ],
  },
  {
    name: 'Marktplatz',
    href: '/marketplace',
    description: 'Kaufen, verkaufen und IT-Hilfe',
    badge: 'Neu',
    isMultiColumn: true,
    subItems: [
      // Section: Geräte kaufen
      {
        name: 'Geräte kaufen',
        href: '/marketplace',
        isSection: true,
      },
      {
        name: 'Community-Inserate',
        href: '/marketplace',
        description: 'Gebrauchte IT von Privat — 0% Gebühren',
      },
      {
        name: 'RevampIT Shop',
        href: '/shop',
        description: 'Geprüfte, aufbereitete Geräte',
      },
      {
        name: 'Ladenlokal Zürich',
        href: '/shop#ladenlokal',
        description: 'Vor Ort stöbern und beraten lassen',
      },
      // Section: Verkaufen
      {
        name: 'Verkaufen',
        href: '/marketplace/sell',
        isSection: true,
      },
      {
        name: 'Inserat erstellen',
        href: '/marketplace/sell',
        description: 'Eigene Geräte verkaufen — kostenlos',
      },
      {
        name: 'Meine Inserate',
        href: '/dashboard/listings',
        description: 'Inserate und Verkäufe verwalten',
      },
      // Section: IT-Hilfe
      {
        name: 'IT-Hilfe',
        href: '/it-hilfe',
        isSection: true,
      },
      {
        name: 'Hilfe suchen',
        href: '/it-hilfe',
        description: 'Community-Techniker in deiner Nähe',
      },
      {
        name: 'Techniker werden',
        href: '/profil/skills',
        description: 'IT-Wissen teilen und helfen',
      },
    ],
  },
  {
    name: 'Lernen',
    href: '/knowhow',
    description: 'Workshops, Guides und Ressourcen',
    subItems: [
      {
        name: 'Workshops',
        href: '/workshops',
        description: 'Kurse vor Ort buchen',
      },
      {
        name: 'Guides',
        href: '/knowhow#guides',
        description: 'Schritt-für-Schritt Anleitungen',
      },
      {
        name: 'Blog',
        href: '/blog',
        description: 'Tipps und Geschichten',
      },
      {
        name: 'Wiki',
        href: EXTERNAL_LINKS.wiki,
        description: 'Gemeinsames Wissensportal',
        external: true,
      },
    ],
  },
  {
    name: 'Mitmachen',
    href: '/get-involved',
    description: 'Teil der Bewegung werden',
    isMultiColumn: true,
    dropdownAlignment: 'right',
    subItems: [
      // Section: Engagement
      {
        name: 'Engagement',
        href: '/get-involved',
        isSection: true,
      },
      {
        name: 'Freiwilligenarbeit',
        href: '/get-involved/volunteer',
        description: 'Zeit und Können einbringen',
      },
      {
        name: 'Praktikum',
        href: '/get-involved/internships',
        description: 'Erfahrung sammeln',
      },
      {
        name: 'Wiedereinstieg',
        href: '/get-involved/work-reintegration',
        description: 'Zurück ins Berufsleben',
      },
      {
        name: 'IT-Hilfe Techniker',
        href: '/profil/skills',
        description: 'IT-Wissen teilen und helfen',
        badge: 'Neu',
      },
      // Section: Unterstützen
      {
        name: 'Unterstützen',
        href: '/get-involved',
        isSection: true,
      },
      {
        name: 'Spenden',
        href: '/get-involved/donate',
        description: 'Unsere Mission fördern',
      },
      {
        name: 'Geräte spenden',
        href: '/get-involved/donate#geraete',
        description: 'Hardware ein zweites Leben geben',
      },
      {
        name: 'Partnerschaft',
        href: '/get-involved/partnerships',
        description: 'Als Unternehmen kooperieren',
      },
    ],
  },
  {
    name: 'Kontakt',
    href: '/contact',
    description: 'Wir freuen uns auf dich',
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
 * Social media icons - kept minimal and inline for bundle size
 */
const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const LinkedInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const MastodonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
  </svg>
)

/**
 * Social media links
 * Note: YouTube removed (low-value, clutters footer)
 */
export const socialLinks: SocialLink[] = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/revampit',
    icon: FacebookIcon,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/revampit_ch',
    icon: InstagramIcon,
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/company/revampit',
    icon: LinkedInIcon,
  },
  {
    name: 'Mastodon',
    href: 'https://mastodon.social/@revampit',
    icon: MastodonIcon,
  },
]
