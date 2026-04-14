/**
 * Donations configuration
 *
 * Single Source of Truth for donation types, device categories, conditions,
 * payment methods, statuses, and value estimates.
 *
 * Following dev guide: docs/development/DEV_GUIDE.md
 * Labels in Swiss German
 */

// =============================================================================
// DONATION TYPES
// =============================================================================

export const DONATION_TYPES = {
  MONETARY: 'monetary',
  DEVICE: 'device',
} as const

export type DonationType = typeof DONATION_TYPES[keyof typeof DONATION_TYPES]

export const DONATION_TYPE_LABELS: Record<DonationType, string> = {
  [DONATION_TYPES.MONETARY]: 'Geldspende',
  [DONATION_TYPES.DEVICE]: 'Sachspende',
}

// =============================================================================
// DEVICE CATEGORIES
// =============================================================================

export const DEVICE_CATEGORIES = {
  LAPTOP: 'laptop',
  DESKTOP: 'desktop',
  MONITOR: 'monitor',
  SMARTPHONE: 'smartphone',
  TABLET: 'tablet',
  PRINTER: 'printer',
  NETWORK: 'network',
  ACCESSORIES: 'accessories',
  OTHER: 'other',
} as const

export type DeviceCategory = typeof DEVICE_CATEGORIES[keyof typeof DEVICE_CATEGORIES]

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  [DEVICE_CATEGORIES.LAPTOP]: 'Laptop',
  [DEVICE_CATEGORIES.DESKTOP]: 'Desktop-PC',
  [DEVICE_CATEGORIES.MONITOR]: 'Monitor',
  [DEVICE_CATEGORIES.SMARTPHONE]: 'Smartphone',
  [DEVICE_CATEGORIES.TABLET]: 'Tablet',
  [DEVICE_CATEGORIES.PRINTER]: 'Drucker',
  [DEVICE_CATEGORIES.NETWORK]: 'Netzwerkgerät',
  [DEVICE_CATEGORIES.ACCESSORIES]: 'Zubehör',
  [DEVICE_CATEGORIES.OTHER]: 'Sonstiges',
}

// =============================================================================
// DEVICE CONDITIONS
// =============================================================================

export const DEVICE_CONDITIONS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  PARTS_ONLY: 'parts_only',
} as const

export type DeviceCondition = typeof DEVICE_CONDITIONS[keyof typeof DEVICE_CONDITIONS]

export const DEVICE_CONDITION_LABELS: Record<DeviceCondition, string> = {
  [DEVICE_CONDITIONS.EXCELLENT]: 'Ausgezeichnet',
  [DEVICE_CONDITIONS.GOOD]: 'Gut',
  [DEVICE_CONDITIONS.FAIR]: 'Akzeptabel',
  [DEVICE_CONDITIONS.POOR]: 'Schlecht',
  [DEVICE_CONDITIONS.PARTS_ONLY]: 'Nur für Ersatzteile',
}

// =============================================================================
// PAYMENT METHODS (for monetary donations)
// =============================================================================

export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  TWINT: 'twint',
  PAYPAL: 'paypal',
  CASH: 'cash',
  OTHER: 'other',
} as const

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Banküberweisung',
  [PAYMENT_METHODS.TWINT]: 'TWINT',
  [PAYMENT_METHODS.PAYPAL]: 'PayPal',
  [PAYMENT_METHODS.CASH]: 'Bargeld',
  [PAYMENT_METHODS.OTHER]: 'Andere',
}

// =============================================================================
// DONATION STATUSES
// =============================================================================

export const DONATION_STATUSES = {
  RECORDED: 'recorded',
  THANKED: 'thanked',
  RECEIPT_SENT: 'receipt_sent',
  ARCHIVED: 'archived',
  // Future phase 2: announced, pending_dropoff, received, processed
} as const

export type DonationStatus = typeof DONATION_STATUSES[keyof typeof DONATION_STATUSES]

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  [DONATION_STATUSES.RECORDED]: 'Erfasst',
  [DONATION_STATUSES.THANKED]: 'Bedankt',
  [DONATION_STATUSES.RECEIPT_SENT]: 'Quittung gesendet',
  [DONATION_STATUSES.ARCHIVED]: 'Archiviert',
}

// =============================================================================
// DEVICE VALUE ESTIMATES (in CHF cents)
// =============================================================================

/**
 * Default estimated values by device category
 * Staff can override these when recording donations
 */
export const DEVICE_VALUE_ESTIMATES: Record<DeviceCategory, number> = {
  [DEVICE_CATEGORIES.LAPTOP]: 15000,      // CHF 150
  [DEVICE_CATEGORIES.DESKTOP]: 10000,     // CHF 100
  [DEVICE_CATEGORIES.MONITOR]: 4000,      // CHF 40
  [DEVICE_CATEGORIES.SMARTPHONE]: 8000,   // CHF 80
  [DEVICE_CATEGORIES.TABLET]: 6000,       // CHF 60
  [DEVICE_CATEGORIES.PRINTER]: 3000,      // CHF 30
  [DEVICE_CATEGORIES.NETWORK]: 2500,      // CHF 25
  [DEVICE_CATEGORIES.ACCESSORIES]: 2000,  // CHF 20
  [DEVICE_CATEGORIES.OTHER]: 5000,        // CHF 50
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get donation type label
 */
export function getDonationTypeLabel(type: string): string {
  return DONATION_TYPE_LABELS[type as DonationType] || type
}

/**
 * Get device category label
 */
export function getDeviceCategoryLabel(category: string): string {
  return DEVICE_CATEGORY_LABELS[category as DeviceCategory] || category
}

/**
 * Get device condition label
 */
export function getDeviceConditionLabel(condition: string): string {
  return DEVICE_CONDITION_LABELS[condition as DeviceCondition] || condition
}

/**
 * Get payment method label
 */
export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] || method
}

/**
 * Get donation status label
 */
export function getDonationStatusLabel(status: string): string {
  return DONATION_STATUS_LABELS[status as DonationStatus] || status
}

/**
 * Get estimated value for a device category
 * @returns Value in cents
 */
export function getEstimatedValue(category: string): number {
  return DEVICE_VALUE_ESTIMATES[category as DeviceCategory] || DEVICE_VALUE_ESTIMATES[DEVICE_CATEGORIES.OTHER]
}

/**
 * Format amount from cents to CHF display string
 */
export function formatAmountCHF(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '-'
  return `CHF ${(cents / 100).toFixed(2)}`
}

/**
 * Get all donation types as options for select
 */
export function getDonationTypeOptions(): Array<{ value: DonationType; label: string }> {
  return Object.values(DONATION_TYPES).map(value => ({
    value,
    label: DONATION_TYPE_LABELS[value],
  }))
}

/**
 * Get all device categories as options for select
 */
export function getDeviceCategoryOptions(): Array<{ value: DeviceCategory; label: string }> {
  return Object.values(DEVICE_CATEGORIES).map(value => ({
    value,
    label: DEVICE_CATEGORY_LABELS[value],
  }))
}

/**
 * Get all device conditions as options for select
 */
export function getDeviceConditionOptions(): Array<{ value: DeviceCondition; label: string }> {
  return Object.values(DEVICE_CONDITIONS).map(value => ({
    value,
    label: DEVICE_CONDITION_LABELS[value],
  }))
}

/**
 * Get all payment methods as options for select
 */
export function getPaymentMethodOptions(): Array<{ value: PaymentMethod; label: string }> {
  return Object.values(PAYMENT_METHODS).map(value => ({
    value,
    label: PAYMENT_METHOD_LABELS[value],
  }))
}

/**
 * Get all donation statuses as options for select
 */
export function getDonationStatusOptions(): Array<{ value: DonationStatus; label: string }> {
  return Object.values(DONATION_STATUSES).map(value => ({
    value,
    label: DONATION_STATUS_LABELS[value],
  }))
}
