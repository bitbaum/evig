/**
 * Tests for data/history.ts — organizational history and milestone helpers.
 *
 * Mission-relevant: the Geschichte page shows Revamp-IT's history timeline.
 * If getHighlightedMilestones() returns [], the timeline shows no featured
 * milestones. getMilestonesInRange() drives the year-filter UI.
 *
 * Behaviors locked:
 *   getHighlightedMilestones
 *   - returns only milestones where highlight=true
 *   - returns non-empty array (key moments exist)
 *
 *   getMilestonesByType
 *   - returns only milestones matching type
 *   - founding type has at least one entry
 *
 *   getMilestonesInRange
 *   - returns milestones within the given year range (inclusive)
 *   - returns empty array when no milestones in range
 */

jest.mock('server-only', () => ({}))

jest.mock('@/lib/org-numbers.defaults', () => ({
  getDefaultNumeric: jest.fn((key: string) => {
    if (key === 'team_size_community') return 30
    if (key === 'founding_year') return 2003
    return 0
  }),
  getDefaultValue: jest.fn((_key: string) => '1000+'),
}))

jest.mock('@/config/org', () => ({
  ORG: { name: 'Revamp-IT', foundingYear: 2003, emailDomain: 'revamp-it.ch' },
  LOCATIONS: {
    store: { street: 'Teststrasse 1', full: 'Teststrasse 1, 8000 Zürich' },
    warehouse: { street: 'Lagerstrasse 2' },
  },
}))

import {
  getHighlightedMilestones,
  getMilestonesByType,
  getMilestonesInRange,
  HISTORY_CONFIG,
} from '../history'

// ============================================================================
// getHighlightedMilestones
// ============================================================================

describe('getHighlightedMilestones', () => {
  it('returns only milestones with highlight=true', () => {
    const milestones = getHighlightedMilestones()
    for (const m of milestones) {
      expect(m.highlight).toBe(true)
    }
  })

  it('returns non-empty array (key moments exist)', () => {
    expect(getHighlightedMilestones().length).toBeGreaterThan(0)
  })

  it('is subset of all milestones', () => {
    const highlighted = getHighlightedMilestones()
    for (const m of highlighted) {
      expect(HISTORY_CONFIG.milestones).toContain(m)
    }
  })
})

// ============================================================================
// getMilestonesByType
// ============================================================================

describe('getMilestonesByType', () => {
  it('returns only milestones matching "founding" type', () => {
    const founding = getMilestonesByType('founding')
    for (const m of founding) {
      expect(m.type).toBe('founding')
    }
  })

  it('has at least one founding milestone', () => {
    expect(getMilestonesByType('founding').length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown type', () => {
    // @ts-expect-error testing unknown type
    expect(getMilestonesByType('unknown_type')).toEqual([])
  })

  it('all milestone types return valid data when known', () => {
    for (const type of ['founding', 'growth', 'achievement', 'expansion', 'community'] as const) {
      const results = getMilestonesByType(type)
      expect(Array.isArray(results)).toBe(true)
    }
  })
})

// ============================================================================
// getMilestonesInRange
// ============================================================================

describe('getMilestonesInRange', () => {
  it('returns milestones within the year range (inclusive)', () => {
    const results = getMilestonesInRange(2000, 2010)
    for (const m of results) {
      expect(m.year).toBeGreaterThanOrEqual(2000)
      expect(m.year).toBeLessThanOrEqual(2010)
    }
  })

  it('includes milestones at the boundary years', () => {
    const allYears = HISTORY_CONFIG.milestones.map(m => m.year)
    const minYear = Math.min(...allYears)
    const maxYear = Math.max(...allYears)
    const full = getMilestonesInRange(minYear, maxYear)
    expect(full.length).toBe(HISTORY_CONFIG.milestones.length)
  })

  it('returns non-empty array when milestones exist in range', () => {
    expect(getMilestonesInRange(2003, 2024).length).toBeGreaterThan(0)
  })

  it('returns empty array when no milestones in range', () => {
    expect(getMilestonesInRange(1900, 1990)).toEqual([])
  })
})
