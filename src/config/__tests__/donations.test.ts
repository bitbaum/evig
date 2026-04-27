/**
 * Tests for config/donations.ts — donation label and options helpers.
 *
 * Mission-relevant: donation tracking is part of Revamp-IT's non-profit
 * mission. Staff record device donations and issue tax receipts. If
 * getDonationStatusLabel('receipt_sent') returns the raw key, the admin
 * UI shows untranslated English to German-speaking staff. If
 * getEstimatedValue falls back to 'other' instead of 0 for an unknown
 * category, the default estimate is correct.
 *
 * Behaviors locked:
 *   getDonationTypeLabel / getDeviceCategoryLabel / getDeviceConditionLabel
 *   / getPaymentMethodLabel / getDonationStatusLabel
 *   - return German label for known keys
 *   - fall back to raw value for unknown keys
 *
 *   getEstimatedValue
 *   - returns CHF 150 (15000 cents) for laptop
 *   - returns other fallback for unknown category
 *
 *   formatAmountCHF
 *   - returns '-' for null/undefined
 *   - formats cents to "CHF X.XX"
 *
 *   getDonationTypeOptions / getDeviceCategoryOptions / getDeviceConditionOptions
 *   / getPaymentMethodOptions / getDonationStatusOptions
 *   - return arrays of { value, label } objects
 *   - count matches the respective constant object
 */

import {
  getDonationTypeLabel,
  getDeviceCategoryLabel,
  getDeviceConditionLabel,
  getPaymentMethodLabel,
  getDonationStatusLabel,
  getEstimatedValue,
  formatAmountCHF,
  getDonationTypeOptions,
  getDeviceCategoryOptions,
  getDeviceConditionOptions,
  getPaymentMethodOptions,
  getDonationStatusOptions,
  DONATION_TYPES,
  DEVICE_CATEGORIES,
  DEVICE_CONDITIONS,
  PAYMENT_METHODS,
  DONATION_STATUSES,
} from '../donations'

// ============================================================================
// Label helpers
// ============================================================================

describe('getDonationTypeLabel', () => {
  it('returns "Geldspende" for monetary', () => {
    expect(getDonationTypeLabel(DONATION_TYPES.MONETARY)).toBe('Geldspende')
  })

  it('returns "Sachspende" for device', () => {
    expect(getDonationTypeLabel(DONATION_TYPES.DEVICE)).toBe('Sachspende')
  })

  it('falls back to raw value for unknown type', () => {
    expect(getDonationTypeLabel('unknown_type')).toBe('unknown_type')
  })
})

describe('getDeviceCategoryLabel', () => {
  it('returns "Laptop" for laptop', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.LAPTOP)).toBe('Laptop')
  })

  it('returns "Desktop-PC" for desktop', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.DESKTOP)).toBe('Desktop-PC')
  })

  it('returns "Sonstiges" for other', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.OTHER)).toBe('Sonstiges')
  })

  it('falls back to raw value for unknown category', () => {
    expect(getDeviceCategoryLabel('mainframe')).toBe('mainframe')
  })
})

describe('getDeviceConditionLabel', () => {
  it('returns "Ausgezeichnet" for excellent', () => {
    expect(getDeviceConditionLabel(DEVICE_CONDITIONS.EXCELLENT)).toBe('Ausgezeichnet')
  })

  it('returns "Nur für Ersatzteile" for parts_only', () => {
    expect(getDeviceConditionLabel(DEVICE_CONDITIONS.PARTS_ONLY)).toBe('Nur für Ersatzteile')
  })

  it('falls back to raw value for unknown condition', () => {
    expect(getDeviceConditionLabel('broken')).toBe('broken')
  })
})

describe('getPaymentMethodLabel', () => {
  it('returns "Banküberweisung" for bank_transfer', () => {
    expect(getPaymentMethodLabel(PAYMENT_METHODS.BANK_TRANSFER)).toBe('Banküberweisung')
  })

  it('returns "TWINT" for twint', () => {
    expect(getPaymentMethodLabel(PAYMENT_METHODS.TWINT)).toBe('TWINT')
  })

  it('falls back to raw value for unknown method', () => {
    expect(getPaymentMethodLabel('crypto')).toBe('crypto')
  })
})

describe('getDonationStatusLabel', () => {
  it('returns "Erfasst" for recorded', () => {
    expect(getDonationStatusLabel(DONATION_STATUSES.RECORDED)).toBe('Erfasst')
  })

  it('returns "Quittung gesendet" for receipt_sent', () => {
    expect(getDonationStatusLabel(DONATION_STATUSES.RECEIPT_SENT)).toBe('Quittung gesendet')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getDonationStatusLabel('pending_pickup')).toBe('pending_pickup')
  })
})

// ============================================================================
// getEstimatedValue
// ============================================================================

describe('getEstimatedValue', () => {
  it('returns 15000 cents (CHF 150) for laptop', () => {
    expect(getEstimatedValue(DEVICE_CATEGORIES.LAPTOP)).toBe(15000)
  })

  it('returns 10000 cents (CHF 100) for desktop', () => {
    expect(getEstimatedValue(DEVICE_CATEGORIES.DESKTOP)).toBe(10000)
  })

  it('returns the "other" fallback (5000) for unknown category', () => {
    expect(getEstimatedValue('unknown_device')).toBe(5000)
  })
})

// ============================================================================
// formatAmountCHF
// ============================================================================

describe('formatAmountCHF', () => {
  it('returns "-" for null', () => {
    expect(formatAmountCHF(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatAmountCHF(undefined)).toBe('-')
  })

  it('formats 15000 cents as "CHF 150.00"', () => {
    expect(formatAmountCHF(15000)).toBe('CHF 150.00')
  })

  it('formats 100 cents as "CHF 1.00"', () => {
    expect(formatAmountCHF(100)).toBe('CHF 1.00')
  })

  it('formats 0 cents as "CHF 0.00"', () => {
    expect(formatAmountCHF(0)).toBe('CHF 0.00')
  })

  it('formats fractional cents correctly (99 cents → CHF 0.99)', () => {
    expect(formatAmountCHF(99)).toBe('CHF 0.99')
  })
})

// ============================================================================
// Options arrays
// ============================================================================

describe('getDonationTypeOptions', () => {
  it('returns array of { value, label } objects', () => {
    const options = getDonationTypeOptions()
    expect(Array.isArray(options)).toBe(true)
    for (const opt of options) {
      expect(typeof opt.value).toBe('string')
      expect(typeof opt.label).toBe('string')
    }
  })

  it('count matches DONATION_TYPES', () => {
    expect(getDonationTypeOptions().length).toBe(Object.keys(DONATION_TYPES).length)
  })
})

describe('getDeviceCategoryOptions', () => {
  it('count matches DEVICE_CATEGORIES', () => {
    expect(getDeviceCategoryOptions().length).toBe(Object.keys(DEVICE_CATEGORIES).length)
  })

  it('includes an option for laptop', () => {
    const values = getDeviceCategoryOptions().map(o => o.value)
    expect(values).toContain('laptop')
  })
})

describe('getDeviceConditionOptions', () => {
  it('count matches DEVICE_CONDITIONS', () => {
    expect(getDeviceConditionOptions().length).toBe(Object.keys(DEVICE_CONDITIONS).length)
  })
})

describe('getPaymentMethodOptions', () => {
  it('count matches PAYMENT_METHODS', () => {
    expect(getPaymentMethodOptions().length).toBe(Object.keys(PAYMENT_METHODS).length)
  })
})

describe('getDonationStatusOptions', () => {
  it('count matches DONATION_STATUSES', () => {
    expect(getDonationStatusOptions().length).toBe(Object.keys(DONATION_STATUSES).length)
  })
})
