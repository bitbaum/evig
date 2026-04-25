/**
 * Financial Analysis
 *
 * Provides insights, trend analysis, and derived metrics
 * with transparent calculations.
 */

import type { YearlyAggregation, MonthlyData, TracedValue } from './financial-loader';
import { formatCHF, formatPercent } from '../format';

// ============================================================================
// Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'stable';
export type InsightType = 'positive' | 'negative' | 'neutral' | 'warning';
export type InsightPriority = 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  value?: number;
  valueFormatted?: string;
  formula?: string;
  relatedNumbers: string[];
  // Enhanced fields for actionable commentary
  recommendation?: string;
  priority?: InsightPriority;
  implication?: string;
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
    const isStrong = totalChange.percentChange > 20;
    insights.push({
      id: 'total_growth',
      type: 'positive',
      title: isStrong ? 'Starkes Umsatzwachstum' : 'Umsatzwachstum',
      description: `Gesamteinnahmen sind ${formatPercent(totalChange.percentChange)} höher als im Vorjahr`,
      value: totalChange.percentChange,
      valueFormatted: formatPercent(totalChange.percentChange),
      formula: totalChange.formula,
      relatedNumbers: [`financial_total_${current.year}`, `financial_total_${previous.year}`],
      implication: isStrong
        ? 'Nachfrage wächst deutlich; Kapazitäten könnten knapp werden'
        : 'Stabile positive Entwicklung',
      recommendation: isStrong
        ? 'Kapazitätsplanung prüfen; Team-Erweiterung evaluieren'
        : 'Kurs beibehalten; Qualität vor Quantität',
      priority: isStrong ? 'medium' : 'low',
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
      implication: 'Ernstes Warnsignal; könnte finanzielle Stabilität gefährden',
      recommendation: 'Ursachenanalyse durchführen; Sofortmassnahmen prüfen',
      priority: 'high',
    });
  }

  // Self-financing comparison
  const currentSelfFinancing = current.derived.eigenfinanzierungPct.value;
  const previousSelfFinancing = previous.derived.eigenfinanzierungPct.value;
  const selfFinancingChange = currentSelfFinancing - previousSelfFinancing;

  if (Math.abs(selfFinancingChange) > 3) {
    const isImproved = selfFinancingChange > 0;
    insights.push({
      id: 'self_financing_change',
      type: isImproved ? 'positive' : 'neutral',
      title: isImproved ? 'Höhere Eigenfinanzierung' : 'Niedrigere Eigenfinanzierung',
      description: `Eigenfinanzierungsquote: ${formatPercent(currentSelfFinancing)} (Vorjahr: ${formatPercent(previousSelfFinancing)})`,
      value: selfFinancingChange,
      valueFormatted: `${selfFinancingChange > 0 ? '+' : ''}${formatPercent(selfFinancingChange)}`,
      formula: `${formatPercent(currentSelfFinancing)} - ${formatPercent(previousSelfFinancing)} = ${formatPercent(selfFinancingChange)}`,
      relatedNumbers: [`financial_self_financing_${current.year}`, `financial_self_financing_${previous.year}`],
      implication: isImproved
        ? 'Stärkere finanzielle Unabhängigkeit'
        : 'Erhöhte Abhängigkeit von Spenden',
      recommendation: isImproved
        ? 'Positive Entwicklung fortsetzen; Modell konsolidieren'
        : 'Eigeneinnahmen stärken; Dienstleistungsbereich ausbauen',
      priority: isImproved ? 'low' : 'medium',
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
      implication: 'Servicebereich gewinnt an Bedeutung; stärkt Eigenfinanzierung',
      recommendation: 'Kapazitäten für Dienstleistungen erweitern; Angebot diversifizieren',
      priority: 'low',
    });
  }

  // Products declining warning
  if (categoryChanges.warenverkauf.direction === 'down' && Math.abs(categoryChanges.warenverkauf.percentChange) > 15) {
    insights.push({
      id: 'products_decline',
      type: 'warning',
      title: 'Warenverkauf rückläufig',
      description: `Produktverkäufe sind ${formatPercent(Math.abs(categoryChanges.warenverkauf.percentChange))} niedriger`,
      value: categoryChanges.warenverkauf.percentChange,
      valueFormatted: formatPercent(Math.abs(categoryChanges.warenverkauf.percentChange)),
      formula: categoryChanges.warenverkauf.formula,
      relatedNumbers: [`financial_warenverkauf_${current.year}`, `financial_warenverkauf_${previous.year}`],
      implication: 'Rückgang bei Haupteinnahmequelle; mögliche Nachfrageschwäche',
      recommendation: 'Sortiment prüfen; Marketing verstärken; neue Beschaffungskanäle',
      priority: 'high',
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
      implication: 'Soziales Kernziel nicht erfüllt',
      recommendation: 'Integrations-Programm reaktivieren oder neue Partner suchen',
      priority: 'high',
    });
  }

  // Donations increasing significantly
  const currentDonationsShare = current.totals.spenden.value / current.totals.total.value * 100;
  const previousDonationsShare = previous.totals.spenden.value / previous.totals.total.value * 100;
  if (currentDonationsShare > 40 && currentDonationsShare > previousDonationsShare + 5) {
    insights.push({
      id: 'donations_increasing',
      type: 'neutral',
      title: 'Steigender Spendenanteil',
      description: `Spendenanteil bei ${formatPercent(currentDonationsShare)} (Vorjahr: ${formatPercent(previousDonationsShare)})`,
      value: currentDonationsShare,
      valueFormatted: formatPercent(currentDonationsShare),
      relatedNumbers: [`financial_spenden_${current.year}`],
      implication: 'Stärkere Abhängigkeit von wenigen Spendern',
      recommendation: 'Spenderbasis diversifizieren; Eigeneinnahmen steigern',
      priority: 'medium',
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
      implication: 'Starke finanzielle Unabhängigkeit von Spenden',
      recommendation: 'Modell beibehalten; Reserven für Schwankungen aufbauen',
      priority: 'low',
    });
  } else if (selfFinancing >= 50) {
    insights.push({
      id: 'medium_self_financing',
      type: 'neutral',
      title: 'Ausgewogene Finanzierung',
      description: `${formatPercent(selfFinancing)} der Einnahmen sind selbst erwirtschaftet`,
      value: selfFinancing,
      valueFormatted: formatPercent(selfFinancing),
      formula: data.derived.eigenfinanzierungPct.source.accountName,
      relatedNumbers: [`financial_self_financing_${data.year}`],
      implication: 'Gute Balance zwischen Eigenerwirtschaftung und Spendeneinnahmen',
      recommendation: 'Dienstleistungsbereich weiter stärken für mehr Unabhängigkeit',
      priority: 'medium',
    });
  } else {
    insights.push({
      id: 'low_self_financing',
      type: 'warning',
      title: 'Hohe Spendenabhängigkeit',
      description: `Nur ${formatPercent(selfFinancing)} der Einnahmen sind selbst erwirtschaftet`,
      value: selfFinancing,
      valueFormatted: formatPercent(selfFinancing),
      formula: data.derived.eigenfinanzierungPct.source.accountName,
      relatedNumbers: [`financial_self_financing_${data.year}`],
      implication: 'Hohe Spendenabhängigkeit; Risiko bei Spendenrückgang',
      recommendation: 'Dienstleistungen ausbauen oder Preise anpassen; alternative Einnahmequellen prüfen',
      priority: 'high',
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
    priority: 'low',
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
      implication: 'Inkonsistente Einnahmen; mögliche Datenlücken oder saisonale Effekte',
      recommendation: 'Datenqualität prüfen; bei echten Lücken Cashflow-Planung verbessern',
      priority: 'medium',
    });
  }

  // Revenue mix analysis
  const total = data.totals.total.value;
  if (total > 0) {
    const warenverkaufPct = (data.totals.warenverkauf.value / total) * 100;
    const dienstleistungenPct = (data.totals.dienstleistungen.value / total) * 100;
    const spendenPct = (data.totals.spenden.value / total) * 100;

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
        implication: 'Abhängig von Wareneingang; Lagerrisiken',
        recommendation: 'Diversifikation durch Services; Lieferkette stabilisieren',
        priority: 'medium',
      });
    } else if (dienstleistungenPct > 50) {
      insights.push({
        id: 'service_heavy',
        type: 'positive',
        title: 'Serviceorientiert',
        description: `${formatPercent(dienstleistungenPct)} der Einnahmen aus Dienstleistungen`,
        value: dienstleistungenPct,
        valueFormatted: formatPercent(dienstleistungenPct),
        formula: `(${formatCHF(data.totals.dienstleistungen.value)} / ${formatCHF(total)}) × 100`,
        relatedNumbers: [`financial_dienstleistungen_${data.year}`, `financial_total_${data.year}`],
        implication: 'Starke Serviceorientierung; personenabhängig',
        recommendation: 'Skalierbarkeit prüfen; Produktangebote als Ergänzung erwägen',
        priority: 'low',
      });
    }

    // High donation share warning
    if (spendenPct > 40) {
      insights.push({
        id: 'high_donations_share',
        type: 'warning',
        title: 'Hoher Spendenanteil',
        description: `${formatPercent(spendenPct)} der Einnahmen aus Spenden`,
        value: spendenPct,
        valueFormatted: formatPercent(spendenPct),
        formula: `(${formatCHF(data.totals.spenden.value)} / ${formatCHF(total)}) × 100`,
        relatedNumbers: [`financial_spenden_${data.year}`, `financial_total_${data.year}`],
        implication: 'Starke Abhängigkeit von wenigen Spendern',
        recommendation: 'Spenderbasis diversifizieren; Eigeneinnahmen steigern',
        priority: 'high',
      });
    }

    // Integration zero warning
    if (data.totals.integration.value === 0) {
      insights.push({
        id: 'no_integration',
        type: 'warning',
        title: 'Keine Integrations-Arbeitsplätze',
        description: 'Keine Einnahmen aus Integrations-Programm',
        relatedNumbers: [`financial_integration_${data.year}`],
        implication: 'Soziales Kernziel nicht erfüllt',
        recommendation: 'Integrations-Programm reaktivieren oder neue Partner suchen',
        priority: 'high',
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
