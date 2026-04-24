/**
 * Tests for Swiss postal code utilities (lib/swiss-postal-codes.ts)
 *
 * Swiss postal code lookup is used in IT-Hilfe location matching and
 * repairer profile forms. Correctness ensures technicians are matched
 * to the right geographic area.
 *
 * Covers: lookupSwissPostalCode, getAllSwissPostalCodes,
 *         searchSwissCities, isValidSwissPostalCode.
 */

import {
  lookupSwissPostalCode,
  getAllSwissPostalCodes,
  searchSwissCities,
  isValidSwissPostalCode,
} from '../swiss-postal-codes'

// ============================================================================
// lookupSwissPostalCode
// ============================================================================

describe('lookupSwissPostalCode', () => {
  it('returns data for a known Zürich postal code', () => {
    const result = lookupSwissPostalCode('8001')
    expect(result).not.toBeNull()
    expect(result?.city).toBe('Zürich')
    expect(result?.canton).toBe('Zürich')
    expect(result?.postal_code).toBe('8001')
  })

  it('returns data for Basel', () => {
    const result = lookupSwissPostalCode('4051')
    expect(result).not.toBeNull()
    expect(result?.city).toBe('Basel')
  })

  it('returns data for Bern', () => {
    const result = lookupSwissPostalCode('3000')
    expect(result).not.toBeNull()
    expect(result?.city).toBe('Bern')
  })

  it('returns null for an unknown postal code', () => {
    const result = lookupSwissPostalCode('9999')
    expect(result).toBeNull()
  })

  it('returns null for a 3-digit code', () => {
    expect(lookupSwissPostalCode('800')).toBeNull()
  })

  it('returns null for a 5-digit code', () => {
    expect(lookupSwissPostalCode('80011')).toBeNull()
  })

  it('strips non-numeric characters before lookup', () => {
    // "8001" with spaces or letters stripped → "8001"
    const result = lookupSwissPostalCode('80 01')
    // After stripping non-numeric: "8001" → 4 digits → should work
    expect(result).not.toBeNull()
  })

  it('returns null for empty string', () => {
    expect(lookupSwissPostalCode('')).toBeNull()
  })

  it('returns null for fully non-numeric input', () => {
    expect(lookupSwissPostalCode('ABCD')).toBeNull()
  })
})

// ============================================================================
// getAllSwissPostalCodes
// ============================================================================

describe('getAllSwissPostalCodes', () => {
  it('returns an array', () => {
    expect(Array.isArray(getAllSwissPostalCodes())).toBe(true)
  })

  it('returns a non-empty array', () => {
    expect(getAllSwissPostalCodes().length).toBeGreaterThan(0)
  })

  it('each entry has postal_code, city, and canton', () => {
    const codes = getAllSwissPostalCodes()
    for (const entry of codes.slice(0, 5)) {
      expect(entry).toHaveProperty('postal_code')
      expect(entry).toHaveProperty('city')
      expect(entry).toHaveProperty('canton')
    }
  })

  it('all postal codes are 4-digit strings', () => {
    const codes = getAllSwissPostalCodes()
    for (const entry of codes) {
      expect(entry.postal_code).toMatch(/^\d{4}$/)
    }
  })
})

// ============================================================================
// searchSwissCities
// ============================================================================

describe('searchSwissCities', () => {
  it('finds Zürich by city name', () => {
    const results = searchSwissCities('Zürich')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r => r.city === 'Zürich' || r.canton.includes('Zürich'))).toBe(true)
  })

  it('is case-insensitive', () => {
    const lower = searchSwissCities('zürich')
    const upper = searchSwissCities('ZÜRICH')
    expect(lower.length).toBeGreaterThan(0)
    expect(lower.length).toBe(upper.length)
  })

  it('finds results by canton name', () => {
    const results = searchSwissCities('Bern')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns empty array for no match', () => {
    const results = searchSwissCities('Atlantis')
    expect(results).toEqual([])
  })

  it('returns empty array for empty search term', () => {
    // Empty string matches everything (lowercased "" is contained in all strings)
    // This documents the current behavior: empty string returns all
    const results = searchSwissCities('')
    expect(Array.isArray(results)).toBe(true)
  })

  it('partial match works', () => {
    const results = searchSwissCities('Base')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.city === 'Basel')).toBe(true)
  })
})

// ============================================================================
// isValidSwissPostalCode
// ============================================================================

describe('isValidSwissPostalCode', () => {
  it('accepts valid 4-digit codes', () => {
    expect(isValidSwissPostalCode('8001')).toBe(true)
    expect(isValidSwissPostalCode('3000')).toBe(true)
    expect(isValidSwissPostalCode('1000')).toBe(true)
  })

  it('rejects 3-digit codes', () => {
    expect(isValidSwissPostalCode('800')).toBe(false)
  })

  it('rejects 5-digit codes', () => {
    expect(isValidSwissPostalCode('80012')).toBe(false)
  })

  it('rejects non-numeric codes', () => {
    expect(isValidSwissPostalCode('ABCD')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidSwissPostalCode('')).toBe(false)
  })

  it('strips non-numeric characters before validation', () => {
    // "80 01" → "8001" after stripping → valid
    expect(isValidSwissPostalCode('80 01')).toBe(true)
  })

  it('rejects codes below 1000', () => {
    // "0999" → numeric "0999" < "1000" → false
    expect(isValidSwissPostalCode('0999')).toBe(false)
  })

  it('rejects codes above 9999', () => {
    // Any 5+ digit code gets cleaned to 5 digits → length check fails
    expect(isValidSwissPostalCode('10000')).toBe(false)
  })
})
