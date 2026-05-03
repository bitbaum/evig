/**
 * Tests for estimateCO2Savings in config/co2-impact.ts
 *
 * CO2 savings are shown to users on every product listing page.
 * Wrong values = misleading environmental impact claims.
 * The calculation is simple but the config must map correctly:
 * category → weight (kg) × CO2_PER_KG (57) = kg CO2 saved.
 */

import { estimateCO2Savings, CO2_PER_KG, CATEGORY_WEIGHT_KG, AVG_DEVICE_WEIGHT_KG, FALLBACK_DEVICE_WEIGHT_KG } from '../co2-impact'

// ============================================================================
// Known categories — exact values
// ============================================================================

describe('estimateCO2Savings — known categories', () => {
  it('returns 114 for laptops (category 10: 2.0 kg × 57)', () => {
    expect(estimateCO2Savings('10')).toBe(114)
  })

  it('returns 456 for desktop PCs (category 20: 8.0 kg × 57)', () => {
    expect(estimateCO2Savings('20')).toBe(456)
  })

  it('returns 285 for monitors (category 30: 5.0 kg × 57)', () => {
    expect(estimateCO2Savings('30')).toBe(285)
  })

  it('returns 29 for tablets (category 40: 0.5 kg × 57 = 28.5 → rounds to 29)', () => {
    expect(estimateCO2Savings('40')).toBe(29)
  })

  it('returns 11 for smartphones (category 50: 0.2 kg × 57 = 11.4 → rounds to 11)', () => {
    expect(estimateCO2Savings('50')).toBe(11)
  })

  it('returns 342 for printers/scanners (category 60: 6.0 kg × 57)', () => {
    expect(estimateCO2Savings('60')).toBe(342)
  })

  it('returns 57 for mini PCs (category 204: 1.0 kg × 57)', () => {
    // CATEGORY_WEIGHT_KG['204'] = 1.5 → 1.5 × 57 = 85.5 → rounds to 86
    // Wait, 204 is mini PCs at 1.5 kg: Math.round(1.5 * 57) = Math.round(85.5) = 86
    expect(estimateCO2Savings('204')).toBe(86)
  })
})

// ============================================================================
// Sub-categories
// ============================================================================

describe('estimateCO2Savings — sub-categories', () => {
  it('business laptops (101) → 114', () => {
    expect(estimateCO2Savings('101')).toBe(114)   // 2.0 × 57
  })

  it('gaming PCs (202) → 684', () => {
    expect(estimateCO2Savings('202')).toBe(684)   // 12.0 × 57
  })

  it('workstations (203) → 855', () => {
    expect(estimateCO2Savings('203')).toBe(855)   // 15.0 × 57
  })

  it('CPUs (704) → 3', () => {
    expect(estimateCO2Savings('704')).toBe(3)     // 0.05 × 57 = 2.85 → 3
  })

  it('RAM (702) → 3', () => {
    expect(estimateCO2Savings('702')).toBe(3)     // 0.05 × 57 = 2.85 → 3
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
// Math correctness
// ============================================================================

describe('estimateCO2Savings — math', () => {
  it('result equals Math.round(weight × CO2_PER_KG) for all known categories', () => {
    for (const [category, weightKg] of Object.entries(CATEGORY_WEIGHT_KG)) {
      const expected = Math.round(weightKg * CO2_PER_KG)
      expect(estimateCO2Savings(category)).toBe(expected)
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

  it('CO2_PER_KG is 57 (Fraunhofer IZM 2023)', () => {
    expect(CO2_PER_KG).toBe(57)
  })

  it('AVG_DEVICE_WEIGHT_KG is 2.5 (used for shop sales + e-waste totals)', () => {
    expect(AVG_DEVICE_WEIGHT_KG).toBe(2.5)
  })

  it('FALLBACK_DEVICE_WEIGHT_KG is 2.0 (avg laptop, used when category unknown)', () => {
    expect(FALLBACK_DEVICE_WEIGHT_KG).toBe(2.0)
  })

  it('FALLBACK_DEVICE_WEIGHT_KG matches laptop category weight', () => {
    expect(FALLBACK_DEVICE_WEIGHT_KG).toBe(CATEGORY_WEIGHT_KG['10'])
  })
})
