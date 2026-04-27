/**
 * Tests for data/impact-metrics.ts — impact metric lookup helpers.
 *
 * Mission-relevant: the impact/analyse page shows Revamp-IT's environmental
 * and social impact numbers. If getMetricsByCategory('environmental') returns
 * [], the page shows no environmental KPIs.
 *
 * Behaviors locked:
 *   getCompactMetrics
 *   - returns array of value/label pairs using provided label strings
 *   - all items have truthy value and label
 *
 *   getMetricsByCategory
 *   - returns only metrics matching the given category
 *   - environmental category has at least one entry
 *
 *   getEnvironmentalSummary
 *   - returns object with devicesSaved, co2SavedTons, etc.
 *   - all numeric values are positive
 *
 *   getSocialSummary
 *   - returns object with peopleTrained, internshipSuccessRate, etc.
 *
 *   getFormattedAddress
 *   - returns non-empty string containing city and address
 */

jest.mock('server-only', () => ({}))

jest.mock('@/lib/org-numbers.defaults', () => ({
  getDefaultNumeric: jest.fn((key: string) => {
    const defaults: Record<string, number> = {
      devices_sold_per_year: 150,
      device_lifespan_extension_years: 5,
      reuse_rate: 75,
      annual_people_trained: 20,
      internship_success_rate: 40,
      annual_career_reentries: 4,
      co2_production_new_laptop: 350,
      co2_refurbishment: 65,
      co2_savings_per_device: 285,
      avg_device_weight_kg: 5,
      annual_co2_saved_tons: 43,
    }
    return defaults[key] ?? 0
  }),
}))

jest.mock('@/config/org', () => ({
  ORG: { name: 'Revamp-IT', foundingYear: 2003, emailDomain: 'revamp-it.ch' },
  LOCATIONS: {
    store: {
      street: 'Teststrasse 1',
      city: 'Zürich',
      postalCode: '8005',
      country: 'Schweiz',
      full: 'Teststrasse 1, 8005 Zürich',
    },
    warehouse: { street: 'Lagerstrasse 2' },
  },
}))

import {
  getCompactMetrics,
  getMetricsByCategory,
  getEnvironmentalSummary,
  getSocialSummary,
  getFormattedAddress,
  IMPACT_METRICS,
} from '../impact-metrics'

// ============================================================================
// getCompactMetrics
// ============================================================================

describe('getCompactMetrics', () => {
  const labels = {
    devicesRescued: 'Geräte',
    peopleTrained: 'Ausgebildet',
    reuseRate: 'Wiederverwendung',
    lifespanExtension: 'Jahre länger',
    internshipSuccess: 'Praktika',
    careerReentries: 'Wiedereinstiege',
  }

  it('returns an array of 6 items', () => {
    expect(getCompactMetrics(labels)).toHaveLength(6)
  })

  it('all items have truthy value and label', () => {
    for (const item of getCompactMetrics(labels)) {
      expect(item.value).toBeTruthy()
      expect(item.label).toBeTruthy()
    }
  })

  it('labels match the provided label strings', () => {
    const metrics = getCompactMetrics(labels)
    const labelValues = metrics.map(m => m.label)
    expect(labelValues).toContain(labels.devicesRescued)
    expect(labelValues).toContain(labels.peopleTrained)
  })
})

// ============================================================================
// getMetricsByCategory
// ============================================================================

describe('getMetricsByCategory', () => {
  it('returns only environmental metrics', () => {
    const metrics = getMetricsByCategory('environmental')
    for (const m of metrics) {
      expect(m.category).toBe('environmental')
    }
  })

  it('has at least one environmental metric', () => {
    expect(getMetricsByCategory('environmental').length).toBeGreaterThan(0)
  })

  it('returns only social metrics', () => {
    const metrics = getMetricsByCategory('social')
    for (const m of metrics) {
      expect(m.category).toBe('social')
    }
  })

  it('returns empty array for unknown category', () => {
    // @ts-expect-error testing unknown category
    expect(getMetricsByCategory('unknown_cat')).toEqual([])
  })
})

// ============================================================================
// getEnvironmentalSummary
// ============================================================================

describe('getEnvironmentalSummary', () => {
  it('returns object with expected keys', () => {
    const summary = getEnvironmentalSummary()
    expect(typeof summary.devicesSaved).toBe('number')
    expect(typeof summary.co2SavedTons).toBe('number')
    expect(typeof summary.ewastePreventedTons).toBe('number')
    expect(typeof summary.reuseRate).toBe('number')
  })

  it('devicesSaved matches mock value (150)', () => {
    expect(getEnvironmentalSummary().devicesSaved).toBe(150)
  })

  it('reuseRate is between 0 and 1 (fraction of percent)', () => {
    const rate = getEnvironmentalSummary().reuseRate
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThanOrEqual(1)
  })
})

// ============================================================================
// getSocialSummary
// ============================================================================

describe('getSocialSummary', () => {
  it('returns object with expected keys', () => {
    const summary = getSocialSummary()
    expect(typeof summary.peopleTrained).toBe('number')
    expect(typeof summary.internshipSuccessRate).toBe('number')
    expect(typeof summary.careerReentries).toBe('number')
  })

  it('internshipSuccessRate is between 0 and 1', () => {
    const rate = getSocialSummary().internshipSuccessRate
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThanOrEqual(1)
  })
})

// ============================================================================
// getFormattedAddress
// ============================================================================

describe('getFormattedAddress', () => {
  it('returns a non-empty string', () => {
    const addr = getFormattedAddress()
    expect(typeof addr).toBe('string')
    expect(addr.length).toBeGreaterThan(0)
  })

  it('contains the mocked city "Zürich"', () => {
    expect(getFormattedAddress()).toContain('Zürich')
  })

  it('contains street address', () => {
    expect(getFormattedAddress()).toContain('Teststrasse')
  })
})
