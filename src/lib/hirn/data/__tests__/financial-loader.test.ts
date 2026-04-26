/**
 * Tests for the Hirn financial data loader (lib/hirn/data/financial-loader.ts).
 *
 * Loads + aggregates Kivitendo income exports into the YearlyAggregation
 * shape consumed by the public financial-transparency dashboard. A bug
 * here means donors/funders see wrong numbers — high-stakes math:
 *
 *   - Subcategory map: products → warenverkauf, services → dienstleistungen,
 *     integration → integration, donations → spenden, price_adjustment → aufstockung
 *   - Monthly vs yearly-aggregate detection: if every record has month=0,
 *     treat as a single annual entry; otherwise group per-month
 *   - Month names: 1-indexed lookup (MONTH_NAMES[month-1]) with fallback
 *   - Derived metrics:
 *       earnedTotal     = warenverkauf + dienstleistungen + integration
 *       donationsTotal  = spenden + aufstockung
 *       eigenfinanzierungPct = earnedTotal / total × 100, gated at total>0
 *       monthlyAvg      = total / monthsAvailable, gated at monthsAvailable>0
 *   - Source tracing: every TracedValue carries filePath + accountCode +
 *     accountName + importedAt + sourceFile so the dashboard can drill down
 */

import { promises as fs } from 'fs'

import {
  loadSummary,
  loadRawIncomeData,
  loadFinancialData,
  loadAllYearsData,
  getAvailableYears,
  type IncomeFileData,
  type SummaryData,
} from '../financial-loader'

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))

const mockReadFile = fs.readFile as jest.Mock

beforeEach(() => {
  mockReadFile.mockReset()
})

// ============================================================================
// Test fixture builders
// ============================================================================

function makeRecord(overrides: {
  year?: number
  month?: number
  account_code?: string
  account_name?: string
  subcategory: 'total' | 'products' | 'services' | 'integration' | 'donations' | 'price_adjustment'
  value: number
}) {
  return {
    year: overrides.year ?? 2025,
    month: overrides.month ?? 1,
    account_code: overrides.account_code ?? '3200',
    account_name: overrides.account_name ?? 'Default Account',
    category: 'revenue' as const,
    subcategory: overrides.subcategory,
    value: overrides.value,
  }
}

/** Build a monthly file with one record per subcategory for one month */
function makeMonthlyFile(year: number, month: number, values: Record<string, number>): IncomeFileData {
  return {
    year,
    source: `revamp-info/year-${year}.json`,
    imported_at: '2026-01-15T10:00:00Z',
    data: Object.entries(values).map(([subcategory, value]) =>
      makeRecord({ year, month, subcategory: subcategory as any, value }),
    ),
  }
}

/** Build a yearly-aggregate file (every record has month=0) */
function makeYearlyAggregateFile(year: number, totals: Record<string, number>): IncomeFileData {
  return {
    year,
    source: `revamp-info/year-${year}.json`,
    imported_at: '2026-01-15T10:00:00Z',
    data: Object.entries(totals).map(([subcategory, value]) =>
      makeRecord({ year, month: 0, subcategory: subcategory as any, value }),
    ),
  }
}

// ============================================================================
// loadSummary
// ============================================================================

describe('loadSummary', () => {
  it('parses summary.json into a SummaryData object', async () => {
    const summary: SummaryData = {
      years: [2023, 2024, 2025],
      total_records: 100,
      source: 'revamp-info',
      exported_at: '2026-01-15T10:00:00Z',
      categories: ['revenue'],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(summary))

    const result = await loadSummary()

    expect(result).toEqual(summary)
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining('summary.json'), 'utf-8')
  })
})

// ============================================================================
// loadRawIncomeData
// ============================================================================

describe('loadRawIncomeData', () => {
  it('reads income_<year>.json and parses it', async () => {
    const file = makeMonthlyFile(2025, 1, { total: 1000, products: 600, services: 400 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadRawIncomeData(2025)

    expect(result).toEqual(file)
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining('income_2025.json'), 'utf-8')
  })

  it('returns null when the file does not exist (read error swallowed)', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT: no such file'))
    expect(await loadRawIncomeData(1999)).toBeNull()
  })
})

// ============================================================================
// loadFinancialData — monthly mode
// ============================================================================

describe('loadFinancialData — monthly mode', () => {
  it('returns null when the year file is missing', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'))
    expect(await loadFinancialData(1999)).toBeNull()
  })

  it('groups records by month and produces one MonthlyData entry per month', async () => {
    // Two months with all 6 subcategories
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 1, {
          total: 1000, products: 400, services: 300, integration: 100, donations: 150, price_adjustment: 50,
        }).data,
        ...makeMonthlyFile(2025, 2, {
          total: 2000, products: 800, services: 600, integration: 200, donations: 300, price_adjustment: 100,
        }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)

    expect(result).not.toBeNull()
    expect(result!.monthly).toHaveLength(2)
    expect(result!.metadata.monthsAvailable).toBe(2)
  })

  it('sorts monthly entries by month number ascending', async () => {
    // Insert months out of order (3, 1, 2)
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 3, { total: 3000 }).data,
        ...makeMonthlyFile(2025, 1, { total: 1000 }).data,
        ...makeMonthlyFile(2025, 2, { total: 2000 }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)

    expect(result!.monthly.map(m => m.month)).toEqual([1, 2, 3])
  })

  it('uses 1-indexed German month names (Jan = month 1, Mär = month 3)', async () => {
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 1, { total: 100 }).data,
        ...makeMonthlyFile(2025, 3, { total: 300 }).data,
        ...makeMonthlyFile(2025, 12, { total: 1200 }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)

    const namesByMonth = Object.fromEntries(result!.monthly.map(m => [m.month, m.monthName]))
    expect(namesByMonth[1]).toBe('Jan')
    expect(namesByMonth[3]).toBe('Mär') // umlaut, not "Maer"
    expect(namesByMonth[12]).toBe('Dez')
  })

  it('falls back to "Monat N" for out-of-range month numbers', async () => {
    const file = makeMonthlyFile(2025, 13, { total: 100 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.monthly[0].monthName).toBe('Monat 13')
  })

  it('maps each subcategory to its German field name', async () => {
    const file = makeMonthlyFile(2025, 1, {
      total: 1000,
      products: 400,         // → warenverkauf
      services: 300,         // → dienstleistungen
      integration: 100,      // → integration
      donations: 150,        // → spenden
      price_adjustment: 50,  // → aufstockung
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    const m = result!.monthly[0]

    expect(m.total.value).toBe(1000)
    expect(m.warenverkauf.value).toBe(400)
    expect(m.dienstleistungen.value).toBe(300)
    expect(m.integration.value).toBe(100)
    expect(m.spenden.value).toBe(150)
    expect(m.aufstockung.value).toBe(50)
  })

  it('fills missing subcategories with 0 and "Keine Daten" account name', async () => {
    // Month with only 'total' present — every other subcategory should be 0
    const file = makeMonthlyFile(2025, 1, { total: 1000 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    const m = result!.monthly[0]

    expect(m.warenverkauf.value).toBe(0)
    expect(m.warenverkauf.source.accountCode).toBe('N/A')
    expect(m.warenverkauf.source.accountName).toBe('Keine Daten')
    expect(m.spenden.value).toBe(0)
  })

  it('preserves account_code and account_name from the source record', async () => {
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        makeRecord({
          year: 2025, month: 1, subcategory: 'products', value: 500,
          account_code: '3200', account_name: 'Warenverkauf Erlös',
        }),
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.monthly[0].warenverkauf.source.accountCode).toBe('3200')
    expect(result!.monthly[0].warenverkauf.source.accountName).toBe('Warenverkauf Erlös')
  })

  it('sums monthly values into yearly totals correctly', async () => {
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 1, { total: 1000, products: 600, services: 400 }).data,
        ...makeMonthlyFile(2025, 2, { total: 2000, products: 1200, services: 800 }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)

    expect(result!.totals.total.value).toBe(3000)
    expect(result!.totals.warenverkauf.value).toBe(1800)
    expect(result!.totals.dienstleistungen.value).toBe(1200)
  })

  it('computes earnedTotal = warenverkauf + dienstleistungen + integration', async () => {
    const file = makeMonthlyFile(2025, 1, {
      total: 1000,
      products: 400,
      services: 300,
      integration: 100,
      donations: 150,
      price_adjustment: 50,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.derived.earnedTotal.value).toBe(800) // 400 + 300 + 100
  })

  it('computes donationsTotal = spenden + aufstockung', async () => {
    const file = makeMonthlyFile(2025, 1, {
      total: 1000, products: 400, services: 300, integration: 100,
      donations: 150, price_adjustment: 50,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.derived.donationsTotal.value).toBe(200) // 150 + 50
  })

  it('computes eigenfinanzierungPct = earnedTotal / total × 100', async () => {
    const file = makeMonthlyFile(2025, 1, {
      total: 1000,
      products: 400, services: 300, integration: 100, // earned = 800
      donations: 150, price_adjustment: 50,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.derived.eigenfinanzierungPct.value).toBe(80) // 800 / 1000 × 100
  })

  it('eigenfinanzierungPct returns 0 when total is 0 (no divide-by-zero)', async () => {
    const file = makeMonthlyFile(2025, 1, { total: 0 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.derived.eigenfinanzierungPct.value).toBe(0)
  })

  it('computes monthlyAvg = total / monthsAvailable', async () => {
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 1, { total: 1000 }).data,
        ...makeMonthlyFile(2025, 2, { total: 2000 }).data,
        ...makeMonthlyFile(2025, 3, { total: 3000 }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    // total=6000, monthsAvailable=3 → 2000
    expect(result!.derived.monthlyAvg.value).toBe(2000)
  })

  it('derived TracedValues carry "derived" accountCode + a descriptive accountName', async () => {
    const file = makeMonthlyFile(2025, 1, { total: 1000, products: 800 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.derived.eigenfinanzierungPct.source.accountCode).toBe('derived')
    expect(result!.derived.eigenfinanzierungPct.source.accountName).toContain('Eigenfinanzierungsquote')
    expect(result!.derived.monthlyAvg.source.accountName).toContain('Monatsdurchschnitt')
    expect(result!.derived.earnedTotal.source.accountName).toContain('Eigenerwirtschaftet')
    expect(result!.derived.donationsTotal.source.accountName).toContain('Spenden')
  })

  it('metadata reflects the source file + monthsAvailable', async () => {
    const file: IncomeFileData = {
      year: 2025,
      source: 'revamp-info/2025-export.json',
      imported_at: '2026-01-15T10:00:00Z',
      data: [
        ...makeMonthlyFile(2025, 1, { total: 1000 }).data,
        ...makeMonthlyFile(2025, 6, { total: 1500 }).data,
      ],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2025)
    expect(result!.metadata.source).toBe('revamp-info/2025-export.json')
    expect(result!.metadata.importedAt).toBe('2026-01-15T10:00:00Z')
    expect(result!.metadata.filePath).toContain('income_2025.json')
    expect(result!.metadata.monthsAvailable).toBe(2)
  })
})

// ============================================================================
// loadFinancialData — yearly aggregate mode (every record has month=0)
// ============================================================================

describe('loadFinancialData — yearly aggregate mode', () => {
  it('detects month=0 across all records and produces a single annual entry', async () => {
    const file = makeYearlyAggregateFile(2018, {
      total: 120000, products: 60000, services: 40000,
      integration: 20000, donations: 30000, price_adjustment: 10000,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2018)
    expect(result!.monthly).toHaveLength(1)
    expect(result!.monthly[0].month).toBe(0)
    expect(result!.monthly[0].monthName).toBe('Jahr 2018')
  })

  it('forces monthsAvailable=12 for yearly aggregates (assumes full year)', async () => {
    // Critical: monthlyAvg uses this — historical exports are full-year so
    // /12 is correct, even though only 1 record exists
    const file = makeYearlyAggregateFile(2018, { total: 120000 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2018)
    expect(result!.metadata.monthsAvailable).toBe(12)
    expect(result!.derived.monthlyAvg.value).toBe(10000) // 120000 / 12
  })

  it('preserves all subcategory values in the single annual entry', async () => {
    const file = makeYearlyAggregateFile(2018, {
      total: 120000, products: 60000, services: 40000,
      integration: 20000, donations: 30000, price_adjustment: 10000,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2018)
    const annual = result!.monthly[0]
    expect(annual.total.value).toBe(120000)
    expect(annual.warenverkauf.value).toBe(60000)
    expect(annual.dienstleistungen.value).toBe(40000)
    expect(annual.integration.value).toBe(20000)
    expect(annual.spenden.value).toBe(30000)
    expect(annual.aufstockung.value).toBe(10000)
  })

  it('totals match the single annual entry (no double-counting)', async () => {
    const file = makeYearlyAggregateFile(2018, { total: 120000, products: 60000 })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2018)
    expect(result!.totals.total.value).toBe(120000)
    expect(result!.totals.warenverkauf.value).toBe(60000)
  })

  it('derived metrics work the same way for yearly aggregates', async () => {
    const file = makeYearlyAggregateFile(2018, {
      total: 100000, products: 60000, services: 0, integration: 20000,
      donations: 15000, price_adjustment: 5000,
    })
    mockReadFile.mockResolvedValueOnce(JSON.stringify(file))

    const result = await loadFinancialData(2018)
    expect(result!.derived.earnedTotal.value).toBe(80000)
    expect(result!.derived.donationsTotal.value).toBe(20000)
    expect(result!.derived.eigenfinanzierungPct.value).toBe(80)
  })
})

// ============================================================================
// loadAllYearsData
// ============================================================================

describe('loadAllYearsData', () => {
  it('loads each year listed in summary.years and returns a Map keyed by year', async () => {
    const summary: SummaryData = {
      years: [2024, 2025],
      total_records: 50,
      source: 'revamp-info',
      exported_at: '2026-01-15T10:00:00Z',
      categories: ['revenue'],
    }
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(summary)) // loadSummary
      .mockResolvedValueOnce(JSON.stringify(makeMonthlyFile(2024, 1, { total: 1000 }))) // 2024
      .mockResolvedValueOnce(JSON.stringify(makeMonthlyFile(2025, 1, { total: 2000 }))) // 2025

    const result = await loadAllYearsData()

    expect(result.size).toBe(2)
    expect(result.get(2024)?.totals.total.value).toBe(1000)
    expect(result.get(2025)?.totals.total.value).toBe(2000)
  })

  it('skips years with no income file (loadFinancialData returns null)', async () => {
    const summary: SummaryData = {
      years: [2024, 2025],
      total_records: 10,
      source: 'revamp-info',
      exported_at: '2026-01-15T10:00:00Z',
      categories: ['revenue'],
    }
    mockReadFile
      .mockResolvedValueOnce(JSON.stringify(summary))
      .mockRejectedValueOnce(new Error('ENOENT')) // 2024 missing
      .mockResolvedValueOnce(JSON.stringify(makeMonthlyFile(2025, 1, { total: 2000 })))

    const result = await loadAllYearsData()

    expect(result.size).toBe(1)
    expect(result.has(2024)).toBe(false)
    expect(result.has(2025)).toBe(true)
  })
})

// ============================================================================
// getAvailableYears
// ============================================================================

describe('getAvailableYears', () => {
  it('returns the years array straight from summary', async () => {
    const summary: SummaryData = {
      years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      total_records: 500,
      source: 'revamp-info',
      exported_at: '2026-01-15T10:00:00Z',
      categories: ['revenue'],
    }
    mockReadFile.mockResolvedValueOnce(JSON.stringify(summary))

    expect(await getAvailableYears()).toEqual([2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025])
  })
})
