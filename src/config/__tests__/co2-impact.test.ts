/**
 * Tests for the CO₂ SSOT in config/co2-impact.ts
 *
 * CO₂ savings appear on every product listing — wrong or uncited values
 * mislead users and destroy credibility. Model:
 *   avoided = ADEME production+distribution × (1 − REFURB_OVERHEAD_SHARE),
 *   floored to 5 kg. Categories without an open, defensible factor return
 *   null (UI hides the badge). Every factor MUST carry a citable source —
 *   the "no magic numbers" guard below ends that class.
 */

import {
  estimateCO2Savings,
  estimateCO2Source,
  co2DisplayValue,
  CATEGORY_CO2_FACTORS,
  CO2_SOURCES,
  REFURB_OVERHEAD_SHARE,
  CATEGORY_WEIGHT_KG,
  AVG_DEVICE_WEIGHT_KG,
  FALLBACK_DEVICE_WEIGHT_KG,
} from '../co2-impact'
import { KATEGORIEN } from '../erfassung/categories'

/** Recompute expected value with the same rules as production code. */
function expected(category: string): number | null {
  const factor = CATEGORY_CO2_FACTORS[category]
  if (!factor) return null
  return Math.floor((factor.newDeviceProductionKg * (1 - REFURB_OVERHEAD_SHARE)) / 5) * 5
}

describe('estimateCO2Savings — known categories', () => {
  it('laptops (10) → 150 (ADEME 182.3 × 0.85 = 154.9 → floor5)', () => {
    expect(estimateCO2Savings('10')).toBe(150)
  })

  it('desktops (20) → 170 (ADEME pro 204.8 × 0.85 = 174.1 → floor5)', () => {
    expect(estimateCO2Savings('20')).toBe(170)
  })

  it('monitors (30) → 55, tablets (40) → 70, smartphones (50) → 65, network (90) → 50', () => {
    expect(estimateCO2Savings('30')).toBe(55)
    expect(estimateCO2Savings('40')).toBe(70)
    expect(estimateCO2Savings('50')).toBe(65)
    expect(estimateCO2Savings('90')).toBe(50)
  })

  it('matches the model formula for every category with a factor', () => {
    for (const category of Object.keys(CATEGORY_CO2_FACTORS)) {
      expect(estimateCO2Savings(category)).toBe(expected(category))
    }
  })
})

describe('estimateCO2Savings — no claim without a factor', () => {
  it.each(['60', '70', '80'])('category %s (no open per-category LCA) → null', (cat) => {
    expect(estimateCO2Savings(cat)).toBeNull()
    expect(estimateCO2Source(cat)).toBeNull()
  })

  it('unknown category → null', () => {
    expect(estimateCO2Savings('unknown')).toBeNull()
    expect(estimateCO2Savings('')).toBeNull()
  })
})

describe('no magic numbers — every factor is cited and plausible', () => {
  it.each(Object.entries(CATEGORY_CO2_FACTORS))('factor %s carries a full citation', (_cat, factor) => {
    expect(factor.source.name.length).toBeGreaterThan(10)
    expect(factor.source.url).toMatch(/^(https?:\/\/|\/)/)
    expect(factor.source.year).toBeGreaterThanOrEqual(2020)
    expect(factor.ademeItem.length).toBeGreaterThan(2)
    // production is a subset of the life cycle — never more
    expect(factor.newDeviceProductionKg).toBeGreaterThan(0)
    expect(factor.newDeviceProductionKg).toBeLessThanOrEqual(factor.newDeviceLifecycleKg)
  })

  it('every CO2_SOURCES entry has name, url and year', () => {
    for (const source of Object.values(CO2_SOURCES)) {
      expect(source.name.length).toBeGreaterThan(10)
      expect(source.url).toMatch(/^(https?:\/\/|\/)/)
      expect(source.year).toBeGreaterThanOrEqual(2020)
    }
  })

  it('overhead share is a sane fraction', () => {
    expect(REFURB_OVERHEAD_SHARE).toBeGreaterThan(0)
    expect(REFURB_OVERHEAD_SHARE).toBeLessThan(0.5)
  })

  it('claims stay inside the independent Fraunhofer/refurbed band (69–91% of life cycle)', () => {
    // Corroboration guard: if a factor update pushes a claim above the
    // ISO-verified industry band, the model needs re-review, not a deploy.
    for (const factor of Object.values(CATEGORY_CO2_FACTORS)) {
      const claimed = factor.newDeviceProductionKg * (1 - REFURB_OVERHEAD_SHARE)
      const shareOfLifecycle = claimed / factor.newDeviceLifecycleKg
      expect(shareOfLifecycle).toBeLessThanOrEqual(0.91)
      expect(shareOfLifecycle).toBeGreaterThan(0.4)
    }
  })

  it('every main KATEGORIEN code either has a factor or deliberately none', () => {
    // Adding a new category forces an explicit decision here.
    const decided = new Set([...Object.keys(CATEGORY_CO2_FACTORS), '60', '70', '80'])
    for (const kat of KATEGORIEN) {
      expect(decided.has(kat.value)).toBe(true)
    }
  })
})

describe('co2DisplayValue — small totals never collapse to "0 t"', () => {
  it('below 1 t shows kg, floored to 10', () => {
    expect(co2DisplayValue(847)).toEqual({ value: 840, unit: 'kg' })
    expect(co2DisplayValue(65)).toEqual({ value: 60, unit: 'kg' })
  })

  it('at or above 1 t shows tonnes with 1 decimal', () => {
    expect(co2DisplayValue(1000)).toEqual({ value: 1, unit: 't' })
    expect(co2DisplayValue(22470)).toEqual({ value: 22.5, unit: 't' })
  })
})

describe('weight table (e-waste tonnage only)', () => {
  it('constants stay sane', () => {
    expect(AVG_DEVICE_WEIGHT_KG).toBeGreaterThan(0)
    expect(FALLBACK_DEVICE_WEIGHT_KG).toBeGreaterThan(0)
    for (const weight of Object.values(CATEGORY_WEIGHT_KG)) {
      expect(weight).toBeGreaterThan(0)
      expect(weight).toBeLessThan(50)
    }
  })
})
