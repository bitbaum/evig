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
  /** Full horizontal logo (200×48px). TODO: replace visual asset with evig branding. */
  logo: '/images/logo/evig-logo.png',
  /** Square favicon/icon (40×40px). TODO: replace visual asset with evig branding. */
  favicon: '/images/logo/evig-favicon.png',
} as const

export const ORG = {
  /** Official organization name — use this everywhere */
  name: 'evig',
  /** Legal entity name (evig is newly founded — incorporation pending) */
  legalName: 'evig',
  /** Founding year */
  foundingYear: 2026,
  /** Legal form — evig is in formation */
  legalForm: 'in Gründung',
  /** Motto */
  motto: 'Intelligenz, für alle bezahlbar.',
  /** Short description */
  description: 'Gute, langlebige Technik für alle bezahlbar — kuratiert statt Ramsch.',
  /** Current production app URL. */
  website: 'https://evig.orangecat.ch',
  /** evig has no legacy site (new organisation). Empty hides the "zur aktuellen Site" banner. */
  websiteLegacy: '',
  /** Email domain. TODO: register evig.ch + mailboxes. Staff-auth domain lives in permissions.ts. */
  emailDomain: 'evig.ch',
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
 * Default blog author (SSOT). The personal author behind the platform's
 * content. DB posts with a real `created_by` user show that user's name; this
 * is the author for everything else.
 */
export const DEFAULT_BLOG_AUTHOR = 'Georgy Butaev'

/**
 * Legacy generic "team" author placeholders. These are treated as "no real
 * author" and resolve to {@link DEFAULT_BLOG_AUTHOR} — the platform's content is
 * personally authored, not attributed to an anonymous team. A post with a real
 * person's name keeps it.
 */
const GENERIC_AUTHOR_ALIASES = new Set([
  'revampit team',
  'revamp-it team',
  'revampit ops',
  'revamp-it ops',
])

/** Resolve a raw author string to the name shown to readers (SSOT). */
export function resolveBlogAuthor(raw?: string | null): string {
  const v = (raw ?? '').trim()
  if (!v || GENERIC_AUTHOR_ALIASES.has(v.toLowerCase())) return DEFAULT_BLOG_AUTHOR
  return v
}

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

const DEFAULT_CONTACT_EMAIL = 'hallo@evig.ch' as const // TODO: register evig.ch mailbox

export const CONTACT = {
  email: DEFAULT_CONTACT_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL || DEFAULT_CONTACT_EMAIL,
  /** evig has no phone line yet. TODO. */
  phone: '',
  /** Phone in tel: URI format */
  phoneTel: '',
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

// evig has no bank account yet. Payments/donations run via BTC + the OrangeCat
// profile (see PAYMENT). These fields are intentionally blank so the app NEVER
// routes money to a third party — fill only with evig's OWN account.
export const BANK = {
  name: '',
  iban: '',
  bic: '',
  accountHolder: 'evig',
} as const

/**
 * evig payment identity (SSOT) — BTC-native + OrangeCat maker profile.
 * TODO: set evig's real BTC address and OrangeCat profile URL.
 */
export const PAYMENT = {
  /** evig BTC address for donations/payments. */
  btcAddress: '',
  /** evig's OrangeCat maker profile (how to help / participate). */
  orangeCatUrl: '',
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
  /** External storefront — evig uses the built-in marketplace. TODO if a separate shop is added. */
  shopware: '',
  /** Legacy shop — evig has none. */
  shopLegacy: '',
  wiki: '',
  /** Open implementation of the platform and its operational workflow. */
  sourceCode: 'https://github.com/maonakamoto/evig',
} as const
