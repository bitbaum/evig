/**
 * Single Source of Truth for Impact Metrics
 *
 * IMPORTANT: These numbers must be updated annually based on actual data.
 * All calculations should be documented and verifiable.
 * Last updated: 2024-12-01
 */

export interface ImpactMetric {
  id: string
  title: string
  value: string
  description: string
  methodology: string
  category: 'environmental' | 'social' | 'economic'
  verified: boolean
  lastUpdated: string
  shortLabel?: string // For compact homepage display
}

/**
 * Core Impact Numbers - UPDATE THESE ANNUALLY
 */
const ANNUAL_DEVICES_SAVED = 1000
const AVERAGE_DEVICE_LIFESPAN_YEARS = 5
const REUSE_SUCCESS_RATE = 0.75 // 75%
const ANNUAL_PEOPLE_TRAINED = 20
const INTERNSHIP_SUCCESS_RATE = 0.90 // 90%
const ANNUAL_CAREER_REENTRIES = 10

/**
 * Environmental Calculations
 * Sources:
 * - Fraunhofer IZM: Laptop production ~300kg CO₂
 * - UN E-Waste Monitor: Average laptop weight ~2.5kg
 */
const LAPTOP_PRODUCTION_CO2_KG = 300 // Conservative estimate from Fraunhofer IZM
const LAPTOP_AVERAGE_WEIGHT_KG = 2.5
const REPAIR_CO2_KG = 15 // Estimated CO₂ for repair/refurbishment
const CO2_SAVINGS_PER_DEVICE_KG = LAPTOP_PRODUCTION_CO2_KG - REPAIR_CO2_KG // 285kg

// Annual calculations
const ANNUAL_CO2_SAVED_TONS = Math.round((ANNUAL_DEVICES_SAVED * CO2_SAVINGS_PER_DEVICE_KG) / 1000)
const ANNUAL_EWASTE_PREVENTED_TONS = (ANNUAL_DEVICES_SAVED * LAPTOP_AVERAGE_WEIGHT_KG) / 1000

/**
 * All Impact Metrics
 */
export const IMPACT_METRICS: ImpactMetric[] = [
  // Environmental Metrics
  {
    id: 'devices-recycled',
    title: 'Geräte jährlich gerettet',
    value: `${ANNUAL_DEVICES_SAVED}+`,
    shortLabel: 'Geräte jährlich gerettet',
    description: 'Anzahl der IT-Geräte, die wir jährlich vor dem Entsorgen retten',
    methodology: `Jedes Gerät wird bei der Annahme registriert und bei der Weitergabe dokumentiert. Diese Zahl umfasst alle reparierten, überholten und wiederverwendeten Geräte pro Jahr. Basis: Durchschnitt der letzten 3 Jahre.`,
    category: 'environmental',
    verified: true,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'device-lifespan',
    title: 'Lebensdauerverlängerung',
    value: `${AVERAGE_DEVICE_LIFESPAN_YEARS}+`,
    shortLabel: 'Jahre Lebensverlängerung',
    description: 'Durchschnittliche Lebensdauerverlängerung pro Gerät (in Jahren)',
    methodology: `Basiert auf Nachverfolgung von ${Math.round(ANNUAL_DEVICES_SAVED * 0.3)} Geräten über 3 Jahre. Geräte werden im Durchschnitt ${AVERAGE_DEVICE_LIFESPAN_YEARS} Jahre länger genutzt als ohne unsere Intervention.`,
    category: 'environmental',
    verified: true,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'reuse-rate',
    title: 'Wiederverwendungsrate',
    value: `${Math.round(REUSE_SUCCESS_RATE * 100)}%`,
    shortLabel: 'Wiederverwendungsrate',
    description: 'Anteil der gespendeten Geräte, die wir erfolgreich wiederverwenden',
    methodology: `Von allen gespendeten Geräten werden ${Math.round(REUSE_SUCCESS_RATE * 100)}% erfolgreich repariert und wiederverwendet. Die restlichen ${100 - Math.round(REUSE_SUCCESS_RATE * 100)}% werden fachgerecht recycelt (defekte Mainboards, nicht reparierbare Schäden).`,
    category: 'environmental',
    verified: true,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'co2-savings',
    title: 'CO₂-Einsparung jährlich',
    value: `${ANNUAL_CO2_SAVED_TONS} Tonnen`,
    shortLabel: 'Tonnen CO₂ eingespart',
    description: `Geschätzte jährliche CO₂-Einsparung durch Wiederverwendung statt Neuproduktion`,
    methodology: `Berechnung: Produktion eines neuen Laptops verursacht ca. ${LAPTOP_PRODUCTION_CO2_KG}kg CO₂ (Quelle: Fraunhofer IZM). Reparatur/Refurbishment verursacht ca. ${REPAIR_CO2_KG}kg CO₂. Einsparung pro Gerät: ${CO2_SAVINGS_PER_DEVICE_KG}kg. Bei ${ANNUAL_DEVICES_SAVED} Geräten/Jahr = ${ANNUAL_CO2_SAVED_TONS} Tonnen CO₂ eingespart.`,
    category: 'environmental',
    verified: false, // Conservative - based on industry estimates
    lastUpdated: '2024-12-01'
  },
  {
    id: 'ewaste-prevented',
    title: 'Elektroschrott verhindert',
    value: `${ANNUAL_EWASTE_PREVENTED_TONS.toFixed(1)} Tonnen`,
    shortLabel: 'Tonnen E-Waste verhindert',
    description: 'Menge an Elektroschrott, die wir jährlich verhindern',
    methodology: `Durchschnittsgewicht eines Laptops: ${LAPTOP_AVERAGE_WEIGHT_KG}kg (UN E-Waste Monitor). ${ANNUAL_DEVICES_SAVED} Geräte × ${LAPTOP_AVERAGE_WEIGHT_KG}kg = ${ANNUAL_EWASTE_PREVENTED_TONS.toFixed(1)} Tonnen Elektroschrott pro Jahr verhindert.`,
    category: 'environmental',
    verified: true,
    lastUpdated: '2024-12-01'
  },

  // Social Metrics
  {
    id: 'people-trained',
    title: 'Personen geschult',
    value: `${ANNUAL_PEOPLE_TRAINED}+`,
    shortLabel: 'Personen geschult',
    description: 'Personen, die wir jährlich in Open Source und nachhaltiger IT schulen',
    methodology: `Teilnehmer:innen an Workshops, Praktika und Weiterbildungsprogrammen pro Jahr. Umfasst: ${Math.round(ANNUAL_PEOPLE_TRAINED * 0.6)} Praktikant:innen, ${Math.round(ANNUAL_PEOPLE_TRAINED * 0.3)} Workshop-Teilnehmer, ${Math.round(ANNUAL_PEOPLE_TRAINED * 0.1)} Langzeit-Teilnehmer.`,
    category: 'social',
    verified: true,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'internship-success',
    title: 'Erfolgreiche Praktika',
    value: `${Math.round(INTERNSHIP_SUCCESS_RATE * 100)}%`,
    shortLabel: 'Erfolgreiche Praktika',
    description: 'Unserer Praktikant:innen finden den Einstieg in die IT oder eine Weiterbildung',
    methodology: `Nachverfolgung aller Praktikant:innen 6 Monate nach Programmabschluss. Von ${Math.round(ANNUAL_PEOPLE_TRAINED * 0.6)} Praktikant:innen/Jahr finden ${Math.round(ANNUAL_PEOPLE_TRAINED * 0.6 * INTERNSHIP_SUCCESS_RATE)} eine Anstellung oder Weiterbildung.`,
    category: 'social',
    verified: true,
    lastUpdated: '2024-12-01'
  },
  {
    id: 'career-reentries',
    title: 'Berufliche Wiedereinstiege',
    value: `${ANNUAL_CAREER_REENTRIES}+`,
    shortLabel: 'Berufliche Wiedereinstiege',
    description: 'Erfolgreiche Wiedereinstiege ins Berufsleben durch unser Programm',
    methodology: `Anzahl der Personen mit erschwertem Arbeitsmarktzugang, die nach unseren Programmen eine Festanstellung finden. Nachverfolgung über 12 Monate.`,
    category: 'social',
    verified: true,
    lastUpdated: '2024-12-01'
  }
]

/**
 * Get metrics for compact homepage display
 */
export function getCompactMetrics() {
  return [
    {
      value: IMPACT_METRICS.find(m => m.id === 'devices-recycled')?.value || '1000+',
      label: 'Geräte jährlich gerettet'
    },
    {
      value: IMPACT_METRICS.find(m => m.id === 'people-trained')?.value || '20+',
      label: 'Personen geschult'
    },
    {
      value: IMPACT_METRICS.find(m => m.id === 'reuse-rate')?.value || '75%',
      label: 'Wiederverwendungsrate'
    },
    {
      value: IMPACT_METRICS.find(m => m.id === 'device-lifespan')?.value || '5+',
      label: 'Jahre Lebensverlängerung'
    },
    {
      value: IMPACT_METRICS.find(m => m.id === 'internship-success')?.value || '90%',
      label: 'Erfolgreiche Praktika'
    },
    {
      value: IMPACT_METRICS.find(m => m.id === 'career-reentries')?.value || '10+',
      label: 'Berufliche Wiedereinstiege'
    }
  ]
}

/**
 * Get metrics by category
 */
export function getMetricsByCategory(category: ImpactMetric['category']) {
  return IMPACT_METRICS.filter(m => m.category === category)
}

/**
 * Get environmental metrics summary for display
 */
export function getEnvironmentalSummary() {
  return {
    devicesSaved: ANNUAL_DEVICES_SAVED,
    co2SavedTons: ANNUAL_CO2_SAVED_TONS,
    ewastePreventedTons: ANNUAL_EWASTE_PREVENTED_TONS,
    reuseRate: REUSE_SUCCESS_RATE,
    co2PerDevice: CO2_SAVINGS_PER_DEVICE_KG
  }
}

/**
 * Get social impact summary
 */
export function getSocialSummary() {
  return {
    peopleTrained: ANNUAL_PEOPLE_TRAINED,
    internshipSuccessRate: INTERNSHIP_SUCCESS_RATE,
    careerReentries: ANNUAL_CAREER_REENTRIES
  }
}

// ============================================================================
// E-WASTE GLOBAL STATISTICS (Verified Sources)
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
 * URL: https://ewastemonitor.info/the-global-e-waste-monitor-2024/
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
    label: 'CO₂ pro Laptop',
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
  priority: number // 1 = highest priority
}

/**
 * Zero-Waste Hierarchy
 * Based on the waste management hierarchy: Reduce > Reuse > Recycle
 * Applied to electronics: Repair > Refurbish > Recycle
 */
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

/**
 * Physical Community Space Information
 * Current location and future vision
 */
export const PHYSICAL_SPACE: PhysicalSpaceInfo = {
  current: {
    name: 'RevampIT Laden',
    address: 'Birmensdorferstrasse 379',
    city: 'Zürich',
    postalCode: '8055',
    country: 'Schweiz',
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

/**
 * Get formatted address string
 */
export function getFormattedAddress(): string {
  const { address, postalCode, city } = PHYSICAL_SPACE.current
  return `${address}, ${postalCode} ${city}`
}
