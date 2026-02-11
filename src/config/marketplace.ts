/**
 * Marketplace Configuration — SSOT
 *
 * All marketplace constants live here. Import in schemas, API routes, and pages.
 * Never hardcode categories, statuses, or limits elsewhere.
 */

// ============================================================================
// Categories
// ============================================================================

export const MARKETPLACE_CATEGORIES = [
  'Laptops',
  'Desktop PCs',
  'Monitore',
  'Smartphones',
  'Tablets',
  'Drucker & Scanner',
  'Netzwerk & Router',
  'Komponenten',
  'Zubehör',
  'Sonstiges',
] as const;

export type MarketplaceCategory = typeof MARKETPLACE_CATEGORIES[number];

export const CATEGORY_LABELS: Record<MarketplaceCategory, string> = {
  'Laptops': 'Laptops',
  'Desktop PCs': 'Desktop PCs',
  'Monitore': 'Monitore',
  'Smartphones': 'Smartphones',
  'Tablets': 'Tablets',
  'Drucker & Scanner': 'Drucker & Scanner',
  'Netzwerk & Router': 'Netzwerk & Router',
  'Komponenten': 'Komponenten',
  'Zubehör': 'Zubehör',
  'Sonstiges': 'Sonstiges',
};

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
  secure: 'Sicher (Stripe)',
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
// Limits
// ============================================================================

export const MARKETPLACE_LIMITS = {
  MAX_IMAGES: 8,
  MIN_IMAGES: 1,
  MAX_TITLE_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 5000,
  COMMISSION_RATE: 0.05, // 5%
  MAX_PRICE_CHF: 50000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

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
// Formatting helpers
// ============================================================================

const chfFormatter = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCHF(amount: number): string {
  return chfFormatter.format(amount);
}
