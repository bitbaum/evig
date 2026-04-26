/**
 * Tests for Hirn financial analysis (lib/hirn/data/analysis.ts).
 *
 * The 4 exported functions power the impact-dashboard insights cards:
 *   - compareYears: year-over-year comparison + insight generation
 *   - analyzeSeasonality: strong/weak month detection
 *   - generateYearInsights: single-year self-financing/mix assessment
 *   - calculateRunRate: end-of-year projection from partial data
 *
 * Pure transformations on YearlyAggregation. Tests assert insight ids
 * and direction sentinels — they must remain stable because the
 * dashboard renders them directly into UI cards.
 */

import {
  compareYears,
  analyzeSeasonality,
  generateYearInsights,
  calculateRunRate,
} from '../analysis'
import type {
  YearlyAggregation,
  TracedValue,
  MonthlyData,
} from '../financial-loader'

// ============================================================================
// Test fixture builders
// ============================================================================

const sourceStub = {
  filePath: 'fake.json',
  accountCode: 'X',
  accountName: 'X',
  importedAt: '2026-01-01T00:00:00Z',
  sourceFile: 'fake.json',
}

function tv<T>(value: T): TracedValue<T> {
  return { value, source: sourceStub }
}

function buildMonth(month: number, total: number): MonthlyData {
  return {
    month,
    monthName: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][month - 1],
    total: tv(total),
    warenverkauf: tv(total * 0.5),
    dienstleistungen: tv(total * 0.3),
    integration: tv(total * 0.1),
    spenden: tv(total * 0.1),
    aufstockung: tv(0),
  }
}

interface BuildYearOpts {
  year?: number
  total?: number
  warenverkauf?: number
  dienstleistungen?: number
  integration?: number
  spenden?: number
  aufstockung?: number
  eigenfinanzierungPct?: number
  monthsAvailable?: number
  monthlyTotals?: number[]
}

function buildYear(opts: BuildYearOpts = {}): YearlyAggregation {
  const total = opts.total ?? 100_000
  const monthlyTotals = opts.monthlyTotals ?? Array(12).fill(total / 12)
  const monthsAvailable = opts.monthsAvailable ?? 12

  return {
    year: opts.year ?? 2025,
    metadata: {
      source: 'test',
      importedAt: '2026-01-01T00:00:00Z',
      filePath: 'test.json',
      monthsAvailable,
    },
    totals: {
      total: tv(total),
      warenverkauf: tv(opts.warenverkauf ?? total * 0.5),
      dienstleistungen: tv(opts.dienstleistungen ?? total * 0.3),
      integration: tv(opts.integration ?? total * 0.05),
      spenden: tv(opts.spenden ?? total * 0.15),
      aufstockung: tv(opts.aufstockung ?? 0),
    },
    monthly: monthlyTotals.map((t, i) => buildMonth(i + 1, t)),
    derived: {
      eigenfinanzierungPct: tv(opts.eigenfinanzierungPct ?? 75),
      monthlyAvg: tv(total / 12),
      earnedTotal: tv(total * 0.85),
      donationsTotal: tv(total * 0.15),
    },
  }
}

// ============================================================================
// compareYears — totalChange direction
// ============================================================================

describe('compareYears — totalChange', () => {
  it('returns "up" when current > previous by > 5%', () => {
    const result = compareYears(buildYear({ total: 110_000 }), buildYear({ total: 100_000 }))
    expect(result.totalChange.direction).toBe('up')
    expect(result.totalChange.percentChange).toBe(10)
  })

  it('returns "down" when current < previous by > 5%', () => {
    const result = compareYears(buildYear({ total: 80_000 }), buildYear({ total: 100_000 }))
    expect(result.totalChange.direction).toBe('down')
    expect(result.totalChange.percentChange).toBe(-20)
  })

  it('returns "stable" within ±5% band', () => {
    const result = compareYears(buildYear({ total: 103_000 }), buildYear({ total: 100_000 }))
    expect(result.totalChange.direction).toBe('stable')
  })

  it('handles previous=0 gracefully (uses 100% if current>0, else 0)', () => {
    const upFromZero = compareYears(buildYear({ total: 50_000 }), buildYear({ total: 0 }))
    expect(upFromZero.totalChange.percentChange).toBe(100)

    const flatZero = compareYears(buildYear({ total: 0 }), buildYear({ total: 0 }))
    expect(flatZero.totalChange.percentChange).toBe(0)
  })

  it('rounds percentChange to 1 decimal', () => {
    const result = compareYears(buildYear({ total: 113_456 }), buildYear({ total: 100_000 }))
    // 13.456% → rounded to 13.5
    expect(result.totalChange.percentChange).toBe(13.5)
  })
})

// ============================================================================
// compareYears — insight generation
// ============================================================================

describe('compareYears — insights', () => {
  it('emits "total_growth" insight for an "up" year (low priority for moderate growth)', () => {
    const result = compareYears(buildYear({ total: 110_000 }), buildYear({ total: 100_000 }))
    const insight = result.insights.find(i => i.id === 'total_growth')
    expect(insight).toBeDefined()
    expect(insight?.type).toBe('positive')
    expect(insight?.priority).toBe('low')
  })

  it('flags strong growth (> 20%) with medium priority', () => {
    const result = compareYears(buildYear({ total: 130_000 }), buildYear({ total: 100_000 }))
    const insight = result.insights.find(i => i.id === 'total_growth')
    expect(insight?.priority).toBe('medium')
    expect(insight?.title).toContain('Stark')
  })

  it('emits "total_decline" warning for a "down" year (high priority)', () => {
    const result = compareYears(buildYear({ total: 80_000 }), buildYear({ total: 100_000 }))
    const insight = result.insights.find(i => i.id === 'total_decline')
    expect(insight).toBeDefined()
    expect(insight?.type).toBe('warning')
    expect(insight?.priority).toBe('high')
  })

  it('emits "self_financing_change" only when delta > 3 percentage points', () => {
    const small = compareYears(
      buildYear({ eigenfinanzierungPct: 76 }),
      buildYear({ eigenfinanzierungPct: 75 }),
    )
    expect(small.insights.find(i => i.id === 'self_financing_change')).toBeUndefined()

    const big = compareYears(
      buildYear({ eigenfinanzierungPct: 80 }),
      buildYear({ eigenfinanzierungPct: 75 }),
    )
    expect(big.insights.find(i => i.id === 'self_financing_change')).toBeDefined()
  })

  it('emits "services_growth" when dienstleistungen grew > 10%', () => {
    const current = buildYear({ total: 100_000, dienstleistungen: 40_000 })
    const previous = buildYear({ total: 100_000, dienstleistungen: 30_000 })
    const result = compareYears(current, previous)
    expect(result.insights.find(i => i.id === 'services_growth')).toBeDefined()
  })

  it('emits "products_decline" warning when warenverkauf dropped > 15%', () => {
    const current = buildYear({ total: 100_000, warenverkauf: 30_000 })
    const previous = buildYear({ total: 100_000, warenverkauf: 50_000 })
    const result = compareYears(current, previous)
    const insight = result.insights.find(i => i.id === 'products_decline')
    expect(insight).toBeDefined()
    expect(insight?.priority).toBe('high')
  })

  it('emits "integration_zero" when current has no integration income but previous did', () => {
    const current = buildYear({ integration: 0 })
    const previous = buildYear({ integration: 5_000 })
    const result = compareYears(current, previous)
    expect(result.insights.find(i => i.id === 'integration_zero')).toBeDefined()
  })
})

// ============================================================================
// analyzeSeasonality
// ============================================================================

describe('analyzeSeasonality', () => {
  it('flags strong + weak months when seasonality is clear', () => {
    // 4 strong months (12000) + 4 weak months (3000) + 4 average months (7500)
    const monthlyTotals = [12_000, 12_000, 12_000, 12_000, 7_500, 7_500, 7_500, 7_500, 3_000, 3_000, 3_000, 3_000]
    const result = analyzeSeasonality(buildYear({ monthlyTotals }))
    expect(result.strongMonths.length).toBeGreaterThan(0)
    expect(result.weakMonths.length).toBeGreaterThan(0)
    expect(result.confidence).not.toBe('low') // detected pattern
  })

  it('returns low confidence when months are roughly equal', () => {
    const monthlyTotals = Array(12).fill(8_000)
    const result = analyzeSeasonality(buildYear({ monthlyTotals }))
    expect(result.strongMonths).toEqual([])
    expect(result.weakMonths).toEqual([])
    expect(result.confidence).toBe('low')
  })

  it('strongMonths contains month numbers (1..12), not array indices', () => {
    const monthlyTotals = [20_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000]
    const result = analyzeSeasonality(buildYear({ monthlyTotals }))
    expect(result.strongMonths).toContain(1) // January = month 1, not index 0
  })
})

// ============================================================================
// generateYearInsights
// ============================================================================

describe('generateYearInsights', () => {
  it('emits "high_self_financing" (positive) when eigenfinanzierungPct ≥ 70', () => {
    const insights = generateYearInsights(buildYear({ eigenfinanzierungPct: 75 }))
    const hi = insights.find(i => i.id === 'high_self_financing')
    expect(hi).toBeDefined()
    expect(hi?.type).toBe('positive')
  })

  it('emits "medium_self_financing" (neutral) when 50 ≤ pct < 70', () => {
    const insights = generateYearInsights(buildYear({ eigenfinanzierungPct: 60 }))
    expect(insights.find(i => i.id === 'medium_self_financing')).toBeDefined()
    expect(insights.find(i => i.id === 'high_self_financing')).toBeUndefined()
  })

  it('emits "low_self_financing" (warning, high priority) when pct < 50', () => {
    const insights = generateYearInsights(buildYear({ eigenfinanzierungPct: 30 }))
    const low = insights.find(i => i.id === 'low_self_financing')
    expect(low?.type).toBe('warning')
    expect(low?.priority).toBe('high')
  })

  it('always emits the "monthly_avg" neutral insight', () => {
    const insights = generateYearInsights(buildYear())
    expect(insights.find(i => i.id === 'monthly_avg')).toBeDefined()
  })

  it('emits "zero_months" warning when at least one monthly total ≤ 0', () => {
    const monthlyTotals = [10_000, 10_000, 0, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000]
    const insights = generateYearInsights(buildYear({ monthlyTotals }))
    expect(insights.find(i => i.id === 'zero_months')).toBeDefined()
  })

  it('emits "product_heavy" when warenverkauf > 60% of total', () => {
    const insights = generateYearInsights(buildYear({ total: 100_000, warenverkauf: 70_000 }))
    expect(insights.find(i => i.id === 'product_heavy')).toBeDefined()
  })

  it('emits "service_heavy" (positive) when dienstleistungen > 50% of total', () => {
    const insights = generateYearInsights(buildYear({ total: 100_000, dienstleistungen: 55_000, warenverkauf: 30_000 }))
    expect(insights.find(i => i.id === 'service_heavy')).toBeDefined()
  })

  it('emits "high_donations_share" warning when spenden > 40% of total', () => {
    const insights = generateYearInsights(buildYear({ total: 100_000, spenden: 50_000, warenverkauf: 30_000, dienstleistungen: 20_000 }))
    expect(insights.find(i => i.id === 'high_donations_share')).toBeDefined()
  })

  it('emits "no_integration" when integration income is exactly 0', () => {
    const insights = generateYearInsights(buildYear({ integration: 0 }))
    expect(insights.find(i => i.id === 'no_integration')).toBeDefined()
  })

  it('does NOT emit revenue-mix insights when total is 0', () => {
    const insights = generateYearInsights(buildYear({ total: 0, eigenfinanzierungPct: 0 }))
    // mix-related insights are gated by `total > 0`
    expect(insights.find(i => i.id === 'product_heavy')).toBeUndefined()
    expect(insights.find(i => i.id === 'service_heavy')).toBeUndefined()
  })
})

// ============================================================================
// calculateRunRate
// ============================================================================

describe('calculateRunRate', () => {
  it('projects annual = (total / monthsAvailable) × 12', () => {
    const result = calculateRunRate(buildYear({ total: 90_000, monthsAvailable: 9 }))
    // 90000 / 9 × 12 = 120000
    expect(result.projectedAnnual).toBe(120_000)
  })

  it('returns confidence "high" with ≥ 9 months of data', () => {
    expect(calculateRunRate(buildYear({ monthsAvailable: 9 })).confidence).toBe('high')
    expect(calculateRunRate(buildYear({ monthsAvailable: 12 })).confidence).toBe('high')
  })

  it('returns confidence "medium" with 6–8 months of data', () => {
    expect(calculateRunRate(buildYear({ monthsAvailable: 6 })).confidence).toBe('medium')
    expect(calculateRunRate(buildYear({ monthsAvailable: 8 })).confidence).toBe('medium')
  })

  it('returns confidence "low" with 3–5 months of data', () => {
    expect(calculateRunRate(buildYear({ monthsAvailable: 3 })).confidence).toBe('low')
    expect(calculateRunRate(buildYear({ monthsAvailable: 5 })).confidence).toBe('low')
  })

  it('returns 0 + low confidence when fewer than 3 months of data', () => {
    const result = calculateRunRate(buildYear({ monthsAvailable: 2 }))
    expect(result.projectedAnnual).toBe(0)
    expect(result.confidence).toBe('low')
    expect(result.formula).toContain('Zu wenige Daten')
  })

  it('rounds the projection to an integer', () => {
    const result = calculateRunRate(buildYear({ total: 100_001, monthsAvailable: 11 }))
    expect(Number.isInteger(result.projectedAnnual)).toBe(true)
  })
})
