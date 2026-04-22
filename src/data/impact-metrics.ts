/**
 * Impact Metrics — Presentation Layer
 *
 * Numbers sourced from org-numbers SSOT (shared Neon DB).
 * This file provides the presentation config (titles, descriptions, icons)
 * and computed display values. Does NOT define raw numbers.
 *
 * Last reconciled: 2026-02-16 (aligned with revamp-info NUMBERS_REGISTRY)
 */

import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { ORG, LOCATIONS } from '@/config/org'

export interface ImpactMetric {
  id: string
  title: string
  value: string
  description: string
  methodology: string
  category: 'environmental' | 'social' | 'economic'
  verified: boolean
  lastUpdated: string
  shortLabel?: string
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

// CO₂ numbers — now using Fraunhofer IZM 2023 via org-numbers
const CO2_PRODUCTION_KG = getDefaultNumeric('co2_production_new_laptop')   // 350kg
const CO2_REFURBISHMENT_KG = getDefaultNumeric('co2_refurbishment')         // 65kg
const CO2_SAVINGS_PER_DEVICE_KG = getDefaultNumeric('co2_savings_per_device') // 285kg
const AVG_DEVICE_WEIGHT_KG = getDefaultNumeric('avg_device_weight_kg')       // 5kg

const ANNUAL_CO2_SAVED_TONS = getDefaultNumeric('annual_co2_saved_tons')     // ~43
const ANNUAL_EWASTE_PREVENTED_TONS = (ANNUAL_DEVICES_SAVED * AVG_DEVICE_WEIGHT_KG) / 1000

// ============================================================================
// Impact Metrics (presentation config)
// ============================================================================

export const IMPACT_METRICS: ImpactMetric[] = [
  // Environmental
  {
    id: 'devices-recycled',
    title: 'Geräte jährlich gerettet',
    value: `${ANNUAL_DEVICES_SAVED}+`,
    shortLabel: 'Geräte jährlich gerettet',
    description: 'Anzahl der IT-Geräte, die wir jährlich vor dem Entsorgen retten (verkauft)',
    methodology: 'Konservative Schätzung basierend auf Warenverkauf-Umsatz ÷ Durchschnittspreis. Systematisches Tracking wird aufgebaut.',
    category: 'environmental',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'device-lifespan',
    title: 'Lebensdauerverlängerung',
    value: `${AVERAGE_DEVICE_LIFESPAN_YEARS}+`,
    shortLabel: 'Jahre Lebensverlängerung',
    description: 'Durchschnittliche Lebensdauerverlängerung pro Gerät (in Jahren)',
    methodology: `Erfahrungswerte aus 20+ Jahren Refurbishing: Linux verlängert Lebensdauer älterer Hardware signifikant. Geräte werden im Durchschnitt ${AVERAGE_DEVICE_LIFESPAN_YEARS} Jahre länger genutzt.`,
    category: 'environmental',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'reuse-rate',
    title: 'Wiederverwendungsrate',
    value: `${REUSE_RATE_PERCENT}%`,
    shortLabel: 'Wiederverwendungsrate',
    description: 'Anteil der gespendeten Geräte, die wir erfolgreich wiederverwenden',
    methodology: `Von allen gespendeten Geräten werden ${REUSE_RATE_PERCENT}% erfolgreich repariert und wiederverwendet. Die restlichen ${100 - REUSE_RATE_PERCENT}% werden fachgerecht recycelt.`,
    category: 'environmental',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'co2-savings',
    title: 'CO₂-Einsparung jährlich',
    value: `~${ANNUAL_CO2_SAVED_TONS} Tonnen`,
    shortLabel: 'Tonnen CO₂ eingespart',
    description: 'Geschätzte jährliche CO₂-Einsparung durch Wiederverwendung statt Neuproduktion',
    methodology: `Produktion eines neuen Laptops: ${CO2_PRODUCTION_KG}kg CO₂ (Fraunhofer IZM 2023). Refurbishment: ${CO2_REFURBISHMENT_KG}kg CO₂. Einsparung pro Gerät: ${CO2_SAVINGS_PER_DEVICE_KG}kg. Bei ${ANNUAL_DEVICES_SAVED} verkauften Geräten/Jahr ≈ ${ANNUAL_CO2_SAVED_TONS} Tonnen.`,
    category: 'environmental',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'ewaste-prevented',
    title: 'Elektroschrott verhindert',
    value: `${ANNUAL_EWASTE_PREVENTED_TONS.toFixed(1)} Tonnen`,
    shortLabel: 'Tonnen E-Waste verhindert',
    description: 'Menge an Elektroschrott, die wir jährlich verhindern',
    methodology: `Durchschnittsgewicht pro Gerät inkl. Peripherie: ${AVG_DEVICE_WEIGHT_KG}kg. ${ANNUAL_DEVICES_SAVED} Geräte × ${AVG_DEVICE_WEIGHT_KG}kg = ${ANNUAL_EWASTE_PREVENTED_TONS.toFixed(1)} Tonnen pro Jahr.`,
    category: 'environmental',
    verified: false,
    lastUpdated: '2026-02-16'
  },

  // Social
  {
    id: 'people-trained',
    title: 'Personen geschult',
    value: `${ANNUAL_PEOPLE_TRAINED}+`,
    shortLabel: 'Personen geschult',
    description: 'Personen, die wir jährlich in Open Source und nachhaltiger IT schulen',
    methodology: 'Teilnehmer:innen an Workshops, Praktika und Weiterbildungsprogrammen pro Jahr. Umfasst Praktikant:innen, Workshop-Teilnehmer und Langzeit-Teilnehmer.',
    category: 'social',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'internship-success',
    title: 'Erfolgreiche Praktika',
    value: `~${INTERNSHIP_SUCCESS_RATE_PERCENT}%`,
    shortLabel: 'Erfolgreiche Praktika',
    description: 'Unserer Praktikant:innen finden den Einstieg in die IT oder eine Weiterbildung',
    methodology: 'Geschätzt auf Basis historischer Erfahrungswerte, nicht systematisch erhoben. Systematisches Tracking wird aufgebaut.',
    category: 'social',
    verified: false,
    lastUpdated: '2026-02-16'
  },
  {
    id: 'career-reentries',
    title: 'Berufliche Wiedereinstiege',
    value: `~${ANNUAL_CAREER_REENTRIES}`,
    shortLabel: 'Berufliche Wiedereinstiege',
    description: 'Erfolgreiche Wiedereinstiege ins Berufsleben durch unser Programm',
    methodology: `Geschätzt auf Basis von ~10 Praktikant:innen/Jahr mit erschwertem Arbeitsmarktzugang und ~${INTERNSHIP_SUCCESS_RATE_PERCENT}% Erfolgsrate. Nicht systematisch erhoben.`,
    category: 'social',
    verified: false,
    lastUpdated: '2026-02-16'
  }
]

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
    { value: IMPACT_METRICS.find(m => m.id === 'people-trained')?.value || '20+', label: labels.peopleTrained },
    { value: IMPACT_METRICS.find(m => m.id === 'reuse-rate')?.value || '75%', label: labels.reuseRate },
    { value: IMPACT_METRICS.find(m => m.id === 'device-lifespan')?.value || '5+', label: labels.lifespanExtension },
    { value: IMPACT_METRICS.find(m => m.id === 'internship-success')?.value || '~40%', label: labels.internshipSuccess },
    { value: IMPACT_METRICS.find(m => m.id === 'career-reentries')?.value || '~4', label: labels.careerReentries }
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
    careerReentries: ANNUAL_CAREER_REENTRIES
  }
}

// ============================================================================
// E-WASTE GLOBAL STATISTICS (Verified Sources — not org numbers)
// ============================================================================

export interface EWasteStat {
  id: string
  value: string
  unit: string
  label: string
  description: string
  source: string
  sourceUrl: string
  year: number
}

/**
 * Global E-Waste Statistics
 * Source: UN Global E-waste Monitor 2024
 */
export const EWASTE_GLOBAL_STATS: EWasteStat[] = [
  {
    id: 'global-total',
    value: '62',
    unit: 'Millionen Tonnen',
    label: 'Globaler E-Waste',
    description: 'Jährlich produzierter Elektroschrott weltweit',
    source: 'UN Global E-waste Monitor 2024',
    sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/',
    year: 2022
  },
  {
    id: 'recycling-rate',
    value: '22.3',
    unit: '%',
    label: 'Recycling-Rate',
    description: 'Anteil des Elektroschrotts, der korrekt recycelt wird',
    source: 'UN Global E-waste Monitor 2024',
    sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/',
    year: 2022
  },
  {
    id: 'europe-per-capita',
    value: '17.6',
    unit: 'kg pro Person',
    label: 'E-Waste pro Kopf (Europa)',
    description: 'Jährlicher Elektroschrott pro Person in Europa',
    source: 'UN Global E-waste Monitor 2024',
    sourceUrl: 'https://ewastemonitor.info/the-global-e-waste-monitor-2024/',
    year: 2022
  },
  {
    id: 'laptop-co2',
    value: '331',
    unit: 'kg CO₂',
    label: 'CO₂ pro Laptop (Circular Computing)',
    description: 'Durchschnittlicher CO₂-Fussabdruck bei der Herstellung eines neuen Laptops',
    source: 'Circular Computing (Studie mit 230 Laptops)',
    sourceUrl: 'https://circularcomputing.com/news/carbon-footprint-laptop/',
    year: 2021
  }
]

// ============================================================================
// ZERO-WASTE PRINCIPLES
// ============================================================================

export interface ZeroWastePrinciple {
  id: string
  title: string
  description: string
  icon: 'wrench' | 'refresh' | 'recycle' | 'heart'
  priority: number
}

export const ZERO_WASTE_PRINCIPLES: ZeroWastePrinciple[] = [
  {
    id: 'repair',
    title: 'Reparieren',
    description: 'Defekte Geräte werden repariert und dem ursprünglichen Besitzer zurückgegeben. Das ist die nachhaltigste Option.',
    icon: 'wrench',
    priority: 1
  },
  {
    id: 'refurbish',
    title: 'Aufbereiten',
    description: 'Gespendete Geräte werden professionell überholt, mit Linux ausgestattet und an neue Nutzer weitergegeben.',
    icon: 'refresh',
    priority: 2
  },
  {
    id: 'recycle',
    title: 'Recyceln',
    description: 'Nicht mehr nutzbare Geräte werden fachgerecht zerlegt. Wertvolle Rohstoffe werden dem Kreislauf zurückgeführt.',
    icon: 'recycle',
    priority: 3
  },
  {
    id: 'educate',
    title: 'Aufklären',
    description: 'Durch Workshops und Bildung befähigen wir Menschen, ihre Geräte länger zu nutzen und bewusster zu konsumieren.',
    icon: 'heart',
    priority: 4
  }
]

// ============================================================================
// PHYSICAL COMMUNITY SPACE
// ============================================================================

export interface PhysicalSpaceInfo {
  current: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
    offerings: string[]
  }
  vision: {
    title: string
    description: string
    features: string[]
  }
  workshops: {
    title: string
    topics: string[]
  }
}

export const PHYSICAL_SPACE: PhysicalSpaceInfo = {
  current: {
    name: `${ORG.name} Laden`,
    address: LOCATIONS.store.street,
    city: LOCATIONS.store.city,
    postalCode: LOCATIONS.store.postalCode,
    country: LOCATIONS.store.country,
    offerings: [
      'Refurbished Hardware kaufen',
      'Vintage-Computer-Sammlung besichtigen',
      'Persönliche Beratung erhalten',
      'Geräte zur Reparatur oder Spende abgeben'
    ]
  },
  vision: {
    title: 'Community Tech Space',
    description: 'Unser Traum ist ein grösserer Raum, der als Museum, Werkstatt und Treffpunkt für die nachhaltige Tech-Community dient.',
    features: [
      'Museum für seltene Vintage-Hardware',
      'Sammlung historischer Synthesizer und elektronischer Musikinstrumente',
      'Offene Werkstatt für Reparatur-Workshops',
      'Veranstaltungsraum für Vorträge und Meetups',
      'Café-Bereich für Community-Austausch'
    ]
  },
  workshops: {
    title: 'Workshops & Vorträge',
    topics: [
      'Linux-Grundlagen für Einsteiger',
      'Open-Source-Software im Alltag',
      'Nachhaltige KI und ihre Grenzen',
      'Alternative techno-ökonomische Modelle',
      'Reparatur-Workshops: Laptop, Smartphone, etc.',
      'Geschichte der Computerentwicklung'
    ]
  }
}

export function getFormattedAddress(): string {
  const { address, postalCode, city } = PHYSICAL_SPACE.current
  return `${address}, ${postalCode} ${city}`
}
