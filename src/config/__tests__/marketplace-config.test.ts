/**
 * Tests for marketplace.ts and marketplace/condition-criteria.ts config.
 *
 * marketplace.ts: getCategoryLabel — used in P2P listing forms and
 *   category filter UI. Must fall back to raw value for unknown categories.
 *
 * condition-criteria.ts: getConditionCriteria, hasCriteriaForCategory,
 *   getConditionsWithCriteria — used to display quality guidelines
 *   when a seller lists a product. Returning null/empty for unknown inputs
 *   is load-bearing (form just shows no guidelines, not a crash).
 */

// ============================================================================
// marketplace.ts — getCategoryLabel
// ============================================================================

import {
  getCategoryLabel,
  LISTING_STATUS,
  LISTING_STATUS_CONFIG,
  MARKETPLACE_CATEGORY_LABELS as CATEGORY_LABELS,
  MARKETPLACE_CATEGORY_VALUES,
} from '../marketplace'

describe('getCategoryLabel', () => {
  it('returns a label for category "10" (Laptops)', () => {
    expect(getCategoryLabel('10')).toBe('Laptops')
  })

  it('returns "Sonstiges" for category "99"', () => {
    expect(getCategoryLabel('99')).toBe('Sonstiges')
  })

  it('returns raw value for unknown category (fallback)', () => {
    expect(getCategoryLabel('999')).toBe('999')
  })

  it('returns non-empty string for all known categories', () => {
    for (const value of Object.keys(CATEGORY_LABELS)) {
      expect(getCategoryLabel(value).length).toBeGreaterThan(0)
    }
  })

  it('all MARKETPLACE_CATEGORY_VALUES have labels', () => {
    for (const value of MARKETPLACE_CATEGORY_VALUES) {
      const label = getCategoryLabel(value)
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('LISTING_STATUS', () => {
  it('has expected status keys', () => {
    expect(LISTING_STATUS).toHaveProperty('ACTIVE')
    expect(LISTING_STATUS).toHaveProperty('SOLD')
    expect(LISTING_STATUS).toHaveProperty('DRAFT')
    expect(LISTING_STATUS).toHaveProperty('REMOVED')
  })

  it('ACTIVE value is "active"', () => {
    expect(LISTING_STATUS.ACTIVE).toBe('active')
  })

  it('SOLD value is "sold"', () => {
    expect(LISTING_STATUS.SOLD).toBe('sold')
  })
})

describe('LISTING_STATUS_CONFIG', () => {
  it('each known status has label and color', () => {
    for (const status of Object.values(LISTING_STATUS)) {
      const config = LISTING_STATUS_CONFIG[status]
      expect(config).toHaveProperty('label')
      expect(config).toHaveProperty('color')
      expect(config.label.length).toBeGreaterThan(0)
      expect(config.color.length).toBeGreaterThan(0)
    }
  })

  it('ACTIVE status has green color', () => {
    expect(LISTING_STATUS_CONFIG[LISTING_STATUS.ACTIVE].color).toContain('primary')
  })

  it('SOLD status has a distinct color from ACTIVE', () => {
    const activeColor = LISTING_STATUS_CONFIG[LISTING_STATUS.ACTIVE].color
    const soldColor = LISTING_STATUS_CONFIG[LISTING_STATUS.SOLD].color
    expect(soldColor).not.toBe(activeColor)
  })
})

// ============================================================================
// marketplace/condition-criteria.ts
// ============================================================================

import {
  getConditionCriteria,
  hasCriteriaForCategory,
  getConditionsWithCriteria,
} from '../marketplace/condition-criteria'

// ─── getConditionCriteria ─────────────────────────────────────────────────────

describe('getConditionCriteria', () => {
  it('"10" (Laptops) + "like_new" → returns criteria array', () => {
    const criteria = getConditionCriteria('10', 'like_new')
    expect(Array.isArray(criteria)).toBe(true)
    expect(criteria!.length).toBeGreaterThan(0)
  })

  it('each criterion has a text/description field', () => {
    const criteria = getConditionCriteria('10', 'like_new')
    for (const c of criteria!) {
      // Criteria have at least one string property
      expect(Object.values(c).some(v => typeof v === 'string')).toBe(true)
    }
  })

  it('unknown category → null', () => {
    expect(getConditionCriteria('999', 'like_new')).toBeNull()
  })

  it('unknown condition for known category → null', () => {
    expect(getConditionCriteria('10', 'mystery_condition')).toBeNull()
  })

  it('returns null (not undefined/empty array) for conditions without criteria', () => {
    // 'new' condition is not in the CRITERIA_MAP for category '10'
    expect(getConditionCriteria('10', 'new')).toBeNull()
  })
})

// ─── hasCriteriaForCategory ───────────────────────────────────────────────────

describe('hasCriteriaForCategory', () => {
  it('"10" (Laptops) → has criteria', () => {
    expect(hasCriteriaForCategory('10')).toBe(true)
  })

  it('unknown category "999" → false', () => {
    expect(hasCriteriaForCategory('999')).toBe(false)
  })

  it('returns a boolean', () => {
    expect(typeof hasCriteriaForCategory('10')).toBe('boolean')
  })
})

// ─── getConditionsWithCriteria ────────────────────────────────────────────────

describe('getConditionsWithCriteria', () => {
  it('"10" → returns array of condition strings', () => {
    const conditions = getConditionsWithCriteria('10')
    expect(Array.isArray(conditions)).toBe(true)
    expect(conditions.length).toBeGreaterThan(0)
  })

  it('"10" → includes "like_new"', () => {
    const conditions = getConditionsWithCriteria('10')
    expect(conditions).toContain('like_new')
  })

  it('unknown category → empty array', () => {
    expect(getConditionsWithCriteria('999')).toEqual([])
  })

  it('all returned strings are non-empty', () => {
    for (const c of getConditionsWithCriteria('10')) {
      expect(c.length).toBeGreaterThan(0)
    }
  })
})
