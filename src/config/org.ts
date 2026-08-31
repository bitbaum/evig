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
  /** Horizontal evig lockup (mark + wordmark) for external contexts — JSON-LD, OG. */
  logo: '/images/logo/evig-logo.png',
  /** Square evig app-icon (near-black tile + green mark) for compact UI + structured data. */
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
  /**
   * Current production app URL. `evig.orangecat.ch` is live (DNS + Caddy vhost →
   * the app on the Hetzner box, HTTPS). `revampit.orangecat.ch` remains a working
   * alias until the deploy paths / systemd identifiers are cut over (Layer B).
   */
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
 * Origin org (SSOT) — the Zürich circular-IT non-profit evig grew out of.
 * evig is a 2026 spin-off; Revamp-IT's history is Revamp-IT's, honoured as
 * theirs and never claimed as evig's own (see docs/EVIG_STORY.md). Named +
 * linked wherever we tell the founding story, so the roots are visible and
 * verifiable.
 */
export const ORG_ORIGIN = {
  name: 'Revamp-IT',
  /** Registered Zürich non-profit ("im Handelsregister eingetragener gemeinnütziger Verein"). */
  legalForm: 'gemeinnütziger Verein',
  city: 'Zürich',
  /** Revamp-IT's own founding year — theirs, not evig's. */
  since: 2003,
  url: 'https://www.revamp-it.ch',
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
// BASE REGION
// ============================================================================

/**
 * evig is an online-first org "in Gründung" with NO public store or warehouse.
 * It IS Zürich-based, so renderers that need a region line (SEO areaServed,
 * legal jurisdiction, letterhead) use city/country only — never a street
 * address. This is the ONLY location fact evig asserts.
 */
export const BASE_REGION = {
  city: 'Zürich',
  country: 'Schweiz',
  /** Region as an ISO country subdivision hint for structured data. */
  region: 'ZH',
  /** Pre-formatted "City, Country" line for display / structured data. */
  full: 'Zürich, Schweiz',
} as const

// ============================================================================
// CONTACT
// ============================================================================

/**
 * The address users are told to write to. It must be a mailbox that ACTUALLY
 * RECEIVES MAIL — this string is printed on public pages and is the fallback
 * the checkout wall points at ("Bitte kontaktiere evig, wenn du sofort bezahlen
 * möchtest") while Payrexx is unset.
 *
 * It was `hallo@evig.ch`. `evig.ch` is not purchased yet — it publishes no MX
 * and no A record — so every message a would-be buyer sent to it bounced, on a
 * catalogue of 200+ live listings with online payment deliberately switched off
 * and no phone number configured. The one route to a human was a dead end.
 *
 * Gmail is not the long-term brand address; it is the one that works today.
 * When evig.ch is registered and its mail is authenticated (Brevo SPF+DKIM),
 * change this ONE line back — everything user-facing reads it from here.
 */
const DEFAULT_CONTACT_EMAIL = 'butaeff@gmail.com' as const

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
  sourceCode: 'https://github.com/bitbaum/evig',
} as const
