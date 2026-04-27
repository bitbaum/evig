/**
 * Tests for config/marketplace/condition-criteria.ts — category-specific condition checklist.
 *
 * Mission-relevant: the sell form shows a category-specific checklist when a
 * seller selects a condition grade. If getConditionCriteria('10', 'good') returns
 * null instead of the laptop checklist, sellers don't see the grading guide and
 * submit inaccurate condition reports.
 *
 * Behaviors locked:
 *   getConditionCriteria
 *   - returns criteria array for known category+condition combo
 *   - returns null for unknown combo
 *   - each criterion has key and label
 *
 *   hasCriteriaForCategory
 *   - returns true for category with at least one condition criteria
 *   - returns false for unknown category
 *
 *   getConditionsWithCriteria
 *   - returns conditions for known category
 *   - returns empty array for unknown category
 *   - does not include conditions from other categories
 */

import {
  getConditionCriteria,
  hasCriteriaForCategory,
  getConditionsWithCriteria,
} from '../condition-criteria'

// ============================================================================
// getConditionCriteria
// ============================================================================

describe('getConditionCriteria', () => {
  it('returns criteria array for laptops + like_new', () => {
    const criteria = getConditionCriteria('10', 'like_new')
    expect(criteria).not.toBeNull()
    expect(Array.isArray(criteria)).toBe(true)
    expect(criteria!.length).toBeGreaterThan(0)
  })

  it('returns criteria array for laptops + good', () => {
    const criteria = getConditionCriteria('10', 'good')
    expect(criteria).not.toBeNull()
    expect(criteria!.length).toBeGreaterThan(0)
  })

  it('returns null for unknown category+condition combo', () => {
    expect(getConditionCriteria('99', 'good')).toBeNull()
  })

  it('returns null for condition not defined for that category', () => {
    // Desktop PCs (20) only have criteria for good+fair, not like_new
    expect(getConditionCriteria('20', 'like_new')).toBeNull()
  })

  it('each criterion has non-empty key and label', () => {
    const criteria = getConditionCriteria('10', 'good')!
    for (const c of criteria) {
      expect(typeof c.key).toBe('string')
      expect(c.key.length).toBeGreaterThan(0)
      expect(typeof c.label).toBe('string')
      expect(c.label.length).toBeGreaterThan(0)
    }
  })

  it('returns criteria for smartphones + good', () => {
    expect(getConditionCriteria('50', 'good')).not.toBeNull()
  })
})

// ============================================================================
// hasCriteriaForCategory
// ============================================================================

describe('hasCriteriaForCategory', () => {
  it('returns true for category 10 (laptops)', () => {
    expect(hasCriteriaForCategory('10')).toBe(true)
  })

  it('returns true for category 50 (smartphones)', () => {
    expect(hasCriteriaForCategory('50')).toBe(true)
  })

  it('returns false for unknown category', () => {
    expect(hasCriteriaForCategory('99')).toBe(false)
  })

  it('returns false for category 80 (peripherals — no criteria defined)', () => {
    expect(hasCriteriaForCategory('80')).toBe(false)
  })
})

// ============================================================================
// getConditionsWithCriteria
// ============================================================================

describe('getConditionsWithCriteria', () => {
  it('returns condition list for laptops (10)', () => {
    const conditions = getConditionsWithCriteria('10')
    expect(Array.isArray(conditions)).toBe(true)
    expect(conditions.length).toBeGreaterThan(0)
  })

  it('laptop conditions include "good" and "fair"', () => {
    const conditions = getConditionsWithCriteria('10')
    expect(conditions).toContain('good')
    expect(conditions).toContain('fair')
  })

  it('returns empty array for unknown category', () => {
    expect(getConditionsWithCriteria('99')).toEqual([])
  })

  it('does not include conditions from other categories', () => {
    const laptopConditions = getConditionsWithCriteria('10')
    // All returned values should be condition strings, not 'xx:condition' keys
    for (const c of laptopConditions) {
      expect(c).not.toContain(':')
    }
  })
})
