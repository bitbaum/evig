/**
 * Profile Options Configuration - Single Source of Truth
 *
 * Centralizes all profile customization options for each role.
 * Used by ProfileStep component during registration.
 */

// ============================================================================
// CUSTOMER PROFILE OPTIONS
// ============================================================================

/**
 * Interest categories for customers
 */
export const CUSTOMER_INTERESTS = [
  'Laptop-Reparaturen',
  'Smartphone-Reparaturen',
  'PC-Zusammenbau',
  'Linux & Open Source',
  'Workshops',
  'Refurbished Geräte'
] as const

export type CustomerInterest = typeof CUSTOMER_INTERESTS[number]

// ============================================================================
// REPAIRER PROFILE OPTIONS
// ============================================================================

/**
 * Services offered by repairers
 */
export const REPAIRER_SERVICES = [
  'Laptop-Reparatur',
  'Smartphone-Reparatur',
  'PC-Reparatur',
  'Tablet-Reparatur',
  'Datenrettung',
  'Software-Installation'
] as const

export type RepairerService = typeof REPAIRER_SERVICES[number]

// ============================================================================
// SELLER PROFILE OPTIONS
// ============================================================================

/**
 * Product categories for sellers
 */
export const SELLER_CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Desktop-PCs',
  'Monitore',
  'Zubehör'
] as const

export type SellerCategory = typeof SELLER_CATEGORIES[number]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get customer interest options as mutable array
 */
export function getCustomerInterests(): string[] {
  return [...CUSTOMER_INTERESTS]
}

/**
 * Get repairer service options as mutable array
 */
export function getRepairerServices(): string[] {
  return [...REPAIRER_SERVICES]
}

/**
 * Get seller category options as mutable array
 */
export function getSellerCategories(): string[] {
  return [...SELLER_CATEGORIES]
}
