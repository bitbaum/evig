/**
 * Tests for estimateCO2Savings in config/co2-impact.ts
 *
 * CO2 savings appear on every product listing — wrong values mislead
 * users. The implementation prefers a per-category cited override
 * (Circular Computing for laptops) and falls back to weight × per-kg
 * factor for other categories, then rounds to the nearest 5 kg (under
 * 100) or 10 kg (>= 100). The cited source chain lives in
 * org-numbers.defaults.ts → /transparenz/co2.
 */

import {
  estimateCO2Savings,
  estimateCO2Source,
  CO2_PER_KG,
  CATEGORY_WEIGHT_KG,
  CATEGORY_CO2_KG_OVERRIDE,
  AVG_DEVICE_WEIGHT_KG,
  FALLBACK_DEVICE_WEIGHT_KG,
} from '../co2-impact'

/** Recompute the expected value using the same rules as the production code. */
function expected(category: string): number | null {
  const direct = CATEGORY_CO2_KG_OVERRIDE[category]
  const raw = direct ?? (CATEGORY_WEIGHT_KG[category] ?? 0) * CO2_PER_KG
  if (raw <= 0) return null
  const step = raw < 100 ? 5 : 10
  return Math.round(raw / step) * step
}

// ============================================================================
// Known categories — exact values
// ============================================================================

describe('estimateCO2Savings — known categories', () => {
  it('laptops (10) → 290 (Circular Computing override: 285 → step 10 → 290)', () => {
    expect(estimateCO2Savings('10')).toBe(290)
  })

  it('desktop PCs (20) → 460 (8 × 57 = 456 → step 10 → 460)', () => {
    expect(estimateCO2Savings('20')).toBe(460)
  })

  it('monitors (30) → 290 (5 × 57 = 285 → step 10 → 290)', () => {
    expect(estimateCO2Savings('30')).toBe(290)
  })

  it('tablets (40) → 30 (0.5 × 57 = 28.5 → step 5 → 30)', () => {
    expect(estimateCO2Savings('40')).toBe(30)
  })

  it('smartphones (50) → 10 (0.2 × 57 = 11.4 → step 5 → 10)', () => {
    expect(estimateCO2Savings('50')).toBe(10)
  })

  it('printers/scanners (60) → 340 (6 × 57 = 342 → step 10 → 340)', () => {
    expect(estimateCO2Savings('60')).toBe(340)
  })

  it('mini PCs (204) → 85 (1.5 × 57 = 85.5 → step 5 → 85)', () => {
    expect(estimateCO2Savings('204')).toBe(85)
  })
})

// ============================================================================
// Sub-categories
// ============================================================================

describe('estimateCO2Savings — sub-categories', () => {
  it('business laptops (101) → 290 (override 285 → 290)', () => {
    expect(estimateCO2Savings('101')).toBe(290)
  })

  it('gaming PCs (202) → 680 (12 × 57 = 684 → step 10 → 680)', () => {
    expect(estimateCO2Savings('202')).toBe(680)
  })

  it('workstations (203) → 860 (15 × 57 = 855 → step 10 → 860)', () => {
    expect(estimateCO2Savings('203')).toBe(860)
  })

  it('CPUs (704) → 5 (0.05 × 57 = 2.85 → step 5 → 5)', () => {
    expect(estimateCO2Savings('704')).toBe(5)
  })

  it('RAM (702) → 5 (0.05 × 57 = 2.85 → step 5 → 5)', () => {
    expect(estimateCO2Savings('702')).toBe(5)
  })
})

// ============================================================================
// estimateCO2Source — which branch fired
// ============================================================================

describe('estimateCO2Source', () => {
  it('returns "direct" when a CATEGORY_CO2_KG_OVERRIDE exists', () => {
    expect(estimateCO2Source('10')).toBe('direct')
  })

  it('returns "weight" when only CATEGORY_WEIGHT_KG provides a value', () => {
    expect(estimateCO2Source('20')).toBe('weight')
  })

  it('returns null for an unknown category', () => {
    expect(estimateCO2Source('999')).toBeNull()
  })
})

// ============================================================================
// Unknown category — returns null
// ============================================================================

describe('estimateCO2Savings — unknown category', () => {
  it('returns null for an unknown category string', () => {
    expect(estimateCO2Savings('999')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(estimateCO2Savings('')).toBeNull()
  })

  it('returns null for a non-numeric string', () => {
    expect(estimateCO2Savings('laptop')).toBeNull()
  })
})

// ============================================================================
// Math correctness — every known category matches the canonical formula
// ============================================================================

describe('estimateCO2Savings — math', () => {
  it('result matches the override-or-weight formula for every known category', () => {
    for (const category of Object.keys(CATEGORY_WEIGHT_KG)) {
      expect(estimateCO2Savings(category)).toBe(expected(category))
    }
  })

  it('always returns a non-negative integer for known categories', () => {
    for (const category of Object.keys(CATEGORY_WEIGHT_KG)) {
      const result = estimateCO2Savings(category)
      expect(result).not.toBeNull()
      expect(Number.isInteger(result)).toBe(true)
      expect(result!).toBeGreaterThanOrEqual(0)
    }
  })

  it('CO2_PER_KG matches the cited factor in org-numbers.defaults.ts', () => {
    // Value is sourced from org-numbers.defaults.ts (co2_factor_per_kg_device).
    // The test pins it to the current value; if the cited source updates,
    // both the SSOT and this test must move together.
    expect(CO2_PER_KG).toBe(57)
  })

  it('AVG_DEVICE_WEIGHT_KG is 2.5 (used for shop sales + e-waste totals)', () => {
    expect(AVG_DEVICE_WEIGHT_KG).toBe(2.5)
  })

  it('FALLBACK_DEVICE_WEIGHT_KG matches laptop category weight', () => {
    expect(FALLBACK_DEVICE_WEIGHT_KG).toBe(CATEGORY_WEIGHT_KG['10'])
  })
})
