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
  /** Official website (canonical domain) */
  website: 'https://revamp-it.ch',
  /** Email domain */
  emailDomain: 'revamp-it.ch',
} as const

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

// ============================================================================
// CONTACT
// ============================================================================

export const CONTACT = {
  email: 'empfang@revamp-it.ch',
  supportEmail: process.env.SUPPORT_EMAIL || 'empfang@revamp-it.ch',
  phone: '+41 (0)43 960 32 64',
  /** Phone in tel: URI format */
  phoneTel: 'tel:+41439603264',
} as const

// ============================================================================
// OPENING HOURS
// ============================================================================

export const OPENING_HOURS = {
  monday: '9:00 - 12:00',
  tuesdayToFriday: '13:00 - 17:00',
  /** Pre-formatted multi-line string for display */
  formatted: 'Montag: 9:00 - 12:00\nDienstag - Freitag: 13:00 - 17:00',
  /** Schema.org format */
  schemaOrg: 'Mo 09:00-12:00, Tu-Fr 13:00-17:00',
} as const

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export const EXTERNAL_LINKS = {
  shopOnline: 'https://revamp-it.ch/shop',
  shopware: 'https://revamp-it.ch/shop-sw',
  wiki: 'https://revamp-it.ch/index.php/de/wiki-de',
} as const
