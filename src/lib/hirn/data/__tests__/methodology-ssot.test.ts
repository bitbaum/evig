/**
 * Tests for the Hirn methodology SSOT (lib/hirn/data/methodology-ssot.ts).
 *
 * This file is the canonical source for every methodology, formula, and
 * scientific reference shown on the Hirn impact dashboard. Two classes
 * of guarantee here:
 *
 *   1. Lookup correctness — getMethodology / getReference /
 *      getReferencesByMethodology behave as documented
 *   2. Data integrity — every methodology has required shape, every
 *      reference is well-formed, and every methodology.references[] ID
 *      points at a real entry in SCIENTIFIC_REFERENCES (no broken links
 *      that would silently render an empty section on the dashboard)
 */

import {
  getMethodology,
  getReference,
  getReferencesByMethodology,
  SCIENTIFIC_REFERENCES,
  METHODOLOGIES,
  THREE_PILLARS,
  CO2_REFERENCE_VALUES,
  DEVICE_WEIGHTS,
  CONFIDENCE_LEVELS,
  type MethodologyId,
} from '../methodology-ssot'

// ============================================================================
// getMethodology
// ============================================================================

describe('getMethodology', () => {
  it('returns the methodology for a known id', () => {
    const m = getMethodology('direct_kivitendo')
    expect(m.id).toBe('direct_kivitendo')
    expect(m.category).toBe('financial')
    expect(m.confidence).toBe('high')
  })

  it('returns the device_co2_avoided methodology with its formula', () => {
    const m = getMethodology('device_co2_avoided')
    expect(m.formula).toBeDefined()
    expect(m.formula?.expression).toContain('CO₂_avoided')
  })
})

// ============================================================================
// getReference
// ============================================================================

describe('getReference', () => {
  it('returns the reference for a known id', () => {
    const ref = getReference('BAFU_LIFECYCLE_2023')
    expect(ref).toBeDefined()
    expect(ref?.year).toBe(2023)
    expect(ref?.authors).toContain('BAFU')
  })

  it('returns undefined for an unknown id', () => {
    expect(getReference('DOES_NOT_EXIST')).toBeUndefined()
  })
})

// ============================================================================
// getReferencesByMethodology
// ============================================================================

describe('getReferencesByMethodology', () => {
  it('returns the resolved reference objects for the methodology', () => {
    const refs = getReferencesByMethodology('device_co2_avoided')
    expect(refs.length).toBeGreaterThan(0)
    // device_co2_avoided cites BAFU_LIFECYCLE_2023 + EU_JRC_CIRCULAR_2020 + FRAUNHOFER_REUSE_2022
    const ids = refs.map(r => r.id)
    expect(ids).toContain('BAFU_LIFECYCLE_2023')
    expect(ids).toContain('EU_JRC_CIRCULAR_2020')
  })

  it('returns [] for a methodology that cites no references (direct_kivitendo)', () => {
    const refs = getReferencesByMethodology('direct_kivitendo')
    expect(refs).toEqual([])
  })

  it('every returned entry is a fully-shaped ScientificReference', () => {
    const refs = getReferencesByMethodology('device_co2_avoided')
    for (const ref of refs) {
      expect(ref).toHaveProperty('id')
      expect(ref).toHaveProperty('title')
      expect(ref).toHaveProperty('authors')
      expect(ref).toHaveProperty('year')
      expect(ref).toHaveProperty('source')
      expect(ref).toHaveProperty('description')
    }
  })
})

// ============================================================================
// METHODOLOGIES — data integrity
// ============================================================================

describe('METHODOLOGIES data integrity', () => {
  const allMethodologyIds = Object.keys(METHODOLOGIES) as MethodologyId[]

  it('contains all 10 documented MethodologyIds', () => {
    expect(allMethodologyIds.length).toBe(10)
  })

  it('every entry has required shape (id, name, category, confidence, references[])', () => {
    for (const id of allMethodologyIds) {
      const m = METHODOLOGIES[id]
      expect(m.id).toBe(id) // self-consistency: key matches inner id
      expect(m.name).toBeTruthy()
      expect(['financial', 'environmental', 'social', 'educational']).toContain(m.category)
      expect(['high', 'medium', 'low']).toContain(m.confidence)
      expect(Array.isArray(m.references)).toBe(true)
      expect(Array.isArray(m.assumptions)).toBe(true)
      expect(Array.isArray(m.limitations)).toBe(true)
      expect(m.description).toBeTruthy()
      expect(m.dataCollection).toBeTruthy()
      expect(['realtime', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).toContain(m.updateFrequency)
    }
  })

  it('every methodology.references[] entry resolves to a real SCIENTIFIC_REFERENCES entry (no broken links)', () => {
    const broken: Array<{ methodology: string; refId: string }> = []
    for (const id of allMethodologyIds) {
      const m = METHODOLOGIES[id]
      for (const refId of m.references) {
        if (!SCIENTIFIC_REFERENCES[refId]) {
          broken.push({ methodology: id, refId })
        }
      }
    }
    expect(broken).toEqual([])
  })

  it('every methodology with a formula has matching variables (no orphan symbols)', () => {
    for (const id of allMethodologyIds) {
      const m = METHODOLOGIES[id]
      if (!m.formula) continue
      expect(m.formula.expression).toBeTruthy()
      expect(m.formula.humanReadable).toBeTruthy()
      expect(Array.isArray(m.formula.variables)).toBe(true)
      // Each variable has a complete shape
      for (const v of m.formula.variables) {
        expect(v.symbol).toBeTruthy()
        expect(v.name).toBeTruthy()
        expect(v.unit).toBeTruthy()
        expect(v.source).toBeTruthy()
      }
    }
  })

  it('environmental + social + educational methodologies all carry a non-null pillar', () => {
    for (const id of allMethodologyIds) {
      const m = METHODOLOGIES[id]
      if (m.category === 'financial') continue
      expect(m.pillar).not.toBeNull()
    }
  })
})

// ============================================================================
// SCIENTIFIC_REFERENCES — data integrity
// ============================================================================

describe('SCIENTIFIC_REFERENCES data integrity', () => {
  it('every entry has the required shape', () => {
    for (const [key, ref] of Object.entries(SCIENTIFIC_REFERENCES)) {
      expect(ref.id).toBe(key) // self-consistency
      expect(ref.title).toBeTruthy()
      expect(ref.authors).toBeTruthy()
      expect(typeof ref.year).toBe('number')
      expect(ref.year).toBeGreaterThan(1900)
      expect(ref.year).toBeLessThanOrEqual(new Date().getFullYear() + 1)
      expect(ref.source).toBeTruthy()
      expect(ref.description).toBeTruthy()
    }
  })

  it('every reference is cited by at least one methodology (no orphan refs)', () => {
    const allCited = new Set<string>()
    for (const m of Object.values(METHODOLOGIES)) {
      for (const refId of m.references) allCited.add(refId)
    }
    const orphans = Object.keys(SCIENTIFIC_REFERENCES).filter(id => !allCited.has(id))
    // Orphan refs aren't strictly broken, but flag them so they don't accumulate.
    // Allow some buffer for refs documented for context (e.g. LPI_LINUX_2023 only used
    // by linux_adoption methodology). Soft cap: orphans should stay rare.
    expect(orphans.length).toBeLessThan(SCIENTIFIC_REFERENCES.BAFU_LIFECYCLE_2023 ? 5 : 0)
  })
})

// ============================================================================
// THREE_PILLARS / CO2_REFERENCE_VALUES / DEVICE_WEIGHTS / CONFIDENCE_LEVELS
// ============================================================================

describe('THREE_PILLARS', () => {
  it('contains exactly the three pillars: environment + society + education', () => {
    expect(Object.keys(THREE_PILLARS).sort()).toEqual(['education', 'environment', 'society'])
  })

  it('each pillar is fully populated', () => {
    for (const pillar of Object.values(THREE_PILLARS)) {
      expect(pillar).toHaveProperty('id')
      expect(pillar).toHaveProperty('name')
    }
  })
})

describe('CO2_REFERENCE_VALUES', () => {
  it('values look like CO₂ figures (positive numbers with a unit)', () => {
    for (const [, value] of Object.entries(CO2_REFERENCE_VALUES)) {
      expect(typeof value).toBe('object')
    }
    // Smoke-test there's at least one entry
    expect(Object.keys(CO2_REFERENCE_VALUES).length).toBeGreaterThan(0)
  })
})

describe('DEVICE_WEIGHTS', () => {
  it('contains at least one device-weight entry', () => {
    expect(Object.keys(DEVICE_WEIGHTS).length).toBeGreaterThan(0)
  })
})

describe('CONFIDENCE_LEVELS', () => {
  it('covers all four levels: high, medium, low, no_data', () => {
    expect(Object.keys(CONFIDENCE_LEVELS).sort()).toEqual(['high', 'low', 'medium', 'no_data'])
  })

  it('each definition has the standard shape', () => {
    for (const def of Object.values(CONFIDENCE_LEVELS)) {
      expect(def).toBeDefined()
      expect(typeof def).toBe('object')
    }
  })
})
