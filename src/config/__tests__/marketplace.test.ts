/**
 * Tests for config/marketplace.ts — price formatting and category helpers.
 *
 * Mission-relevant: formatPriceCents is used to display prices everywhere
 * in the shop. If it formats 0 as "CHF 0" instead of "Kostenlos", free
 * items aren't labelled correctly. If formatCHF(0) doesn't return "Gratis",
 * the shop listing shows "CHF 0.00" on donated items.
 *
 * Behaviors locked:
 *   formatPriceCents
 *   - returns 'Auf Anfrage' for null
 *   - returns 'Kostenlos' for 0
 *   - returns 'CHF X' (no decimals) for whole-franc amounts
 *   - returns 'CHF X.XX' for fractional franc amounts
 *
 *   formatCHF
 *   - returns 'Gratis' for 0
 *   - returns formatted currency string for non-zero amount
 *
 *   getCategoryLabel
 *   - returns German category label for known value
 *   - falls back to raw value for unknown
 *
 *   getSpecFiltersForCategory
 *   - returns array for known category (e.g. laptops)
 *   - returns empty array for unknown category
 */

jest.mock('@/lib/marketplace/spec-utils', () => ({
  normalizeSpecValue: jest.fn(),
}))

import {
  formatPriceCents,
  formatCHF,
  getCategoryLabel,
  getSpecFiltersForCategory,
  supportsSecureCheckout,
  supportsDirectContact,
} from '../marketplace'

// ============================================================================
// formatPriceCents
// ============================================================================

describe('formatPriceCents', () => {
  it('returns "Auf Anfrage" for null', () => {
    expect(formatPriceCents(null)).toBe('Auf Anfrage')
  })

  it('returns "Kostenlos" for 0', () => {
    expect(formatPriceCents(0)).toBe('Kostenlos')
  })

  it('returns "CHF 150" (no decimals) for 15000 cents', () => {
    expect(formatPriceCents(15000)).toBe('CHF 150')
  })

  it('returns "CHF 1" for 100 cents', () => {
    expect(formatPriceCents(100)).toBe('CHF 1')
  })

  it('returns "CHF 1.50" for 150 cents', () => {
    expect(formatPriceCents(150)).toBe('CHF 1.50')
  })

  it('returns "CHF 0.99" for 99 cents', () => {
    expect(formatPriceCents(99)).toBe('CHF 0.99')
  })

  it('returns "CHF 1000" (no decimals) for 100000 cents', () => {
    expect(formatPriceCents(100000)).toBe('CHF 1000')
  })
})

// ============================================================================
// formatCHF
// ============================================================================

describe('formatCHF', () => {
  it('returns "Gratis" for 0', () => {
    expect(formatCHF(0)).toBe('Gratis')
  })

  it('returns a CHF-formatted string for positive amount', () => {
    const result = formatCHF(150)
    expect(result).toContain('150')
    // Intl formatter uses locale-specific CHF format
    expect(result).toBeTruthy()
  })

  it('does not return "Gratis" for positive amount', () => {
    expect(formatCHF(1)).not.toBe('Gratis')
  })
})

// ============================================================================
// getCategoryLabel
// ============================================================================

describe('getCategoryLabel', () => {
  it('returns "Laptops" for category "10"', () => {
    expect(getCategoryLabel('10')).toBe('Laptops')
  })

  it('returns "Desktop PCs" for category "20"', () => {
    expect(getCategoryLabel('20')).toBe('Desktop PCs')
  })

  it('returns "Sonstiges" for category "99"', () => {
    expect(getCategoryLabel('99')).toBe('Sonstiges')
  })

  it('falls back to raw value for unknown category', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown')
  })
})

// ============================================================================
// getSpecFiltersForCategory
// ============================================================================

describe('getSpecFiltersForCategory', () => {
  it('returns array for laptops category "10"', () => {
    const filters = getSpecFiltersForCategory('10')
    expect(Array.isArray(filters)).toBe(true)
    expect(filters.length).toBeGreaterThan(0)
  })

  it('each filter has key, label, unit, meiliField, and options', () => {
    const filters = getSpecFiltersForCategory('10')
    for (const f of filters) {
      expect(f.key).toBeTruthy()
      expect(f.label).toBeTruthy()
      expect(f.unit).toBeTruthy()
      expect(f.meiliField).toBeTruthy()
      expect(Array.isArray(f.options)).toBe(true)
    }
  })

  it('returns empty array for unknown category', () => {
    expect(getSpecFiltersForCategory('unknown')).toEqual([])
  })

  it('returns empty array for peripherals category "80" (no spec filters defined)', () => {
    expect(getSpecFiltersForCategory('80')).toEqual([])
  })
})

// ============================================================================
// Payment mode helpers
// ============================================================================

describe('supportsSecureCheckout', () => {
  it('returns true for secure and both', () => {
    expect(supportsSecureCheckout('secure')).toBe(true)
    expect(supportsSecureCheckout('both')).toBe(true)
  })

  it('returns false for direct', () => {
    expect(supportsSecureCheckout('direct')).toBe(false)
  })
})

describe('supportsDirectContact', () => {
  it('returns true for direct and both', () => {
    expect(supportsDirectContact('direct')).toBe(true)
    expect(supportsDirectContact('both')).toBe(true)
  })

  it('returns false for secure-only', () => {
    expect(supportsDirectContact('secure')).toBe(false)
  })
})
