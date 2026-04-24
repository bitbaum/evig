/**
 * Tests for src/config/analyse/metrics.ts
 *
 * Pure filter/group functions over the METRICS config map.
 * Used in the admin transparency/impact dashboard to filter
 * metrics by category, status, and responsible team.
 */

import {
  getMetricsByCategory,
  getMetricsByStatus,
  getMissingDataMetrics,
  getMetricsByResponsibleTeam,
  METRICS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../analyse/metrics'

// ─── getMetricsByCategory ─────────────────────────────────────────────────────

describe('getMetricsByCategory', () => {
  it('returns array for "financial" category', () => {
    const metrics = getMetricsByCategory('financial')
    expect(Array.isArray(metrics)).toBe(true)
  })

  it('all returned metrics have category="financial"', () => {
    for (const m of getMetricsByCategory('financial')) {
      expect(m.category).toBe('financial')
    }
  })

  it('returns array for "environmental" category', () => {
    const metrics = getMetricsByCategory('environmental')
    expect(Array.isArray(metrics)).toBe(true)
  })

  it('all categories produce arrays (even if empty)', () => {
    for (const cat of ['financial', 'environmental', 'social', 'digital'] as const) {
      expect(Array.isArray(getMetricsByCategory(cat))).toBe(true)
    }
  })

  it('total across categories = total METRICS count', () => {
    const total = ['financial', 'environmental', 'social', 'digital']
      .reduce((sum, cat) => sum + getMetricsByCategory(cat as never).length, 0)
    expect(total).toBe(Object.keys(METRICS).length)
  })
})

// ─── getMetricsByStatus ───────────────────────────────────────────────────────

describe('getMetricsByStatus', () => {
  it('returns array for "available" status', () => {
    expect(Array.isArray(getMetricsByStatus('available'))).toBe(true)
  })

  it('returns array for "needs_data" status', () => {
    expect(Array.isArray(getMetricsByStatus('needs_data'))).toBe(true)
  })

  it('all returned metrics have matching status', () => {
    for (const m of getMetricsByStatus('available')) {
      expect(m.status).toBe('available')
    }
  })

  it('status counts sum to total METRICS count', () => {
    const statuses = ['available', 'needs_data', 'calculated'] as const
    const total = statuses.reduce((sum, s) => sum + getMetricsByStatus(s).length, 0)
    expect(total).toBe(Object.keys(METRICS).length)
  })
})

// ─── getMissingDataMetrics ────────────────────────────────────────────────────

describe('getMissingDataMetrics', () => {
  it('returns an array', () => {
    expect(Array.isArray(getMissingDataMetrics())).toBe(true)
  })

  it('all returned metrics have status="needs_data"', () => {
    for (const m of getMissingDataMetrics()) {
      expect(m.status).toBe('needs_data')
    }
  })

  it('matches getMetricsByStatus("needs_data")', () => {
    const missing = getMissingDataMetrics()
    const byStatus = getMetricsByStatus('needs_data')
    expect(missing.length).toBe(byStatus.length)
  })
})

// ─── getMetricsByResponsibleTeam ──────────────────────────────────────────────

describe('getMetricsByResponsibleTeam', () => {
  it('returns an object', () => {
    expect(typeof getMetricsByResponsibleTeam()).toBe('object')
  })

  it('each group is an array', () => {
    const grouped = getMetricsByResponsibleTeam()
    for (const group of Object.values(grouped)) {
      expect(Array.isArray(group)).toBe(true)
    }
  })

  it('all metrics in groups have status="needs_data"', () => {
    const grouped = getMetricsByResponsibleTeam()
    for (const group of Object.values(grouped)) {
      for (const m of group) {
        expect(m.status).toBe('needs_data')
      }
    }
  })

  it('total across groups matches getMissingDataMetrics() count', () => {
    const grouped = getMetricsByResponsibleTeam()
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    expect(total).toBe(getMissingDataMetrics().length)
  })
})

// ─── CATEGORY_LABELS ─────────────────────────────────────────────────────────

describe('CATEGORY_LABELS', () => {
  it('has label for all 4 categories', () => {
    expect(CATEGORY_LABELS).toHaveProperty('financial')
    expect(CATEGORY_LABELS).toHaveProperty('environmental')
    expect(CATEGORY_LABELS).toHaveProperty('social')
    expect(CATEGORY_LABELS).toHaveProperty('digital')
  })

  it('all labels are non-empty strings', () => {
    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ─── CATEGORY_COLORS ─────────────────────────────────────────────────────────

describe('CATEGORY_COLORS', () => {
  it('each category has bg, text, icon', () => {
    for (const [, colors] of Object.entries(CATEGORY_COLORS)) {
      expect(colors).toHaveProperty('bg')
      expect(colors).toHaveProperty('text')
      expect(colors).toHaveProperty('icon')
    }
  })
})
