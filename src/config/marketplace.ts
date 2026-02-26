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
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries([
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
  return CATEGORY_LABELS[value] || value
}

// ============================================================================
// Listing Statuses
// ============================================================================

export const LISTING_STATUSES = ['active', 'sold', 'reserved', 'draft', 'removed'] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];

export const LISTING_STATUS_CONFIG: Record<ListingStatus, { label: string; color: string }> = {
  active:   { label: 'Aktiv',      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  sold:     { label: 'Verkauft',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  reserved: { label: 'Reserviert', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  draft:    { label: 'Entwurf',    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  removed:  { label: 'Entfernt',   color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
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

// ============================================================================
// Payment Modes
// ============================================================================

export const PAYMENT_MODES = ['secure', 'direct', 'both'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  secure: 'Sichere Zahlung (Payrexx)',
  direct: 'Direkt (Kontakt)',
  both:   'Beide Optionen',
};

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
  MIN_IMAGES: 1,
  MAX_TITLE_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_PRICE_CHF: 50000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  /** @deprecated Use COMMISSION_RATE export instead. Kept for backward compat. */
  COMMISSION_RATE: 0,
} as const;

/**
 * Commission rate for marketplace transactions.
 * 0 = zero commission (RevampIT non-profit advantage over Ricardo's 8-12%).
 * Configurable for future monetization if needed.
 */
export const COMMISSION_RATE = 0;

// ============================================================================
// Order Statuses
// ============================================================================

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending_payment: { label: 'Zahlung ausstehend', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  paid:            { label: 'Bezahlt',            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  shipped:         { label: 'Versendet',          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  delivered:       { label: 'Geliefert',          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  completed:       { label: 'Abgeschlossen',      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  cancelled:       { label: 'Storniert',          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  refunded:        { label: 'Erstattet',          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

// ============================================================================
// Gratis Config
// ============================================================================

export const GRATIS_CONFIG = {
  label: 'Gratis',
  color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  borderColor: 'border-teal-200 dark:border-teal-800',
} as const;

// ============================================================================
// Verification Config — RevampIT-tested items
// ============================================================================

export const VERIFICATION_CONFIG = {
  badge: {
    label: 'Geprüft von RevampIT',
    shortLabel: 'Geprüft',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
  },
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

/**
 * @deprecated Use MARKETPLACE_CATEGORY_VALUES instead.
 * Backward-compatible alias — returns the same numeric ID array.
 */
export const MARKETPLACE_CATEGORIES = MARKETPLACE_CATEGORY_VALUES

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

// ============================================================================
// Spec normalization helpers
// ============================================================================

/**
 * Extract numeric value and normalize to a standard unit for filtering.
 * Examples: "16 GB" → 16, "1 TB" → 1000, "14 Zoll" → 14, "512GB SSD" → 512
 */
export function normalizeSpecValue(key: string, value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[,]/g, '.').trim()

  // TB → GB conversion
  const tbMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*TB/i)
  if (tbMatch) return parseFloat(tbMatch[1]) * 1000

  // General numeric extraction (works for "16 GB", "14 Zoll", "256GB SSD", etc.)
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (numMatch) return parseFloat(numMatch[1])

  return null
}

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
