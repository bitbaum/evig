/**
 * Tests for getDefaultNumeric and getDefaultValue in lib/org-numbers.defaults.ts
 *
 * These accessors are used by UI components to display org metrics.
 * Wrong output → fake stats displayed to users (SSOT violation).
 */

import { getDefaultNumeric, getDefaultValue, ORG_NUMBERS_DEFAULTS } from '../org-numbers.defaults'

// ============================================================================
// getDefaultNumeric
// ============================================================================

describe('getDefaultNumeric', () => {
  it('returns the numeric value for a known numeric key', () => {
    expect(getDefaultNumeric('co2_savings_per_device')).toBe(285)
  })

  it('returns the correct value for founding_year', () => {
    expect(getDefaultNumeric('founding_year')).toBe(2003)
  })

  it('returns the correct value for hourly_rate_chf', () => {
    expect(getDefaultNumeric('hourly_rate_chf')).toBe(70)
  })

  it('throws for a key that does not exist', () => {
    expect(() => getDefaultNumeric('nonexistent_key')).toThrow(
      'ORG_NUMBERS_DEFAULTS.nonexistent_key not found or not numeric'
    )
  })

  it('returns a number type (not string)', () => {
    const val = getDefaultNumeric('devices_sold_per_year')
    expect(typeof val).toBe('number')
  })

  it('all entries with non-null numericValue are accessible', () => {
    const numericKeys = Object.keys(ORG_NUMBERS_DEFAULTS).filter(
      k => ORG_NUMBERS_DEFAULTS[k].numericValue != null
    )
    for (const key of numericKeys) {
      expect(() => getDefaultNumeric(key)).not.toThrow()
      expect(typeof getDefaultNumeric(key)).toBe('number')
    }
  })
})

// ============================================================================
// getDefaultValue
// ============================================================================

describe('getDefaultValue', () => {
  it('returns the display string for a known key', () => {
    expect(getDefaultValue('co2_savings_per_device')).toBe('285')
  })

  it('returns tilde-prefixed string for estimated values', () => {
    expect(getDefaultValue('devices_sold_per_year')).toBe('~150')
  })

  it('returns percentage string for rate values', () => {
    expect(getDefaultValue('reuse_rate')).toBe('75%')
  })

  it('returns string type always', () => {
    expect(typeof getDefaultValue('founding_year')).toBe('string')
  })

  it('throws for a key that does not exist', () => {
    expect(() => getDefaultValue('nonexistent_key')).toThrow(
      'ORG_NUMBERS_DEFAULTS.nonexistent_key not found'
    )
  })

  it('all entries are accessible by key', () => {
    for (const key of Object.keys(ORG_NUMBERS_DEFAULTS)) {
      expect(() => getDefaultValue(key)).not.toThrow()
    }
  })
})

// ============================================================================
// ORG_NUMBERS_DEFAULTS structure
// ============================================================================

describe('ORG_NUMBERS_DEFAULTS', () => {
  it('contains expected impact keys', () => {
    expect(ORG_NUMBERS_DEFAULTS).toHaveProperty('co2_savings_per_device')
    expect(ORG_NUMBERS_DEFAULTS).toHaveProperty('annual_co2_saved_tons')
    expect(ORG_NUMBERS_DEFAULTS).toHaveProperty('devices_sold_per_year')
  })

  it('contains expected operations keys', () => {
    expect(ORG_NUMBERS_DEFAULTS).toHaveProperty('founding_year')
    expect(ORG_NUMBERS_DEFAULTS).toHaveProperty('team_size_community')
  })

  it('all entries have required fields', () => {
    for (const [key, entry] of Object.entries(ORG_NUMBERS_DEFAULTS)) {
      expect(entry).toHaveProperty('key', key)
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('label')
      expect(entry).toHaveProperty('category')
      expect(entry).toHaveProperty('confidence')
    }
  })
})
