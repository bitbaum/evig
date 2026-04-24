/**
 * Tests for donations.ts and activity.ts config utility functions.
 *
 * donations.ts: label lookups, estimated device value, CHF amount formatting,
 *               and options-array generators used in donation forms.
 * activity.ts:  label/color functions that all accept string|null — null safety
 *               is load-bearing because the API can return null for optional fields.
 *
 * Wrong output here means incorrect labels in donation management UI
 * and incorrect urgency/status colors in the activity stream.
 */

// ============================================================================
// donations.ts
// ============================================================================

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
  DEVICE_VALUE_ESTIMATES,
} from '../donations'

// ─── Label functions ──────────────────────────────────────────────────────────

describe('getDonationTypeLabel', () => {
  it('returns "Geldspende" for monetary', () => {
    expect(getDonationTypeLabel(DONATION_TYPES.MONETARY)).toBe('Geldspende')
  })

  it('returns "Sachspende" for device', () => {
    expect(getDonationTypeLabel(DONATION_TYPES.DEVICE)).toBe('Sachspende')
  })

  it('falls back to raw string for unknown type', () => {
    expect(getDonationTypeLabel('unknown')).toBe('unknown')
  })
})

describe('getDeviceCategoryLabel', () => {
  it('returns "Laptop" for laptop', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.LAPTOP)).toBe('Laptop')
  })

  it('returns "Desktop-PC" for desktop', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.DESKTOP)).toBe('Desktop-PC')
  })

  it('returns "Monitor" for monitor', () => {
    expect(getDeviceCategoryLabel(DEVICE_CATEGORIES.MONITOR)).toBe('Monitor')
  })

  it('falls back to raw string for unknown category', () => {
    expect(getDeviceCategoryLabel('unknown_device')).toBe('unknown_device')
  })
})

describe('getDeviceConditionLabel', () => {
  it('returns a non-empty string for excellent', () => {
    const label = getDeviceConditionLabel(DEVICE_CONDITIONS.EXCELLENT)
    expect(label.length).toBeGreaterThan(0)
    expect(typeof label).toBe('string')
  })

  it('returns a non-empty string for all known conditions', () => {
    for (const condition of Object.values(DEVICE_CONDITIONS)) {
      const label = getDeviceConditionLabel(condition)
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown condition', () => {
    expect(getDeviceConditionLabel('ancient')).toBe('ancient')
  })
})

describe('getPaymentMethodLabel', () => {
  it('returns a non-empty string for bank_transfer', () => {
    expect(getPaymentMethodLabel(PAYMENT_METHODS.BANK_TRANSFER).length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for all known methods', () => {
    for (const method of Object.values(PAYMENT_METHODS)) {
      expect(getPaymentMethodLabel(method).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown method', () => {
    expect(getPaymentMethodLabel('crypto')).toBe('crypto')
  })
})

describe('getDonationStatusLabel', () => {
  it('returns a non-empty string for recorded', () => {
    expect(getDonationStatusLabel(DONATION_STATUSES.RECORDED).length).toBeGreaterThan(0)
  })

  it('returns non-empty label for all known statuses', () => {
    for (const status of Object.values(DONATION_STATUSES)) {
      expect(getDonationStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown status', () => {
    expect(getDonationStatusLabel('ghost_status')).toBe('ghost_status')
  })
})

// ─── getEstimatedValue ────────────────────────────────────────────────────────

describe('getEstimatedValue', () => {
  it('returns 15000 (CHF 150) for laptop', () => {
    expect(getEstimatedValue(DEVICE_CATEGORIES.LAPTOP)).toBe(15000)
  })

  it('returns 10000 (CHF 100) for desktop', () => {
    expect(getEstimatedValue(DEVICE_CATEGORIES.DESKTOP)).toBe(10000)
  })

  it('returns 4000 (CHF 40) for monitor', () => {
    expect(getEstimatedValue(DEVICE_CATEGORIES.MONITOR)).toBe(4000)
  })

  it('returns the "other" fallback for an unknown category', () => {
    // Falls back to DEVICE_VALUE_ESTIMATES[DEVICE_CATEGORIES.OTHER]
    const fallback = DEVICE_VALUE_ESTIMATES[DEVICE_CATEGORIES.OTHER]
    expect(getEstimatedValue('unknown_device')).toBe(fallback)
  })

  it('returns a positive integer for all known categories', () => {
    for (const category of Object.values(DEVICE_CATEGORIES)) {
      const value = getEstimatedValue(category)
      expect(value).toBeGreaterThan(0)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

// ─── formatAmountCHF ─────────────────────────────────────────────────────────

describe('formatAmountCHF', () => {
  it('formats 10000 cents as "CHF 100.00"', () => {
    expect(formatAmountCHF(10000)).toBe('CHF 100.00')
  })

  it('formats 150 cents as "CHF 1.50"', () => {
    expect(formatAmountCHF(150)).toBe('CHF 1.50')
  })

  it('formats 1 cent as "CHF 0.01"', () => {
    expect(formatAmountCHF(1)).toBe('CHF 0.01')
  })

  it('formats 0 cents as "CHF 0.00"', () => {
    expect(formatAmountCHF(0)).toBe('CHF 0.00')
  })

  it('returns "-" for null', () => {
    expect(formatAmountCHF(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(formatAmountCHF(undefined)).toBe('-')
  })

  it('always starts with "CHF " for numeric input', () => {
    expect(formatAmountCHF(5000)).toMatch(/^CHF /)
  })

  it('always has exactly 2 decimal places', () => {
    expect(formatAmountCHF(5000)).toMatch(/\.\d{2}$/)
    expect(formatAmountCHF(1)).toMatch(/\.\d{2}$/)
  })
})

// ─── Options arrays ───────────────────────────────────────────────────────────

describe('getDonationTypeOptions', () => {
  it('returns an array', () => {
    expect(Array.isArray(getDonationTypeOptions())).toBe(true)
  })

  it('each option has value and label', () => {
    for (const opt of getDonationTypeOptions()) {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })

  it('contains all DONATION_TYPES values', () => {
    const values = getDonationTypeOptions().map(o => o.value)
    for (const type of Object.values(DONATION_TYPES)) {
      expect(values).toContain(type)
    }
  })
})

describe('getDeviceCategoryOptions', () => {
  it('returns non-empty array with value/label pairs', () => {
    const opts = getDeviceCategoryOptions()
    expect(opts.length).toBeGreaterThan(0)
    for (const opt of opts) {
      expect(opt).toHaveProperty('value')
      expect(opt).toHaveProperty('label')
    }
  })
})

describe('getDeviceConditionOptions', () => {
  it('returns non-empty array matching DEVICE_CONDITIONS', () => {
    const opts = getDeviceConditionOptions()
    expect(opts.length).toBe(Object.keys(DEVICE_CONDITIONS).length)
  })
})

describe('getPaymentMethodOptions', () => {
  it('returns non-empty array matching PAYMENT_METHODS', () => {
    const opts = getPaymentMethodOptions()
    expect(opts.length).toBe(Object.keys(PAYMENT_METHODS).length)
  })
})

describe('getDonationStatusOptions', () => {
  it('returns non-empty array with value/label pairs', () => {
    const opts = getDonationStatusOptions()
    expect(opts.length).toBeGreaterThan(0)
    for (const opt of opts) {
      expect(opt.label.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// activity.ts — null-safety is the critical behavior
// ============================================================================

import {
  getActivityUpdateTypeLabel,
  getActivityUpdateTypeColor,
  getVisibilityLabel,
  getHelpRequestUrgencyLabel,
  getHelpRequestUrgencyColor,
  getHelpRequestStatusLabel,
  getHelpRequestStatusColor,
  getActivityCategoryLabel,
  ACTIVITY_UPDATE_TYPES,
  VISIBILITY_LEVELS,
  HELP_REQUEST_URGENCY,
  HELP_REQUEST_STATUSES,
  ACTIVITY_CATEGORIES,
} from '../activity'

// ─── getActivityUpdateTypeLabel ───────────────────────────────────────────────

describe('getActivityUpdateTypeLabel', () => {
  it('returns "Unbekannt" for null', () => {
    expect(getActivityUpdateTypeLabel(null)).toBe('Unbekannt')
  })

  it('returns a non-empty string for accomplishment', () => {
    expect(getActivityUpdateTypeLabel(ACTIVITY_UPDATE_TYPES.ACCOMPLISHMENT).length).toBeGreaterThan(0)
  })

  it('returns a non-empty string for all known types', () => {
    for (const type of Object.values(ACTIVITY_UPDATE_TYPES)) {
      expect(getActivityUpdateTypeLabel(type).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown type', () => {
    expect(getActivityUpdateTypeLabel('mystery_type')).toBe('mystery_type')
  })
})

// ─── getActivityUpdateTypeColor ──────────────────────────────────────────────

describe('getActivityUpdateTypeColor', () => {
  it('returns default gray for null', () => {
    expect(getActivityUpdateTypeColor(null)).toBe('bg-gray-100 text-gray-800')
  })

  it('returns a non-empty CSS string for all known types', () => {
    for (const type of Object.values(ACTIVITY_UPDATE_TYPES)) {
      const color = getActivityUpdateTypeColor(type)
      expect(color.length).toBeGreaterThan(0)
      expect(color).toContain('bg-')
    }
  })

  it('returns default gray for unknown type', () => {
    expect(getActivityUpdateTypeColor('unknown')).toBe('bg-gray-100 text-gray-800')
  })
})

// ─── getVisibilityLabel ───────────────────────────────────────────────────────

describe('getVisibilityLabel', () => {
  it('returns "Team" for null (default visibility)', () => {
    expect(getVisibilityLabel(null)).toBe('Team')
  })

  it('returns label for team', () => {
    expect(getVisibilityLabel(VISIBILITY_LEVELS.TEAM)).toBe('Team')
  })

  it('returns non-empty string for all known visibility levels', () => {
    for (const level of Object.values(VISIBILITY_LEVELS)) {
      expect(getVisibilityLabel(level).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown visibility', () => {
    expect(getVisibilityLabel('secret')).toBe('secret')
  })
})

// ─── getHelpRequestUrgencyLabel ───────────────────────────────────────────────

describe('getHelpRequestUrgencyLabel', () => {
  it('returns "Normal" for null (default urgency)', () => {
    expect(getHelpRequestUrgencyLabel(null)).toBe('Normal')
  })

  it('returns a label for all known urgencies', () => {
    for (const urgency of Object.values(HELP_REQUEST_URGENCY)) {
      expect(getHelpRequestUrgencyLabel(urgency).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown urgency', () => {
    expect(getHelpRequestUrgencyLabel('extreme')).toBe('extreme')
  })
})

// ─── getHelpRequestUrgencyColor ──────────────────────────────────────────────

describe('getHelpRequestUrgencyColor', () => {
  it('returns blue (normal) for null', () => {
    expect(getHelpRequestUrgencyColor(null)).toBe('bg-blue-100 text-blue-800')
  })

  it('returns CSS class string for all known urgencies', () => {
    for (const urgency of Object.values(HELP_REQUEST_URGENCY)) {
      const color = getHelpRequestUrgencyColor(urgency)
      expect(color).toContain('bg-')
    }
  })

  it('returns blue default for unknown urgency', () => {
    expect(getHelpRequestUrgencyColor('catastrophic')).toBe('bg-blue-100 text-blue-800')
  })
})

// ─── getHelpRequestStatusLabel ────────────────────────────────────────────────

describe('getHelpRequestStatusLabel', () => {
  it('returns "Offen" for null (default status)', () => {
    expect(getHelpRequestStatusLabel(null)).toBe('Offen')
  })

  it('returns non-empty string for all known statuses', () => {
    for (const status of Object.values(HELP_REQUEST_STATUSES)) {
      expect(getHelpRequestStatusLabel(status).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown status', () => {
    expect(getHelpRequestStatusLabel('limbo')).toBe('limbo')
  })
})

// ─── getHelpRequestStatusColor ───────────────────────────────────────────────

describe('getHelpRequestStatusColor', () => {
  it('returns yellow default for null', () => {
    expect(getHelpRequestStatusColor(null)).toBe('bg-yellow-100 text-yellow-800')
  })

  it('returns CSS class string for all known statuses', () => {
    for (const status of Object.values(HELP_REQUEST_STATUSES)) {
      const color = getHelpRequestStatusColor(status)
      expect(color).toContain('bg-')
    }
  })

  it('returns yellow default for unknown status', () => {
    expect(getHelpRequestStatusColor('unknown_state')).toBe('bg-yellow-100 text-yellow-800')
  })
})

// ─── getActivityCategoryLabel ─────────────────────────────────────────────────

describe('getActivityCategoryLabel', () => {
  it('returns "Sonstiges" for null (catch-all default)', () => {
    expect(getActivityCategoryLabel(null)).toBe('Sonstiges')
  })

  it('returns non-empty string for all known categories', () => {
    for (const category of Object.values(ACTIVITY_CATEGORIES)) {
      expect(getActivityCategoryLabel(category).length).toBeGreaterThan(0)
    }
  })

  it('falls back to raw string for unknown category', () => {
    expect(getActivityCategoryLabel('mystery_category')).toBe('mystery_category')
  })
})
