/**
 * Financial Analysis
 *
 * Provides insights, trend analysis, and derived metrics
 * with transparent calculations.
 */

import type { YearlyAggregation, MonthlyData, TracedValue } from './financial-loader';

// ============================================================================
// Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'stable';
export type InsightType = 'positive' | 'negative' | 'neutral' | 'warning';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  value?: number;
  valueFormatted?: string;
  formula?: string;
  relatedNumbers: string[];
}

export interface TrendAnalysis {
  direction: TrendDirection;
  percentChange: number;
  absoluteChange: number;
  formula: string;
}

export interface YearComparison {
  currentYear: number;
  previousYear: number;
  totalChange: TrendAnalysis;
  categoryChanges: {
    warenverkauf: TrendAnalysis;
    dienstleistungen: TrendAnalysis;
    integration: TrendAnalysis;
    spenden: TrendAnalysis;
    aufstockung: TrendAnalysis;
  };
  insights: Insight[];
}

export interface SeasonalityPattern {
  strongMonths: number[];
  weakMonths: number[];
  pattern: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTrend(current: number, previous: number): TrendAnalysis {
  const absoluteChange = current - previous;
  const percentChange = previous !== 0
    ? ((current - previous) / previous) * 100
    : current > 0 ? 100 : 0;

  let direction: TrendDirection = 'stable';
  if (percentChange > 5) direction = 'up';
  else if (percentChange < -5) direction = 'down';

  return {
    direction,
    percentChange: Math.round(percentChange * 10) / 10,
    absoluteChange: Math.round(absoluteChange),
    formula: `((${Math.round(current)} - ${Math.round(previous)}) / ${Math.round(previous)}) × 100 = ${Math.round(percentChange * 10) / 10}%`,
  };
}

function formatCHF(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Compare two years and generate insights
 */
export function compareYears(
  current: YearlyAggregation,
  previous: YearlyAggregation
): YearComparison {
  const totalChange = calculateTrend(
    current.totals.total.value,
    previous.totals.total.value
  );

  const categoryChanges = {
    warenverkauf: calculateTrend(
      current.totals.warenverkauf.value,
      previous.totals.warenverkauf.value
    ),
    dienstleistungen: calculateTrend(
      current.totals.dienstleistungen.value,
      previous.totals.dienstleistungen.value
    ),
    integration: calculateTrend(
      current.totals.integration.value,
      previous.totals.integration.value
    ),
    spenden: calculateTrend(
      current.totals.spenden.value,
      previous.totals.spenden.value
    ),
    aufstockung: calculateTrend(
      current.totals.aufstockung.value,
      previous.totals.aufstockung.value
    ),
  };

  const insights: Insight[] = [];

  // Total revenue insight
  if (totalChange.direction === 'up') {
    insights.push({
      id: 'total_growth',
      type: 'positive',
      title: 'Umsatzwachstum',
      description: `Gesamteinnahmen sind ${formatPercent(totalChange.percentChange)} höher als im Vorjahr`,
      value: totalChange.percentChange,
      valueFormatted: formatPercent(totalChange.percentChange),
      formula: totalChange.formula,
      relatedNumbers: [`financial_total_${current.year}`, `financial_total_${previous.year}`],
    });
  } else if (totalChange.direction === 'down') {
    insights.push({
      id: 'total_decline',
      type: 'warning',
      title: 'Umsatzrückgang',
      description: `Gesamteinnahmen sind ${formatPercent(Math.abs(totalChange.percentChange))} niedriger als im Vorjahr`,
      value: totalChange.percentChange,
      valueFormatted: formatPercent(Math.abs(totalChange.percentChange)),
      formula: totalChange.formula,
      relatedNumbers: [`financial_total_${current.year}`, `financial_total_${previous.year}`],
    });
  }

  // Self-financing comparison
  const currentSelfFinancing = current.derived.eigenfinanzierungPct.value;
  const previousSelfFinancing = previous.derived.eigenfinanzierungPct.value;
  const selfFinancingChange = currentSelfFinancing - previousSelfFinancing;

  if (Math.abs(selfFinancingChange) > 3) {
    insights.push({
      id: 'self_financing_change',
      type: selfFinancingChange > 0 ? 'positive' : 'neutral',
      title: selfFinancingChange > 0 ? 'Höhere Eigenfinanzierung' : 'Niedrigere Eigenfinanzierung',
      description: `Eigenfinanzierungsquote: ${formatPercent(currentSelfFinancing)} (Vorjahr: ${formatPercent(previousSelfFinancing)})`,
      value: selfFinancingChange,
      valueFormatted: `${selfFinancingChange > 0 ? '+' : ''}${formatPercent(selfFinancingChange)}`,
      formula: `${formatPercent(currentSelfFinancing)} - ${formatPercent(previousSelfFinancing)} = ${formatPercent(selfFinancingChange)}`,
      relatedNumbers: [`financial_self_financing_${current.year}`, `financial_self_financing_${previous.year}`],
    });
  }

  // Category-specific insights
  if (categoryChanges.dienstleistungen.direction === 'up' && categoryChanges.dienstleistungen.percentChange > 10) {
    insights.push({
      id: 'services_growth',
      type: 'positive',
      title: 'Dienstleistungen wachsen stark',
      description: `Dienstleistungseinnahmen sind ${formatPercent(categoryChanges.dienstleistungen.percentChange)} höher`,
      value: categoryChanges.dienstleistungen.percentChange,
      valueFormatted: formatPercent(categoryChanges.dienstleistungen.percentChange),
      formula: categoryChanges.dienstleistungen.formula,
      relatedNumbers: [`financial_dienstleistungen_${current.year}`, `financial_dienstleistungen_${previous.year}`],
    });
  }

  // Integration warning if zero for extended period
  if (current.totals.integration.value === 0 && previous.totals.integration.value > 0) {
    insights.push({
      id: 'integration_zero',
      type: 'warning',
      title: 'Keine Integrations-Arbeitsplätze',
      description: 'Dieses Jahr keine Einnahmen aus Integrations-Arbeitsplätzen',
      relatedNumbers: [`financial_integration_${current.year}`],
    });
  }

  return {
    currentYear: current.year,
    previousYear: previous.year,
    totalChange,
    categoryChanges,
    insights,
  };
}

/**
 * Analyze seasonality patterns within a year
 */
export function analyzeSeasonality(data: YearlyAggregation): SeasonalityPattern {
  const monthlyValues = data.monthly.map(m => m.total.value);
  const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
  const threshold = avg * 0.2; // 20% above/below average

  const strongMonths = data.monthly
    .filter(m => m.total.value > avg + threshold)
    .map(m => m.month);

  const weakMonths = data.monthly
    .filter(m => m.total.value < avg - threshold)
    .map(m => m.month);

  let pattern = 'Keine klare Saisonalität erkennbar';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (strongMonths.length >= 2 && weakMonths.length >= 2) {
    pattern = `Starke Monate: ${strongMonths.join(', ')}; Schwache Monate: ${weakMonths.join(', ')}`;
    confidence = 'medium';
  }

  return {
    strongMonths,
    weakMonths,
    pattern,
    confidence,
  };
}

/**
 * Generate insights for a single year
 */
export function generateYearInsights(data: YearlyAggregation): Insight[] {
  const insights: Insight[] = [];

  // Self-financing ratio assessment
  const selfFinancing = data.derived.eigenfinanzierungPct.value;
  if (selfFinancing >= 70) {
    insights.push({
      id: 'high_self_financing',
      type: 'positive',
      title: 'Hohe Eigenfinanzierung',
      description: `${formatPercent(selfFinancing)} der Einnahmen sind selbst erwirtschaftet`,
      value: selfFinancing,
      valueFormatted: formatPercent(selfFinancing),
      formula: data.derived.eigenfinanzierungPct.source.accountName,
      relatedNumbers: [`financial_self_financing_${data.year}`],
    });
  } else if (selfFinancing < 50) {
    insights.push({
      id: 'low_self_financing',
      type: 'warning',
      title: 'Hohe Spendenabhängigkeit',
      description: `Nur ${formatPercent(selfFinancing)} der Einnahmen sind selbst erwirtschaftet`,
      value: selfFinancing,
      valueFormatted: formatPercent(selfFinancing),
      formula: data.derived.eigenfinanzierungPct.source.accountName,
      relatedNumbers: [`financial_self_financing_${data.year}`],
    });
  }

  // Monthly average assessment
  const monthlyAvg = data.derived.monthlyAvg.value;
  insights.push({
    id: 'monthly_avg',
    type: 'neutral',
    title: 'Monatsdurchschnitt',
    description: `Durchschnittlich ${formatCHF(monthlyAvg)} pro Monat (${data.metadata.monthsAvailable} Monate mit Daten)`,
    value: monthlyAvg,
    valueFormatted: formatCHF(monthlyAvg),
    formula: data.derived.monthlyAvg.source.accountName,
    relatedNumbers: [`financial_monthly_avg_${data.year}`],
  });

  // Check for months with zero total
  const zeroMonths = data.monthly.filter(m => m.total.value <= 0);
  if (zeroMonths.length > 0) {
    insights.push({
      id: 'zero_months',
      type: 'warning',
      title: 'Monate ohne Einnahmen',
      description: `${zeroMonths.length} Monat(e) mit null oder negativen Einnahmen`,
      relatedNumbers: zeroMonths.map(m => `financial_month_${m.month}_${data.year}`),
    });
  }

  // Revenue mix analysis
  const total = data.totals.total.value;
  if (total > 0) {
    const warenverkaufPct = (data.totals.warenverkauf.value / total) * 100;
    const dienstleistungenPct = (data.totals.dienstleistungen.value / total) * 100;

    if (warenverkaufPct > 60) {
      insights.push({
        id: 'product_heavy',
        type: 'neutral',
        title: 'Produktorientiert',
        description: `${formatPercent(warenverkaufPct)} der Einnahmen aus Warenverkauf`,
        value: warenverkaufPct,
        valueFormatted: formatPercent(warenverkaufPct),
        formula: `(${formatCHF(data.totals.warenverkauf.value)} / ${formatCHF(total)}) × 100`,
        relatedNumbers: [`financial_warenverkauf_${data.year}`, `financial_total_${data.year}`],
      });
    } else if (dienstleistungenPct > 60) {
      insights.push({
        id: 'service_heavy',
        type: 'neutral',
        title: 'Serviceorientiert',
        description: `${formatPercent(dienstleistungenPct)} der Einnahmen aus Dienstleistungen`,
        value: dienstleistungenPct,
        valueFormatted: formatPercent(dienstleistungenPct),
        formula: `(${formatCHF(data.totals.dienstleistungen.value)} / ${formatCHF(total)}) × 100`,
        relatedNumbers: [`financial_dienstleistungen_${data.year}`, `financial_total_${data.year}`],
      });
    }
  }

  return insights;
}

/**
 * Calculate run rate projection
 */
export function calculateRunRate(data: YearlyAggregation): {
  projectedAnnual: number;
  formula: string;
  confidence: 'high' | 'medium' | 'low';
} {
  const monthsAvailable = data.metadata.monthsAvailable;
  const currentTotal = data.totals.total.value;

  if (monthsAvailable < 3) {
    return {
      projectedAnnual: 0,
      formula: 'Zu wenige Daten für Projektion (< 3 Monate)',
      confidence: 'low',
    };
  }

  const projectedAnnual = (currentTotal / monthsAvailable) * 12;

  return {
    projectedAnnual: Math.round(projectedAnnual),
    formula: `(${formatCHF(currentTotal)} / ${monthsAvailable} Monate) × 12 = ${formatCHF(projectedAnnual)}`,
    confidence: monthsAvailable >= 9 ? 'high' : monthsAvailable >= 6 ? 'medium' : 'low',
  };
}
