/**
 * Financial Data Loader
 *
 * Loads real financial data from Kivitendo JSON exports.
 * Every value is traceable to its source file and account code.
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// Types - Exact structure from JSON files
// ============================================================================

export interface RawIncomeRecord {
  year: number;
  month: number;
  account_code: string;
  account_name: string;
  category: 'revenue';
  subcategory: 'total' | 'products' | 'services' | 'integration' | 'donations' | 'price_adjustment';
  value: number;
}

export interface IncomeFileData {
  year: number;
  source: string;
  imported_at: string;
  data: RawIncomeRecord[];
}

export interface SummaryData {
  years: number[];
  total_records: number;
  source: string;
  exported_at: string;
  categories: string[];
}

// ============================================================================
// Source Metadata - For traceability
// ============================================================================

export interface SourceMetadata {
  filePath: string;
  accountCode: string;
  accountName: string;
  importedAt: string;
  sourceFile: string;
}

export interface TracedValue<T> {
  value: T;
  source: SourceMetadata;
}

// ============================================================================
// Aggregated Data Types
// ============================================================================

export interface MonthlyData {
  month: number;
  monthName: string;
  total: TracedValue<number>;
  warenverkauf: TracedValue<number>;
  dienstleistungen: TracedValue<number>;
  integration: TracedValue<number>;
  spenden: TracedValue<number>;
  aufstockung: TracedValue<number>;
}

export interface YearlyAggregation {
  year: number;
  metadata: {
    source: string;
    importedAt: string;
    filePath: string;
    monthsAvailable: number;
  };
  totals: {
    total: TracedValue<number>;
    warenverkauf: TracedValue<number>;
    dienstleistungen: TracedValue<number>;
    integration: TracedValue<number>;
    spenden: TracedValue<number>;
    aufstockung: TracedValue<number>;
  };
  monthly: MonthlyData[];
  derived: {
    eigenfinanzierungPct: TracedValue<number>;
    monthlyAvg: TracedValue<number>;
    earnedTotal: TracedValue<number>;
    donationsTotal: TracedValue<number>;
  };
}

// ============================================================================
// Constants
// ============================================================================

// Data path - JSON files are stored in public/data/hirn/
const DATA_BASE_PATH = path.join(
  process.cwd(),
  'public',
  'data',
  'hirn'
);

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

const SUBCATEGORY_MAP = {
  total: 'total',
  products: 'warenverkauf',
  services: 'dienstleistungen',
  integration: 'integration',
  donations: 'spenden',
  price_adjustment: 'aufstockung',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

function createTracedValue<T>(
  value: T,
  filePath: string,
  accountCode: string,
  accountName: string,
  importedAt: string,
  sourceFile: string
): TracedValue<T> {
  return {
    value,
    source: {
      filePath,
      accountCode,
      accountName,
      importedAt,
      sourceFile,
    },
  };
}

function sumTracedValues(values: TracedValue<number>[], description: string): TracedValue<number> {
  const sum = values.reduce((acc, v) => acc + v.value, 0);
  return {
    value: sum,
    source: {
      filePath: values[0]?.source.filePath || 'derived',
      accountCode: 'derived',
      accountName: description,
      importedAt: values[0]?.source.importedAt || new Date().toISOString(),
      sourceFile: values[0]?.source.sourceFile || 'derived',
    },
  };
}

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * Load summary data (available years, metadata)
 */
export async function loadSummary(): Promise<SummaryData> {
  const filePath = path.join(DATA_BASE_PATH, 'summary.json');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as SummaryData;
}

/**
 * Load raw income data for a specific year
 */
export async function loadRawIncomeData(year: number): Promise<IncomeFileData | null> {
  const filePath = path.join(DATA_BASE_PATH, `income_${year}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as IncomeFileData;
  } catch {
    return null;
  }
}

/**
 * Load and aggregate financial data for a year
 * Returns fully traced data with source metadata
 */
export async function loadFinancialData(year: number): Promise<YearlyAggregation | null> {
  const rawData = await loadRawIncomeData(year);

  if (!rawData) {
    return null;
  }

  const filePath = `01_Management/B_Finanzen/data/export/income_${year}.json`;

  // Check if this is yearly aggregate data (month=0) or monthly data
  const isYearlyAggregate = rawData.data.every(r => r.month === 0);

  // Group data by month
  const byMonth = new Map<number, Map<string, RawIncomeRecord>>();

  for (const record of rawData.data) {
    if (!byMonth.has(record.month)) {
      byMonth.set(record.month, new Map());
    }
    byMonth.get(record.month)!.set(record.subcategory, record);
  }

  // Build monthly data with tracing
  const monthly: MonthlyData[] = [];
  let monthsAvailable: number;

  if (isYearlyAggregate) {
    // For yearly aggregates, create a single "annual" entry
    monthsAvailable = 12; // Assume full year for historical data
    const records = byMonth.get(0)!;

    const getTracedValue = (subcategory: string): TracedValue<number> => {
      const record = records.get(subcategory);
      if (!record) {
        return createTracedValue(0, filePath, 'N/A', 'Keine Daten', rawData.imported_at, rawData.source);
      }
      return createTracedValue(
        record.value,
        filePath,
        record.account_code,
        record.account_name,
        rawData.imported_at,
        rawData.source
      );
    };

    // Create a single entry representing the full year
    monthly.push({
      month: 0,
      monthName: `Jahr ${year}`,
      total: getTracedValue('total'),
      warenverkauf: getTracedValue('products'),
      dienstleistungen: getTracedValue('services'),
      integration: getTracedValue('integration'),
      spenden: getTracedValue('donations'),
      aufstockung: getTracedValue('price_adjustment'),
    });
  } else {
    // Monthly data processing
    monthsAvailable = byMonth.size;

    for (const [month, records] of Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0])) {
      const getTracedValue = (subcategory: string): TracedValue<number> => {
        const record = records.get(subcategory);
        if (!record) {
          return createTracedValue(0, filePath, 'N/A', 'Keine Daten', rawData.imported_at, rawData.source);
        }
        return createTracedValue(
          record.value,
          filePath,
          record.account_code,
          record.account_name,
          rawData.imported_at,
          rawData.source
        );
      };

      monthly.push({
        month,
        monthName: MONTH_NAMES[month - 1] ?? `Monat ${month}`,
        total: getTracedValue('total'),
        warenverkauf: getTracedValue('products'),
        dienstleistungen: getTracedValue('services'),
        integration: getTracedValue('integration'),
        spenden: getTracedValue('donations'),
        aufstockung: getTracedValue('price_adjustment'),
      });
    }
  }

  // Calculate yearly totals
  const totalSum = sumTracedValues(monthly.map(m => m.total), 'Summe Nettoerlöse Total');
  const warenverkaufSum = sumTracedValues(monthly.map(m => m.warenverkauf), 'Summe Warenverkauf');
  const dienstleistungenSum = sumTracedValues(monthly.map(m => m.dienstleistungen), 'Summe Dienstleistungen');
  const integrationSum = sumTracedValues(monthly.map(m => m.integration), 'Summe Integration');
  const spendenSum = sumTracedValues(monthly.map(m => m.spenden), 'Summe Spenden');
  const aufstockungSum = sumTracedValues(monthly.map(m => m.aufstockung), 'Summe Aufstockung');

  // Calculate derived metrics
  const earnedTotal = warenverkaufSum.value + dienstleistungenSum.value + integrationSum.value;
  const donationsTotal = spendenSum.value + aufstockungSum.value;
  const eigenfinanzierungPct = totalSum.value > 0
    ? (earnedTotal / totalSum.value) * 100
    : 0;
  const monthlyAvg = monthsAvailable > 0
    ? totalSum.value / monthsAvailable
    : 0;

  return {
    year,
    metadata: {
      source: rawData.source,
      importedAt: rawData.imported_at,
      filePath,
      monthsAvailable,
    },
    totals: {
      total: totalSum,
      warenverkauf: warenverkaufSum,
      dienstleistungen: dienstleistungenSum,
      integration: integrationSum,
      spenden: spendenSum,
      aufstockung: aufstockungSum,
    },
    monthly,
    derived: {
      eigenfinanzierungPct: createTracedValue(
        eigenfinanzierungPct,
        filePath,
        'derived',
        'Eigenfinanzierungsquote = (Warenverkauf + Dienstleistungen + Integration) / Total × 100',
        rawData.imported_at,
        rawData.source
      ),
      monthlyAvg: createTracedValue(
        monthlyAvg,
        filePath,
        'derived',
        `Monatsdurchschnitt = Total / ${monthsAvailable} Monate`,
        rawData.imported_at,
        rawData.source
      ),
      earnedTotal: createTracedValue(
        earnedTotal,
        filePath,
        'derived',
        'Eigenerwirtschaftet = Warenverkauf + Dienstleistungen + Integration',
        rawData.imported_at,
        rawData.source
      ),
      donationsTotal: createTracedValue(
        donationsTotal,
        filePath,
        'derived',
        'Spenden & Förderung = Spenden + Aufstockung Richtpreis',
        rawData.imported_at,
        rawData.source
      ),
    },
  };
}

/**
 * Load financial data for all available years
 */
export async function loadAllYearsData(): Promise<Map<number, YearlyAggregation>> {
  const summary = await loadSummary();
  const result = new Map<number, YearlyAggregation>();

  for (const year of summary.years) {
    const data = await loadFinancialData(year);
    if (data) {
      result.set(year, data);
    }
  }

  return result;
}

/**
 * Get available years from summary
 */
export async function getAvailableYears(): Promise<number[]> {
  const summary = await loadSummary();
  return summary.years;
}
