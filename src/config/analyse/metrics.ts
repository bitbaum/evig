/**
 * Analyse Metrics Configuration (SSOT)
 *
 * All metric definitions for the analyse section.
 * Adding a new metric = 1 file change here + data source.
 *
 * Metric status:
 * - 'available': Data is automatically loaded from source
 * - 'needs_data': Manual data input required
 * - 'calculated': Derived from other metrics
 */

export type MetricStatus = 'available' | 'needs_data' | 'calculated'
export type MetricSource = 'kivitendo' | 'manual' | 'calculated'
export type MetricCategory = 'financial' | 'environmental' | 'social' | 'digital'

export interface MetricDefinition {
  id: string
  category: MetricCategory
  name: string
  description: string
  source: MetricSource
  status: MetricStatus
  unit: string
  target?: string
  formula?: string
  // For needs_data status
  dataNeeded?: string
  responsibleTeam?: string
}

/**
 * SSOT: All metric definitions
 */
export const METRICS: Record<string, MetricDefinition> = {
  // ==========================================================================
  // Financial Metrics (auto-loaded from Kivitendo)
  // ==========================================================================
  total_revenue: {
    id: 'total_revenue',
    category: 'financial',
    name: 'Gesamteinnahmen',
    description: 'Summe aller Nettoerlöse',
    source: 'kivitendo',
    status: 'available',
    unit: 'CHF',
  },
  self_financing_rate: {
    id: 'self_financing_rate',
    category: 'financial',
    name: 'Eigenfinanzierungsquote',
    description: 'Anteil selbst erwirtschafteter Einnahmen',
    source: 'calculated',
    status: 'available',
    unit: '%',
    target: '>50%',
    formula: '(Warenverkauf + Dienstleistungen + Integration) / Gesamteinnahmen × 100',
  },
  warenverkauf: {
    id: 'warenverkauf',
    category: 'financial',
    name: 'Warenverkauf',
    description: 'Einnahmen aus Produktverkauf',
    source: 'kivitendo',
    status: 'available',
    unit: 'CHF',
  },
  dienstleistungen: {
    id: 'dienstleistungen',
    category: 'financial',
    name: 'Dienstleistungen',
    description: 'Einnahmen aus Serviceleistungen',
    source: 'kivitendo',
    status: 'available',
    unit: 'CHF',
  },
  integration: {
    id: 'integration',
    category: 'financial',
    name: 'Integration',
    description: 'Einnahmen aus Integrations-Arbeitsplätzen',
    source: 'kivitendo',
    status: 'available',
    unit: 'CHF',
  },
  spenden: {
    id: 'spenden',
    category: 'financial',
    name: 'Spenden',
    description: 'Spendeneinnahmen',
    source: 'kivitendo',
    status: 'available',
    unit: 'CHF',
  },
  yoy_growth: {
    id: 'yoy_growth',
    category: 'financial',
    name: 'Wachstum YoY',
    description: 'Umsatzwachstum im Jahresvergleich',
    source: 'calculated',
    status: 'available',
    unit: '%',
    target: '>10%',
    formula: '(Aktuelles Jahr - Vorjahr) / Vorjahr × 100',
  },
  reserves_months: {
    id: 'reserves_months',
    category: 'financial',
    name: 'Reserven',
    description: 'Finanzielle Reserven in Monaten',
    source: 'manual',
    status: 'needs_data',
    unit: 'Monate',
    target: '6 Monate',
    dataNeeded: 'Aktueller Kontostand und monatliche Durchschnittsausgaben',
    responsibleTeam: 'Finanzen',
  },

  // ==========================================================================
  // Environmental Metrics (KPIs - manual tracking needed)
  // ==========================================================================
  devices_saved: {
    id: 'devices_saved',
    category: 'environmental',
    name: 'Geräte gerettet',
    description: 'Anzahl Geräte vor Entsorgung bewahrt',
    source: 'manual',
    status: 'needs_data',
    unit: 'Geräte',
    target: "10'000/Jahr",
    dataNeeded: 'Jährliche Inventur der wiederverwendeten Geräte',
    responsibleTeam: 'Operations',
  },
  co2_saved: {
    id: 'co2_saved',
    category: 'environmental',
    name: 'CO2 eingespart',
    description: 'Vermiedene CO2-Emissionen durch Wiederverwendung',
    source: 'calculated',
    status: 'needs_data',
    unit: 'kg',
    target: '500t/Jahr',
    formula: 'Geräte gerettet × 285kg CO2/Gerät',
    dataNeeded: 'Abhängig von "Geräte gerettet"',
    responsibleTeam: 'Operations',
  },
  ewaste_avoided: {
    id: 'ewaste_avoided',
    category: 'environmental',
    name: 'Elektroschrott vermieden',
    description: 'Gewicht des vermiedenen Elektroschrotts',
    source: 'manual',
    status: 'needs_data',
    unit: 'kg',
    target: '100t/Jahr',
    dataNeeded: 'Gewichtsmessung der verarbeiteten Geräte',
    responsibleTeam: 'Operations',
  },
  raw_materials_reused: {
    id: 'raw_materials_reused',
    category: 'environmental',
    name: 'Rohstoffe wiederverwendet',
    description: 'Gewicht der wiederverwendeten Materialien',
    source: 'manual',
    status: 'needs_data',
    unit: 'kg',
    dataNeeded: 'Materialbuchhaltung aus Recycling-Prozess',
    responsibleTeam: 'Operations',
  },

  // ==========================================================================
  // Social Metrics (manual tracking needed)
  // ==========================================================================
  people_trained: {
    id: 'people_trained',
    category: 'social',
    name: 'Menschen ausgebildet',
    description: 'Teilnehmer an Workshops und Schulungen',
    source: 'manual',
    status: 'needs_data',
    unit: 'Personen',
    target: '500/Jahr',
    dataNeeded: 'Workshop-Teilnehmerlisten',
    responsibleTeam: 'Bildung',
  },
  job_integrations: {
    id: 'job_integrations',
    category: 'social',
    name: 'Berufliche Integrationen',
    description: 'Erfolgreiche Arbeitsmarkt-Integrationen',
    source: 'manual',
    status: 'needs_data',
    unit: 'Personen',
    target: '50/Jahr',
    dataNeeded: 'Integrations-Tracking aus HR',
    responsibleTeam: 'HR / Sozialarbeit',
  },
  volunteer_hours: {
    id: 'volunteer_hours',
    category: 'social',
    name: 'Freiwilligenstunden',
    description: 'Geleistete Arbeitsstunden von Freiwilligen',
    source: 'manual',
    status: 'needs_data',
    unit: 'Stunden',
    target: "2'000/Jahr",
    dataNeeded: 'Zeiterfassung Freiwilligenarbeit',
    responsibleTeam: 'HR',
  },
  active_volunteers: {
    id: 'active_volunteers',
    category: 'social',
    name: 'Aktive Freiwillige',
    description: 'Anzahl regelmässig aktiver Freiwilliger',
    source: 'manual',
    status: 'needs_data',
    unit: 'Personen',
    dataNeeded: 'Freiwilligen-Register',
    responsibleTeam: 'HR',
  },

  // ==========================================================================
  // Digital Sovereignty Metrics (manual tracking needed)
  // ==========================================================================
  linux_installations: {
    id: 'linux_installations',
    category: 'digital',
    name: 'Linux-Installationen',
    description: 'Geräte mit Linux-Betriebssystem ausgeliefert',
    source: 'manual',
    status: 'needs_data',
    unit: 'Geräte',
    dataNeeded: 'Verkaufsstatistik nach OS',
    responsibleTeam: 'Operations',
  },
  foss_trainings: {
    id: 'foss_trainings',
    category: 'digital',
    name: 'Open Source Schulungen',
    description: 'Durchgeführte FOSS-Schulungen',
    source: 'manual',
    status: 'needs_data',
    unit: 'Schulungen',
    dataNeeded: 'Schulungs-Kalender und Teilnehmerlisten',
    responsibleTeam: 'Bildung',
  },
  consultations: {
    id: 'consultations',
    category: 'digital',
    name: 'Beratungen',
    description: 'Durchgeführte Beratungsgespräche',
    source: 'manual',
    status: 'needs_data',
    unit: 'Beratungen',
    dataNeeded: 'Beratungs-Tracking',
    responsibleTeam: 'Support',
  },
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(METRICS).filter(m => m.category === category)
}

/**
 * Get metrics by status
 */
export function getMetricsByStatus(status: MetricStatus): MetricDefinition[] {
  return Object.values(METRICS).filter(m => m.status === status)
}

/**
 * Get all metrics that need data input
 */
export function getMissingDataMetrics(): MetricDefinition[] {
  return Object.values(METRICS).filter(m => m.status === 'needs_data')
}

/**
 * Get metrics grouped by responsible team
 */
export function getMetricsByResponsibleTeam(): Record<string, MetricDefinition[]> {
  const grouped: Record<string, MetricDefinition[]> = {}

  for (const metric of getMissingDataMetrics()) {
    const team = metric.responsibleTeam || 'Unbekannt'
    if (!grouped[team]) {
      grouped[team] = []
    }
    grouped[team].push(metric)
  }

  return grouped
}

// Category labels for display
export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  financial: 'Finanzen',
  environmental: 'Umwelt',
  social: 'Soziales',
  digital: 'Digitale Souveränität',
}

// Category colors for display
export const CATEGORY_COLORS: Record<MetricCategory, { bg: string; text: string; icon: string }> = {
  financial: { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: 'text-neutral-600' },
  environmental: { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-700 dark:text-primary-300', icon: 'text-primary-600 dark:text-primary-400' },
  social: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
  digital: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600' },
}
