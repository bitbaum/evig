/**
 * Organization Configuration — SINGLE SOURCE OF TRUTH
 *
 * ALL organization-level data lives here. Every other file MUST import from
 * this module instead of hardcoding addresses, phone numbers, emails, etc.
 *
 * If you need to change an address, phone number, opening hours, or any
 * other org-level constant, change it HERE and nowhere else.
 */

// ============================================================================
// IDENTITY
// ============================================================================

/** Canonical logo asset paths — import from here, never hardcode */
export const ORG_IMAGES = {
  /** Full horizontal logo (200×48px) */
  logo: '/images/logo/revampit-logo.png',
  /** Square favicon/icon (40×40px) */
  favicon: '/images/logo/revampit-favicon.png',
} as const

export const ORG = {
  /** Official organization name — use this everywhere */
  name: 'Revamp-IT',
  /** Legal entity name */
  legalName: 'Verein Revamp-IT',
  /** Founding year */
  foundingYear: 2003,
  /** Legal form */
  legalForm: 'Schweizer Non-Profit-Verein',
  /** Motto */
  motto: 'Technik ein zweites Leben geben',
  /** Short description */
  description: 'Wir machen Technologie nachhaltig und für alle zugänglich.',
  /** Current production app URL. revamp-it.ch still serves the legacy Joomla site. */
  website: 'https://revampit.orangecat.ch',
  /** Legacy public site (Joomla) — target of the "zur aktuellen Site" banner link. */
  websiteLegacy: 'https://revamp-it.ch',
  /** Email domain */
  emailDomain: 'revamp-it.ch',
  /**
   * IANA timezone for the organization. Used in cron schedules,
   * tax-report date boundaries, and any "local time" formatting that
   * isn't user-personal. All cron expressions and SQL `AT TIME ZONE`
   * conversions in the codebase MUST reference this constant — never
   * hardcode 'Europe/Zurich'.
   */
  timezone: 'Europe/Zurich',
} as const

/**
 * Default blog author (SSOT). Shown when a post carries no explicit author —
 * i.e. the personal author behind the platform's content. DB posts with a real
 * `created_by` user show that user's name; this is the fallback for file posts
 * and author-less DB rows.
 */
export const DEFAULT_BLOG_AUTHOR = 'Georgy Butaev'

// ============================================================================
// LOCATIONS
// ============================================================================

export const LOCATIONS = {
  store: {
    name: 'Verkaufsstelle',
    /** Full street name — never abbreviate in code, abbreviate only in tight UI */
    street: 'Birmensdorferstrasse 379',
    postalCode: '8055',
    city: 'Zürich',
    country: 'Schweiz',
    canton: 'Zürich',
    lat: 47.3815,
    lng: 8.5237,
    /** Pre-formatted single-line address */
    full: 'Birmensdorferstrasse 379, 8055 Zürich',
    /** Full address with country */
    fullWithCountry: 'Birmensdorferstrasse 379, 8055 Zürich, Schweiz',
    googleMapsUrl: 'https://www.google.com/maps/place/Birmensdorferstrasse+379,+8055+Zürich',
    osmUrl: 'https://www.openstreetmap.org/?mlat=47.3815&mlon=8.5237#map=17/47.3815/8.5237',
    googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2701.1234567890123!2d8.5237!3d47.3815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479aa0a7e8c7b8b9%3A0x1234567890abcdef!2sBirmensdorferstrasse%20379%2C%208055%20Z%C3%BCrich!5e0!3m2!1sen!2sch!4v1234567890123',
  },
  warehouse: {
    name: 'Lager',
    street: 'Badenerstrasse 816',
    postalCode: '8048',
    city: 'Zürich',
    country: 'Schweiz',
    full: 'Badenerstrasse 816, 8048 Zürich',
    note: '(nur nach Terminvereinbarung)',
    googleMapsUrl: 'https://www.google.com/maps/place/Badenerstrasse+816,+8048+Zürich',
    osmUrl: 'https://www.openstreetmap.org/?mlat=47.3890&mlon=8.4880#map=17/47.3890/8.4880',
  },
} as const

/**
 * Display-shaped view of every LOCATIONS entry — name + the
 * address lines a card / footer / contact block wants to render,
 * plus an optional note. Centralises the "street, then postal+city,
 * then country (or omit it if same as Switzerland)" decision so
 * consumers don't re-build it inline.
 */
export interface LocationDisplay {
  key: string
  name: string
  addressLines: string[]
  note?: string
}

export function getLocationsDisplay(): LocationDisplay[] {
  return Object.entries(LOCATIONS).map(([key, loc]) => {
    const note = 'note' in loc ? loc.note : undefined
    return {
      key,
      name: loc.name,
      addressLines: [
        loc.street,
        `${loc.postalCode} ${loc.city}`,
        // Only show country for the primary store (we're a Swiss org, all
        // locations are CH — the country line is for press / SEO use of
        // .fullWithCountry rather than visible chrome).
        ...(key === 'store' ? [loc.country] : []),
      ],
      ...(note ? { note } : {}),
    }
  })
}

/**
 * Chronological history of physical locations. Single source of truth for
 * the /space page timeline and any other "where we have been" display.
 *
 * `period.to === null` marks the current location.
 * `name` is a place / building name — not a translation key; these are
 * Swiss proper names.
 */
export interface LocationHistoryEntry {
  period: { from: number; to: number | null }
  name: string
}

export const LOCATION_HISTORY: LocationHistoryEntry[] = [
  { period: { from: 2003, to: 2008 }, name: 'Toni Molkerei' },
  { period: { from: 2008, to: 2012 }, name: 'Reformierte Kirche Wipkingen' },
  { period: { from: 2012, to: 2015 }, name: 'Röschibachstrasse' },
  { period: { from: 2015, to: null }, name: LOCATIONS.store.street },
]

/** "2003 — 2008" or "2015 —" for current. */
export function formatLocationPeriod(period: LocationHistoryEntry['period']): string {
  return period.to === null ? `${period.from} —` : `${period.from} — ${period.to}`
}

// ============================================================================
// CONTACT
// ============================================================================

const DEFAULT_CONTACT_EMAIL = 'empfang@revamp-it.ch' as const

export const CONTACT = {
  email: DEFAULT_CONTACT_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL || DEFAULT_CONTACT_EMAIL,
  phone: '+41 (0)43 960 32 64',
  /** Phone in tel: URI format */
  phoneTel: 'tel:+41439603264',
  /** Canonical placeholders for user phone input fields */
  phonePlaceholder: '+41 79 123 45 67',
  phonePlaceholderLandline: '+41 44 123 45 67',
} as const

// ============================================================================
// OPENING HOURS
// ============================================================================

export const OPENING_HOURS = {
  monday: '9:00 - 12:00',
  tuesdayToFriday: '13:00 - 17:00',
  /** Pre-formatted multi-line string for display */
  formatted: 'Montag: 9:00 - 12:00\nDienstag - Freitag: 13:00 - 17:00',
  /** Compact single-line format for tight UI */
  compact: 'Mo 9–12 Uhr · Di–Fr 13–17 Uhr',
  /** Schema.org format */
  schemaOrg: 'Mo 09:00-12:00, Tu-Fr 13:00-17:00',
} as const

// ============================================================================
// BANK & PAYMENT (SSOT for all payment references)
// ============================================================================

export const BANK = {
  name: 'PostFinance AG',
  iban: 'CH16 0900 0000 8725 0971 7',
  bic: 'POFICHBEXXX',
  accountHolder: 'Verein Revamp-IT',
} as const

export const MEMBERSHIP = {
  fees: {
    regular: 50,
    reduced: 20,
  },
  currency: 'CHF',
  /** Payment reference prefix for bank transfers */
  referencePrefix: 'MITGLIED',
} as const

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export const EXTERNAL_LINKS = {
  /** Shopware shop — the current externally-hosted storefront */
  shopware: 'https://shop.revamp-it.ch/',
  /** Legacy WordPress shop — used in chatbot and external links */
  shopLegacy: 'https://www.revamp-it.ch/index.php/de/shop-de',
  wiki: 'https://revamp-it.ch/index.php/de/wiki-de',
  /** Open implementation of the platform and its operational workflow. */
  sourceCode: 'https://github.com/maonakamoto/revampit',
} as const
