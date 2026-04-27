/**
 * Tests for config/analyse/metrics.ts — impact metric lookup helpers.
 *
 * Mission-relevant: the analyse section shows Revamp-IT's social and
 * environmental impact. If getMetricsByCategory('environmental') returns [],
 * the impact dashboard shows no environmental KPIs.
 *
 * Behaviors locked:
 *   getMetricsByCategory
 *   - returns non-empty array for known category (financial, environmental)
 *   - all returned metrics have matching category
 *   - returns empty array for unknown category
 *
 *   getMetricsByStatus
 *   - returns metrics for known status ('available', 'needs_data')
 *   - all returned metrics have matching status
 *
 *   getMissingDataMetrics
 *   - returns only metrics with status 'needs_data'
 *
 *   getMetricsByResponsibleTeam
 *   - returns an object grouped by team name
 *   - each group contains only needs_data metrics
 */

import {
  getMetricsByCategory,
  getMetricsByStatus,
  getMissingDataMetrics,
  getMetricsByResponsibleTeam,
  METRICS,
  CATEGORY_LABELS,
} from '../metrics'

// ============================================================================
// getMetricsByCategory
// ============================================================================

describe('getMetricsByCategory', () => {
  it('returns non-empty array for "financial" category', () => {
    const metrics = getMetricsByCategory('financial')
    expect(metrics.length).toBeGreaterThan(0)
  })

  it('returns non-empty array for "environmental" category', () => {
    const metrics = getMetricsByCategory('environmental')
    expect(metrics.length).toBeGreaterThan(0)
  })

  it('all returned metrics belong to the requested category', () => {
    const metrics = getMetricsByCategory('financial')
    for (const m of metrics) {
      expect(m.category).toBe('financial')
    }
  })

  it('returns empty array for unknown category', () => {
    // @ts-expect-error testing unknown category
    expect(getMetricsByCategory('unknown_cat')).toEqual([])
  })
})

// ============================================================================
// getMetricsByStatus
// ============================================================================

describe('getMetricsByStatus', () => {
  it('returns non-empty array for "available" status', () => {
    const metrics = getMetricsByStatus('available')
    expect(metrics.length).toBeGreaterThan(0)
  })

  it('all returned metrics have the requested status', () => {
    const metrics = getMetricsByStatus('available')
    for (const m of metrics) {
      expect(m.status).toBe('available')
    }
  })

  it('returns empty array for unknown status', () => {
    // @ts-expect-error testing unknown status
    expect(getMetricsByStatus('unknown_status')).toEqual([])
  })
})

// ============================================================================
// getMissingDataMetrics
// ============================================================================

describe('getMissingDataMetrics', () => {
  it('all returned metrics have status "needs_data"', () => {
    const missing = getMissingDataMetrics()
    for (const m of missing) {
      expect(m.status).toBe('needs_data')
    }
  })

  it('is consistent with getMetricsByStatus("needs_data")', () => {
    expect(getMissingDataMetrics()).toEqual(getMetricsByStatus('needs_data'))
  })
})

// ============================================================================
// getMetricsByResponsibleTeam
// ============================================================================

describe('getMetricsByResponsibleTeam', () => {
  it('returns an object', () => {
    expect(typeof getMetricsByResponsibleTeam()).toBe('object')
  })

  it('each group contains only needs_data metrics', () => {
    const grouped = getMetricsByResponsibleTeam()
    for (const metrics of Object.values(grouped)) {
      for (const m of metrics) {
        expect(m.status).toBe('needs_data')
      }
    }
  })
})

// ============================================================================
// CATEGORY_LABELS
// ============================================================================

describe('CATEGORY_LABELS', () => {
  it('has label for financial', () => {
    expect(CATEGORY_LABELS.financial).toBe('Finanzen')
  })

  it('has label for environmental', () => {
    expect(CATEGORY_LABELS.environmental).toBe('Umwelt')
  })

  it('has label for social', () => {
    expect(CATEGORY_LABELS.social).toBe('Soziales')
  })
})
