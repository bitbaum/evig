/**
 * Impact Metrics — Data Layer (IDs + numbers only)
 *
 * SCALE & I18N CONVENTION:
 *   Data files in src/data/** hold IDs, numbers, dates, and URLs.
 *   They NEVER hold user-facing display strings.
 *   All titles / descriptions / methodology / labels / units are looked up
 *   by ID via next-intl `useTranslations(...)` / `getTranslations(...)`.
 *
 *   This is the contract enforced by `scripts/i18n-hardcoded-audit.mjs`.
 *
 * Why: any string baked into a data file is a string that the i18n system
 * cannot translate. The Italian / French / English / etc. versions of pages
 * that consume these files would display German text, which is exactly the
 * bug that motivated this refactor.
 *
 * Numbers sourced from org-numbers SSOT (Postgres org_numbers table).
 * Last reconciled: 2026-06-08
 */

import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { LOCATIONS } from '@/config/org'

// ============================================================================
// Types
// ============================================================================

export interface ImpactMetric {
  id: string
  value: string
  /** i18n unit suffix key (under `about.impact.units.*`) — appended to value with a space */
  unitKey?: 'tonnes'
  category: 'environmental' | 'social' | 'economic'
  verified: boolean
  lastUpdated: string
}

export interface EWasteStat {
  id: 'global-total' | 'recycling-rate' | 'europe-per-capita' | 'laptop-co2'
  value: string
  /** i18n unit suffix key (under `components.eWasteProblem.units.*`) */
  unitKey: 'millionTonnes' | 'percent' | 'kgPerPerson' | 'kgCo2'
  sourceUrl: string
  year: number
}

export interface ZeroWastePrinciple {
  id: 'repair' | 'refurbish' | 'recycle' | 'educate'
  icon: 'wrench' | 'refresh' | 'recycle' | 'heart'
  priority: number
}

// ============================================================================
// Derived values from org-numbers defaults
// ============================================================================

const ANNUAL_DEVICES_SAVED = getDefaultNumeric('devices_sold_per_year')
const AVERAGE_DEVICE_LIFESPAN_YEARS = getDefaultNumeric('device_lifespan_extension_years')
const REUSE_RATE_PERCENT = getDefaultNumeric('reuse_rate')
const ANNUAL_PEOPLE_TRAINED = getDefaultNumeric('annual_people_trained')
const INTERNSHIP_SUCCESS_RATE_PERCENT = getDefaultNumeric('internship_success_rate')
const ANNUAL_CAREER_REENTRIES = getDefaultNumeric('annual_career_reentries')

const CO2_PRODUCTION_KG = getDefaultNumeric('co2_production_new_laptop')
const CO2_REFURBISHMENT_KG = getDefaultNumeric('co2_refurbishment')
const CO2_SAVINGS_PER_DEVICE_KG = getDefaultNumeric('co2_savings_per_device')
const AVG_DEVICE_WEIGHT_KG = getDefaultNumeric('avg_device_weight_kg')

const ANNUAL_CO2_SAVED_TONS = getDefaultNumeric('annual_co2_saved_tons')
const ANNUAL_EWASTE_PREVENTED_TONS = (ANNUAL_DEVICES_SAVED * AVG_DEVICE_WEIGHT_KG) / 1000

// ============================================================================
// IMPACT METRICS (IDs + numeric values only — display strings live in messages)
// ============================================================================

export const IMPACT_METRICS: ImpactMetric[] = [
  // Environmental
  { id: 'devices-recycled',  value: `${ANNUAL_DEVICES_SAVED}+`,                       category: 'environmental', verified: false, lastUpdated: '2026-02-16' },
  { id: 'device-lifespan',   value: `${AVERAGE_DEVICE_LIFESPAN_YEARS}+`,              category: 'environmental', verified: false, lastUpdated: '2026-02-16' },
  { id: 'reuse-rate',        value: `${REUSE_RATE_PERCENT}%`,                          category: 'environmental', verified: false, lastUpdated: '2026-02-16' },
  { id: 'co2-savings',       value: `~${ANNUAL_CO2_SAVED_TONS}`,                       unitKey: 'tonnes', category: 'environmental', verified: false, lastUpdated: '2026-02-16' },
  { id: 'ewaste-prevented',  value: `${ANNUAL_EWASTE_PREVENTED_TONS.toFixed(1)}`,      unitKey: 'tonnes', category: 'environmental', verified: false, lastUpdated: '2026-02-16' },

  // Social
  { id: 'people-trained',    value: `${ANNUAL_PEOPLE_TRAINED}+`,                       category: 'social', verified: false, lastUpdated: '2026-02-16' },
  { id: 'internship-success',value: `~${INTERNSHIP_SUCCESS_RATE_PERCENT}%`,            category: 'social', verified: false, lastUpdated: '2026-02-16' },
  { id: 'career-reentries',  value: `~${ANNUAL_CAREER_REENTRIES}`,                     category: 'social', verified: false, lastUpdated: '2026-02-16' },
]

// ============================================================================
// E-WASTE GLOBAL STATISTICS (verified external sources — labels in messages)
// ============================================================================

export const EWASTE_GLOBAL_STATS: EWasteStat[] = [
  { id: 'global-total',       value: '62',   unitKey: 'millionTonnes', sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/', year: 2022 },
  { id: 'recycling-rate',     value: '22.3', unitKey: 'percent',       sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/', year: 2022 },
  { id: 'europe-per-capita',  value: '17.6', unitKey: 'kgPerPerson',   sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/', year: 2022 },
  { id: 'laptop-co2',         value: '331',  unitKey: 'kgCo2',         sourceUrl: 'https://circularcomputing.com/news/carbon-footprint-laptop/', year: 2021 },
]

// ============================================================================
// ZERO-WASTE PRINCIPLES (ID + icon + priority — title/description in messages)
// ============================================================================

export const ZERO_WASTE_PRINCIPLES: ZeroWastePrinciple[] = [
  { id: 'repair',    icon: 'wrench',  priority: 1 },
  { id: 'refurbish', icon: 'refresh', priority: 2 },
  { id: 'recycle',   icon: 'recycle', priority: 3 },
  { id: 'educate',   icon: 'heart',   priority: 4 },
]

// ============================================================================
// PHYSICAL SPACE — counts only (offerings/topics/features text in messages)
// ============================================================================

export const PHYSICAL_SPACE_OFFERINGS_COUNT = 4
export const PHYSICAL_SPACE_WORKSHOPS_COUNT = 6
export const PHYSICAL_SPACE_VISION_FEATURES_COUNT = 5

export function getFormattedAddress(): string {
  return `${LOCATIONS.store.street}, ${LOCATIONS.store.postalCode} ${LOCATIONS.store.city}`
}

// ============================================================================
// Helper functions
// ============================================================================

export interface CompactMetricLabels {
  devicesRescued: string
  peopleTrained: string
  reuseRate: string
  lifespanExtension: string
  internshipSuccess: string
  careerReentries: string
}

export function getCompactMetrics(labels: CompactMetricLabels) {
  return [
    { value: IMPACT_METRICS.find(m => m.id === 'devices-recycled')?.value || '150+', label: labels.devicesRescued },
    { value: IMPACT_METRICS.find(m => m.id === 'people-trained')?.value || '20+',    label: labels.peopleTrained },
    { value: IMPACT_METRICS.find(m => m.id === 'reuse-rate')?.value || '75%',         label: labels.reuseRate },
    { value: IMPACT_METRICS.find(m => m.id === 'device-lifespan')?.value || '5+',     label: labels.lifespanExtension },
    { value: IMPACT_METRICS.find(m => m.id === 'internship-success')?.value || '~40%',label: labels.internshipSuccess },
    { value: IMPACT_METRICS.find(m => m.id === 'career-reentries')?.value || '~4',    label: labels.careerReentries },
  ]
}

export function getMetricsByCategory(category: ImpactMetric['category']) {
  return IMPACT_METRICS.filter(m => m.category === category)
}

export function getEnvironmentalSummary() {
  return {
    devicesSaved: ANNUAL_DEVICES_SAVED,
    co2SavedTons: ANNUAL_CO2_SAVED_TONS,
    ewastePreventedTons: ANNUAL_EWASTE_PREVENTED_TONS,
    reuseRate: REUSE_RATE_PERCENT / 100,
    co2PerDevice: CO2_SAVINGS_PER_DEVICE_KG,
    co2ProductionKg: CO2_PRODUCTION_KG,
    co2RefurbishmentKg: CO2_REFURBISHMENT_KG,
  }
}

export function getSocialSummary() {
  return {
    peopleTrained: ANNUAL_PEOPLE_TRAINED,
    internshipSuccessRate: INTERNSHIP_SUCCESS_RATE_PERCENT / 100,
    careerReentries: ANNUAL_CAREER_REENTRIES,
  }
}
