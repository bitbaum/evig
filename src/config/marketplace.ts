/**
 * Marketplace Configuration — SSOT
 *
 * All marketplace constants live here. Import in schemas, API routes, and pages.
 * Never hardcode categories, statuses, or limits elsewhere.
 *
 * Categories are derived from KATEGORIEN (erfassung/categories.ts) — the single
 * source of truth for product categorization across the entire platform.
 */

import { KATEGORIEN } from '@/config/erfassung/categories'
import { UI_STATUS } from '@/config/ui/status'
import type { TransitionTable } from '@/lib/lifecycle'
import { PAGINATION } from '@/config/pagination'

// ============================================================================
// Categories — derived from KATEGORIEN SSOT
// ============================================================================

/**
 * Marketplace category values (numeric IDs matching KATEGORIEN).
 * Includes a catch-all '99' for "Sonstiges" (not in KATEGORIEN).
 */
export const MARKETPLACE_CATEGORY_VALUES = [
  ...KATEGORIEN.map(k => k.value),
  '99', // Sonstiges
] as const

export type MarketplaceCategoryValue = typeof MARKETPLACE_CATEGORY_VALUES[number]

/**
 * Category label lookup — derived from KATEGORIEN with Sonstiges fallback.
 */
export const MARKETPLACE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries([
  ...KATEGORIEN.map(k => [k.value, k.label]),
  ['99', 'Sonstiges'],
])

/**
 * Category icon lookup — derived from KATEGORIEN.
 */
export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  KATEGORIEN.filter(k => k.icon).map(k => [k.value, k.icon!])
)

/**
 * Get category label by value. Falls back to the value itself if not found.
 */
export function getCategoryLabel(value: string): string {
  return MARKETPLACE_CATEGORY_LABELS[value] || value
}

/** Lowercased KATEGORIEN label → value (built once from the SSOT). */
const CATEGORY_LABEL_TO_VALUE: Readonly<Record<string, string>> = Object.fromEntries(
  KATEGORIEN.map(k => [k.label.toLowerCase(), k.value])
)

/**
 * Aliases for free-text / AI-produced category labels that are not exact
 * KATEGORIEN labels (English terms or coarser German words the vision model
 * emits). Keys are lowercased. Values are KATEGORIEN values.
 */
const CATEGORY_LABEL_ALIASES: Readonly<Record<string, MarketplaceCategoryValue>> = {
  laptop: '10', laptops: '10', notebook: '10', notebooks: '10',
  desktop: '20', 'desktop pc': '20', 'desktop pcs': '20', pc: '20', computer: '20',
  monitor: '30', monitore: '30', display: '30', beamer: '30',
  tablet: '40', tablets: '40', ipad: '40',
  smartphone: '50', smartphones: '50', handy: '50', phone: '50', telefon: '50',
  drucker: '60', printer: '60', scanner: '60',
  komponenten: '70', components: '70', speicher: '70', storage: '70',
  ram: '70', cpu: '70', ssd: '70', festplatte: '70', mainboard: '70',
  peripherie: '80', peripherals: '80', 'zubehör': '80', zubehoer: '80',
  accessories: '80', tastatur: '80', maus: '80', keyboard: '80', mouse: '80',
  netzwerk: '90', network: '90', router: '90', switch: '90',
  electronics: '99', elektronik: '99', sonstiges: '99', other: '99',
}

/**
 * Resolve any category input — a KATEGORIEN value ('10'), a German label
 * ('Laptops'), or a free-text/AI label ('Electronics') — to a canonical
 * marketplace category value. Falls back to '99' (Sonstiges). Never throws.
 *
 * SSOT guard: keeps AI-produced and legacy category strings from leaking
 * non-KATEGORIEN values into listings.category.
 */
export function resolveCategoryValue(input: string | null | undefined): MarketplaceCategoryValue {
  if (!input) return '99'
  const raw = input.trim()
  if ((MARKETPLACE_CATEGORY_VALUES as readonly string[]).includes(raw)) {
    return raw as MarketplaceCategoryValue
  }
  const key = raw.toLowerCase()
  return (
    (CATEGORY_LABEL_TO_VALUE[key] as MarketplaceCategoryValue | undefined) ??
    CATEGORY_LABEL_ALIASES[key] ??
    '99'
  )
}

// ============================================================================
// Listing Statuses
// ============================================================================

export const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  RESERVED: 'reserved',
  DRAFT: 'draft',
  REMOVED: 'removed',
} as const;

export const LISTING_STATUSES = Object.values(LISTING_STATUS);
export type ListingStatus = typeof LISTING_STATUS[keyof typeof LISTING_STATUS];

/**
 * Seller type filter values — identifies whether a listing comes from
 * RevampIT's internal stock or the peer-to-peer community.
 */
export const MARKETPLACE_SELLER_TYPE = {
  REVAMPIT: 'revampit',
  COMMUNITY: 'community',
} as const;

export type MarketplaceSellerType = typeof MARKETPLACE_SELLER_TYPE[keyof typeof MARKETPLACE_SELLER_TYPE];

export const LISTING_STATUS_CONFIG: Record<ListingStatus, { label: string; color: string }> = {
  active:   { label: 'Aktiv',      color: UI_STATUS.success },
  sold:     { label: 'Verkauft',   color: UI_STATUS.info },
  reserved: { label: 'Reserviert', color: UI_STATUS.warning },
  draft:    { label: 'Entwurf',    color: UI_STATUS.neutral },
  removed:  { label: 'Entfernt',   color: UI_STATUS.danger },
};

// ============================================================================
// Delivery Options
// ============================================================================

export const DELIVERY_OPTIONS = ['pickup', 'shipping', 'both'] as const;
export type DeliveryOption = typeof DELIVERY_OPTIONS[number];

export const DELIVERY_LABELS: Record<DeliveryOption, string> = {
  pickup:   'Abholung',
  shipping: 'Versand',
  both:     'Abholung & Versand',
};

/**
 * Shape of the `shipping_address` JSONB on marketplace_orders. Captured at
 * checkout (name/street/postal_code/city/country); tracking_* are added later
 * by the fulfilment/webhook flow. SSOT for every surface that reads the address
 * (buyer order detail + admin fulfilment view).
 */
export interface ShippingAddress {
  name?: string;
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  tracking_number?: string;
  tracking_url?: string;
}

/**
 * Defaults for RevampIT-owned inventory when it is exposed as a public listing.
 *
 * Public sellers choose delivery per listing. Internal stock enters through
 * intake/erfassung, so the publish helper needs one SSOT instead of hard-coded
 * pickup-only values.
 */
export const REVAMPIT_LISTING_DELIVERY = {
  options: 'both',
  shippingCostChf: '12.00',
  pickupLocation: 'Revamp-IT Zürich',
} as const satisfies {
  options: DeliveryOption
  shippingCostChf: string | null
  pickupLocation: string
}

// ============================================================================
// Payment Modes
// ============================================================================

export const PAYMENT_MODES = ['secure', 'direct', 'both'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  secure: 'Sichere Zahlung (Payrexx)',
  direct: 'Direkt (TWINT, Bar, Überweisung)',
  both:   'Beide Optionen',
};

/** P2P listings that can use /marketplace/checkout/[id] (Payrexx escrow). */
export function supportsSecureCheckout(paymentMode: string): boolean {
  return paymentMode === 'secure' || paymentMode === 'both';
}

/** P2P listings where buyers coordinate payment off-platform via contact. */
export function supportsDirectContact(paymentMode: string): boolean {
  return paymentMode === 'direct' || paymentMode === 'both';
}

// ============================================================================
// Sort Options
// ============================================================================

export const SORT_OPTIONS = [
  { value: 'newest',       label: 'Neueste zuerst' },
  { value: 'price_asc',    label: 'Preis aufsteigend' },
  { value: 'price_desc',   label: 'Preis absteigend' },
  { value: 'popular',      label: 'Beliebteste' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

// ============================================================================
// Conditions (re-export values from conditions config for convenience)
// ============================================================================

export const LISTING_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor', 'defect'] as const;
export type ListingCondition = typeof LISTING_CONDITIONS[number];

// ============================================================================
// Limits & Commission
// ============================================================================

export const MARKETPLACE_LIMITS = {
  MAX_IMAGES: 8,
  MIN_IMAGES: 0,
  MAX_TITLE_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_QUESTION_LENGTH: 500,
  MAX_ANSWER_LENGTH: 2000,
  MAX_PRICE_CHF: 50000,
  DEFAULT_PAGE_SIZE: PAGINATION.PUBLIC,
  MAX_PAGE_SIZE: 100,
} as const;

// ============================================================================
// Listing Questions (public Q&A — Ricardo-style)
// ============================================================================

export const LISTING_QUESTION_STATUS = {
  OPEN: 'open',
  ANSWERED: 'answered',
  HIDDEN: 'hidden',
} as const;

export const LISTING_QUESTION_STATUSES = Object.values(LISTING_QUESTION_STATUS);
export type ListingQuestionStatus = typeof LISTING_QUESTION_STATUS[keyof typeof LISTING_QUESTION_STATUS];

/**
 * Commission rate for marketplace transactions.
 * 0 = zero commission (RevampIT non-profit advantage over Ricardo's 8-12%).
 * Configurable for future monetization if needed.
 */
export const COMMISSION_RATE = 0;

// ============================================================================
// Order Statuses
// ============================================================================

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const ORDER_STATUSES = Object.values(ORDER_STATUS);
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending_payment: { label: 'Zahlung ausstehend', color: UI_STATUS.warning },
  paid:            { label: 'Bezahlt',            color: UI_STATUS.info },
  shipped:         { label: 'Versendet',          color: UI_STATUS.purple },
  delivered:       { label: 'Geliefert',          color: UI_STATUS.teal },
  completed:       { label: 'Abgeschlossen',      color: UI_STATUS.success },
  cancelled:       { label: 'Storniert',          color: UI_STATUS.neutral },
  refunded:        { label: 'Erstattet',          color: UI_STATUS.danger },
};

// ============================================================================
// Order Transitions (SSOT) — who can move an order where
// ============================================================================
//
// This table is the SOLE protection against a buyer/seller bypassing the
// Payrexx payment flow. It is the manual PATCH path (the client sends the
// target status, so `action === to`). Validated via resolveTransition()
// from @/lib/lifecycle.
//
// NOTE: the buyer's final DELIVERED → COMPLETED (which captures escrow) also
// has a dedicated route (confirm-receipt) that additionally accepts SHIPPED →
// COMPLETED. That second path is intentionally NOT folded in here — keep the
// two allowed-from sets distinct (see confirm-receipt/route.ts).

export type OrderRole = 'buyer' | 'seller';

export const ORDER_TRANSITIONS: TransitionTable<OrderStatus, OrderStatus, OrderRole> = [
  { action: ORDER_STATUS.SHIPPED,   from: ORDER_STATUS.PAID,      role: 'seller',             to: ORDER_STATUS.SHIPPED },
  { action: ORDER_STATUS.DELIVERED, from: ORDER_STATUS.SHIPPED,   role: 'seller',             to: ORDER_STATUS.DELIVERED },
  { action: ORDER_STATUS.COMPLETED, from: ORDER_STATUS.DELIVERED, role: 'buyer',              to: ORDER_STATUS.COMPLETED },
  { action: ORDER_STATUS.CANCELLED, from: ORDER_STATUS.PAID,      role: 'buyer',              to: ORDER_STATUS.CANCELLED },
  // Either party may walk away before payment is captured.
  { action: ORDER_STATUS.CANCELLED, from: ORDER_STATUS.PENDING_PAYMENT, role: ['buyer', 'seller'], to: ORDER_STATUS.CANCELLED },
];

// ============================================================================
// Gratis Config
// ============================================================================

export const GRATIS_CONFIG = {
  label: 'Gratis',
  color: UI_STATUS.teal,
  borderColor: 'border-teal-200 dark:border-teal-800',
  // Prominent price text (not a badge) — kept here so the gratis visual
  // identity has a single source of truth.
  priceColor: 'text-teal-700 dark:text-teal-300',
} as const;

// ============================================================================
// Verification Config — RevampIT-tested items
// ============================================================================

export const VERIFICATION_CONFIG = {
  badge: {
    label: 'Geprüft von Revamp-IT',
    shortLabel: 'Geprüft',
    color: UI_STATUS.success,
    borderColor: 'border-primary-200 dark:border-primary-800',
  },
} as const;

/**
 * RevampIT's own refurbished-stock guarantee — shown ONLY on is_revampit
 * listings (P2P third-party sales carry no such guarantee, per AGB §6).
 * These are the org's STATED terms, sourced — not invented:
 *   • warrantyMonths (6): the 6-month warranty label physically applied to every
 *     refurbished device at intake — see config/intake-checklist.ts 'warranty_label'.
 *   • returnDays (14): the voluntary 14-day return right for online purchases —
 *     AGB §5 Widerrufsrecht (messages/de.json legal.terms).
 * If the real policy changes, change it here (single source of truth).
 */
export const REVAMPIT_GUARANTEE = {
  warrantyMonths: 6,
  returnDays: 14,
} as const;

// ============================================================================
// Spec Filter Config — filterable specs per category
// ============================================================================

export interface SpecFilterOption {
  label: string
  value: number
}

export interface SpecFilterDef {
  key: string
  label: string
  unit: string
  /** Meilisearch field name for this spec (denormalized) */
  meiliField: string
  options: SpecFilterOption[]
}

/**
 * Spec filters shown in the browse page when a category is selected.
 * Keys match KATEGORIEN category values.
 */
export const SPEC_FILTER_CONFIG: Record<string, SpecFilterDef[]> = {
  // Laptops
  '10': [
    {
      key: 'RAM',
      label: 'RAM',
      unit: 'GB',
      meiliField: 'spec_ram_gb',
      options: [
        { label: '4 GB+', value: 4 },
        { label: '8 GB+', value: 8 },
        { label: '16 GB+', value: 16 },
        { label: '32 GB+', value: 32 },
      ],
    },
    {
      key: 'Speicher',
      label: 'Speicher',
      unit: 'GB',
      meiliField: 'spec_storage_gb',
      options: [
        { label: '128 GB+', value: 128 },
        { label: '256 GB+', value: 256 },
        { label: '512 GB+', value: 512 },
        { label: '1 TB+', value: 1000 },
      ],
    },
    {
      key: 'Display',
      label: 'Display',
      unit: 'Zoll',
      meiliField: 'spec_display_inches',
      options: [
        { label: '13"+', value: 13 },
        { label: '14"+', value: 14 },
        { label: '15"+', value: 15 },
        { label: '17"+', value: 17 },
      ],
    },
  ],
  // Desktop PCs
  '20': [
    {
      key: 'RAM',
      label: 'RAM',
      unit: 'GB',
      meiliField: 'spec_ram_gb',
      options: [
        { label: '8 GB+', value: 8 },
        { label: '16 GB+', value: 16 },
        { label: '32 GB+', value: 32 },
        { label: '64 GB+', value: 64 },
      ],
    },
    {
      key: 'Speicher',
      label: 'Speicher',
      unit: 'GB',
      meiliField: 'spec_storage_gb',
      options: [
        { label: '256 GB+', value: 256 },
        { label: '512 GB+', value: 512 },
        { label: '1 TB+', value: 1000 },
        { label: '2 TB+', value: 2000 },
      ],
    },
  ],
  // Monitore
  '30': [
    {
      key: 'Grösse',
      label: 'Grösse',
      unit: 'Zoll',
      meiliField: 'spec_display_inches',
      options: [
        { label: '22"+', value: 22 },
        { label: '24"+', value: 24 },
        { label: '27"+', value: 27 },
        { label: '32"+', value: 32 },
      ],
    },
  ],
  // Smartphones
  '50': [
    {
      key: 'Speicher',
      label: 'Speicher',
      unit: 'GB',
      meiliField: 'spec_storage_gb',
      options: [
        { label: '32 GB+', value: 32 },
        { label: '64 GB+', value: 64 },
        { label: '128 GB+', value: 128 },
        { label: '256 GB+', value: 256 },
      ],
    },
    {
      key: 'RAM',
      label: 'RAM',
      unit: 'GB',
      meiliField: 'spec_ram_gb',
      options: [
        { label: '4 GB+', value: 4 },
        { label: '6 GB+', value: 6 },
        { label: '8 GB+', value: 8 },
        { label: '12 GB+', value: 12 },
      ],
    },
  ],
  // Tablets
  '40': [
    {
      key: 'Speicher',
      label: 'Speicher',
      unit: 'GB',
      meiliField: 'spec_storage_gb',
      options: [
        { label: '32 GB+', value: 32 },
        { label: '64 GB+', value: 64 },
        { label: '128 GB+', value: 128 },
        { label: '256 GB+', value: 256 },
      ],
    },
  ],
}

/**
 * Get spec filters for a category. Returns empty array if none defined.
 */
export function getSpecFiltersForCategory(categoryValue: string): SpecFilterDef[] {
  return SPEC_FILTER_CONFIG[categoryValue] || []
}

// ============================================================================
// Report Reasons
// ============================================================================

export const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Unangemessener Inhalt' },
  { value: 'scam', label: 'Betrug / Scam' },
  { value: 'wrong_category', label: 'Falsche Kategorie' },
  { value: 'counterfeit', label: 'Fälschung' },
  { value: 'other', label: 'Anderer Grund' },
] as const

export type ReportReason = typeof REPORT_REASONS[number]['value']

// ============================================================================
// Formatting helpers
// ============================================================================

const chfFormatter = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCHF(amount: number): string {
  if (amount === 0) return GRATIS_CONFIG.label
  return chfFormatter.format(amount);
}

/**
 * Format price for display — returns "Gratis" for 0, formatted CHF otherwise.
 * Use formatCHF() when you always want the numeric format.
 */
export function formatPrice(amount: number): string {
  return formatCHF(amount)
}

/**
 * Format a price stored in cents (Rappen) to a display string.
 * - null → "Auf Anfrage"
 * - 0    → "Kostenlos"
 * - else → "CHF X" (smart decimals: 0 if whole, 2 if fractional)
 */
export function formatPriceCents(priceCents: number | null): string {
  if (priceCents === null) return 'Auf Anfrage'
  if (priceCents === 0) return 'Kostenlos'
  const francs = priceCents / 100
  return `CHF ${francs.toFixed(francs % 1 === 0 ? 0 : 2)}`
}

// ============================================================================
// Spec normalization helpers
// ============================================================================

// Re-exported from canonical location (lib/marketplace/spec-utils.ts)
export { normalizeSpecValue } from '@/lib/marketplace/spec-utils'

/**
 * Map spec keys to Meilisearch denormalized field names.
 * Only specs listed here will be indexed as top-level filterable fields.
 */
export const SPEC_MEILI_FIELD_MAP: Record<string, string> = {
  'RAM': 'spec_ram_gb',
  'Speicher': 'spec_storage_gb',
  'Display': 'spec_display_inches',
  'Grösse': 'spec_display_inches',
}

/**
 * Maps Meilisearch spec field names → filter state key in useMarketplaceListings.
 * Used by MarketplaceFilterSidebar to avoid ternary chains.
 */
export const SPEC_FILTER_STATE_MAP: Readonly<Record<string, string>> = {
  'spec_ram_gb':          'specRamMin',
  'spec_storage_gb':      'specStorageMin',
  'spec_display_inches':  'specDisplayMin',
}

/**
 * Maps URL query param names → spec_key values stored in listing_specs.
 * Used by the API route to build SQL WHERE clauses without hardcoding key names.
 */
export const SPEC_QUERY_PARAM_KEYS: Readonly<Record<string, string[]>> = {
  'spec_ram_min':     ['RAM'],
  'spec_storage_min': ['Speicher'],
  'spec_display_min': ['Display', 'Grösse'],
}

/**
 * Priority order for spec tags displayed on listing cards (most important first).
 */
export const SPEC_DISPLAY_PRIORITY = ['RAM', 'Speicher', 'Display', 'Grösse', 'CPU', 'Prozessor'] as const
