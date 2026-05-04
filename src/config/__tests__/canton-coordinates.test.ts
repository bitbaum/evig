/**
 * Tests for config/canton-coordinates.ts — Swiss canton coordinate lookup.
 *
 * Mission-relevant: canton coordinates power the IT-Hilfe map which matches
 * helpers to requesters by geography. If getCantonCoordinates returns null
 * for a valid canton, the helper-matching map marker is missing.
 *
 * Behaviors locked:
 *   getCantonCoordinates
 *   - returns coordinates for exact canton name match
 *   - returns coordinates for case-insensitive match
 *   - returns null for unknown canton
 *   - covers all 26 Swiss cantons in CANTON_COORDINATES
 *
 *   CANTON_COORDINATES
 *   - has exactly 26 entries
 *   - all coordinates are in Swiss territory (lat 45–48, lng 5–11)
 */

import { CANTON_COORDINATES, getCantonCoordinates } from '../canton-coordinates'

// ============================================================================
// getCantonCoordinates — exact match
// ============================================================================

describe('getCantonCoordinates — exact match', () => {
  it('returns coordinates for Zürich', () => {
    const coords = getCantonCoordinates('Zürich')
    expect(coords).not.toBeNull()
    expect(coords!.lat).toBeCloseTo(47.37, 1)
    expect(coords!.lng).toBeCloseTo(8.55, 1)
  })

  it('returns coordinates for Bern', () => {
    const coords = getCantonCoordinates('Bern')
    expect(coords).not.toBeNull()
    expect(coords!.lat).toBeCloseTo(46.95, 1)
  })

  it('returns coordinates for Graubünden (has umlaut)', () => {
    const coords = getCantonCoordinates('Graubünden')
    expect(coords).not.toBeNull()
  })

  it('returns coordinates for St. Gallen (has period)', () => {
    const coords = getCantonCoordinates('St. Gallen')
    expect(coords).not.toBeNull()
  })

  it('returns coordinates for Tessin (Italian-speaking)', () => {
    const coords = getCantonCoordinates('Tessin')
    expect(coords).not.toBeNull()
    // Ticino is in south Switzerland
    expect(coords!.lat).toBeLessThan(47)
  })
})

// ============================================================================
// getCantonCoordinates — case-insensitive match
// ============================================================================

describe('getCantonCoordinates — case-insensitive match', () => {
  it('matches "zürich" (lowercase)', () => {
    expect(getCantonCoordinates('zürich')).not.toBeNull()
  })

  it('matches "BERN" (uppercase)', () => {
    expect(getCantonCoordinates('BERN')).not.toBeNull()
  })

  it('matches "bASEL-sTADT" (mixed case)', () => {
    expect(getCantonCoordinates('bASEL-sTADT')).not.toBeNull()
  })
})

// ============================================================================
// getCantonCoordinates — null fallback
// ============================================================================

describe('getCantonCoordinates — null fallback', () => {
  it('returns null for unknown canton', () => {
    expect(getCantonCoordinates('Unknown Canton')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getCantonCoordinates('')).toBeNull()
  })

  it('returns null for partial canton name', () => {
    expect(getCantonCoordinates('Zur')).toBeNull()
  })
})

// ============================================================================
// CANTON_COORDINATES shape
// ============================================================================

describe('CANTON_COORDINATES', () => {
  it('has exactly 26 entries (one per Swiss canton)', () => {
    expect(Object.keys(CANTON_COORDINATES)).toHaveLength(26)
  })

  it('all latitudes are within Swiss territory (45–48°N)', () => {
    for (const [name, coords] of Object.entries(CANTON_COORDINATES)) {
      expect(coords.lat).toBeGreaterThan(45)
      expect(coords.lat).toBeLessThan(48)
      if (coords.lat <= 45 || coords.lat >= 48) console.warn(`Out-of-range lat for ${name}: ${coords.lat}`)
    }
  })

  it('all longitudes are within Swiss territory (5–11°E)', () => {
    for (const [name, coords] of Object.entries(CANTON_COORDINATES)) {
      expect(coords.lng).toBeGreaterThan(5)
      expect(coords.lng).toBeLessThan(11)
      if (coords.lng <= 5 || coords.lng >= 11) console.warn(`Out-of-range lng for ${name}: ${coords.lng}`)
    }
  })

  const EXPECTED_CANTONS = [
    'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden',
    'Basel-Landschaft', 'Basel-Stadt', 'Bern', 'Freiburg', 'Genf',
    'Glarus', 'Graubünden', 'Jura', 'Luzern', 'Neuenburg',
    'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz', 'Solothurn',
    'St. Gallen', 'Tessin', 'Thurgau', 'Uri', 'Waadt', 'Wallis',
    'Zug', 'Zürich',
  ]

  it('contains all 26 expected Swiss cantons', () => {
    const keys = Object.keys(CANTON_COORDINATES)
    for (const canton of EXPECTED_CANTONS) {
      expect(keys).toContain(canton)
    }
  })
})
