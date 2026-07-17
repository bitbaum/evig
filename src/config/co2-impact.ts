/**
 * CO₂ Impact Configuration — SSOT for every CO₂-avoidance figure.
 *
 * Model (published in full on /transparenz/co2):
 *
 *   avoided ≈ (production + distribution emissions of an average
 *              comparable NEW device) × (1 − refurbishment overhead)
 *
 * Sources — all open, all citable:
 *  - Per-category new-device values: ADEME / ARCEP 2025 (French state
 *    environment agency), published as open data + open source
 *    (impactco2.fr, github.com/incubateur-ademe/impactco2). Life-cycle
 *    totals AND the production/distribution phase split per device.
 *  - Refurbishment overhead: Circular Computing 2021 measured ~46 kg
 *    on a ~331 kg laptop footprint (≈14%); we deduct a conservative 15%.
 *  - Corroboration: Fraunhofer Austria / refurbed model (ISO 14040/44
 *    verified, 2024) puts refurb-vs-new savings at 69–91% of the full
 *    life cycle (⌀ 80%). Our laptop claim (150 kg of a 193 kg life
 *    cycle ≈ 78%) sits at the conservative end of that band.
 *  - RevampIT's own ZHAW LCA (PRELIMINARY, 2026) reports −82.7% GHG for
 *    the upcycling path — same order of magnitude.
 *
 * Principles:
 *  - NO number without a source (guarded by co2-impact.test.ts).
 *  - Categories without a defensible open factor show NO CO₂ claim at
 *    all — a hidden badge beats a made-up number.
 *  - Round DOWN to 5 kg; always render with `~` and a link to
 *    /transparenz/co2. Credibility comes from showing the math.
 */

/** Citable source attached to every factor. */
export interface Co2Source {
  name: string
  url: string
  year: number
}

export const CO2_SOURCES = {
  ademe: {
    name: 'ADEME / ARCEP — Base Empreinte, Studie «Empreinte environnementale du numérique» (Update 2025)',
    url: 'https://impactco2.fr/outils/numerique',
    year: 2025,
  },
  ademeOpenSource: {
    name: 'Impact CO₂ — offener Quellcode und Daten (ADEME)',
    url: 'https://github.com/incubateur-ademe/impactco2',
    year: 2025,
  },
  circularComputing: {
    name: 'Circular Computing / Cranfield University: «Carbon Footprint of a Laptop» (230-Laptop-Studie)',
    url: 'https://circularcomputing.com/news/carbon-footprint-laptop/',
    year: 2021,
  },
  fraunhoferRefurbed: {
    name: 'Fraunhofer Austria × refurbed: Ökobilanz-Berechnungsmodell, ISO 14040/44-verifiziert (GutCert)',
    url: 'https://www.refurbed.ch/sustainability/',
    year: 2024,
  },
  zhaw: {
    name: 'ZHAW Institut für Nachhaltige Entwicklung: LCA Upcycling-Projekt RevampIT (VORLÄUFIG)',
    url: '/projects/upcycling/wirkung',
    year: 2026,
  },
} as const satisfies Record<string, Co2Source>

/**
 * Refurbishment overhead deducted from the avoided new-device production:
 * transport, cleaning, testing, spare parts (battery), packaging.
 * Circular Computing 2021 measured ≈14% (46 kg of 331 kg) for a
 * commercial remanufacturing line incl. battery + intercontinental
 * shipping; we deduct 15% — conservative for RevampIT's local,
 * low-transport operation in Zürich.
 */
export const REFURB_OVERHEAD_SHARE = 0.15

/** Per-category factor — every field required, every entry citable. */
export interface Co2CategoryFactor {
  /** kg CO₂e, FULL life cycle of an average comparable new device (ADEME). */
  newDeviceLifecycleKg: number
  /** kg CO₂e, production + distribution phases only (ADEME phase split). */
  newDeviceProductionKg: number
  /** Which ADEME dataset entry the numbers come from. */
  ademeItem: string
  source: Co2Source
  /** Set when the mapping needs an explicit judgment call. */
  note?: string
}

const LAPTOP: Co2CategoryFactor = {
  newDeviceLifecycleKg: 192.6,
  newDeviceProductionKg: 182.3,
  ademeItem: 'Ordinateur portable',
  source: CO2_SOURCES.ademe,
}

const DESKTOP: Co2CategoryFactor = {
  newDeviceLifecycleKg: 259.2,
  newDeviceProductionKg: 204.8,
  ademeItem: 'Ordinateur fixe sans écran (professionnel)',
  source: CO2_SOURCES.ademe,
  // ADEME lists 300 kg for consumer desktops — we use the LOWER
  // professional value for every desktop class (conservative).
}

/**
 * CO₂ factors by KATEGORIEN code (config/erfassung/categories.ts).
 * Categories that have NO defensible open per-category factor (Drucker,
 * Komponenten, Peripherie — too heterogeneous or no ADEME entry) are
 * deliberately ABSENT: the UI shows no CO₂ claim for them.
 */
export const CATEGORY_CO2_FACTORS: Record<string, Co2CategoryFactor> = {
  // Laptop family
  '10': LAPTOP,
  '101': LAPTOP,
  '102': LAPTOP,
  '103': LAPTOP,
  '104': LAPTOP,
  '105': LAPTOP,

  // Desktop family
  '20': DESKTOP,
  '201': DESKTOP,
  '202': DESKTOP,
  '203': DESKTOP,
  '204': {
    ...LAPTOP,
    note: 'Mini-PCs: konservativ mit dem (tieferen) Notebook-Produktionswert angesetzt, nicht mit dem Desktop-Wert.',
  },

  // Displays
  '30': {
    newDeviceLifecycleKg: 92.6,
    newDeviceProductionKg: 65.9,
    ademeItem: "Écran d'ordinateur",
    source: CO2_SOURCES.ademe,
  },

  // Tablets
  '40': {
    newDeviceLifecycleKg: 87.1,
    newDeviceProductionKg: 83.9,
    ademeItem: 'Tablette',
    source: CO2_SOURCES.ademe,
  },

  // Smartphones
  '50': {
    newDeviceLifecycleKg: 80.2,
    newDeviceProductionKg: 79.3,
    ademeItem: 'Smartphone',
    source: CO2_SOURCES.ademe,
  },

  // Network gear (routers, switches — ADEME "Box" = home internet router)
  '90': {
    newDeviceLifecycleKg: 81.2,
    newDeviceProductionKg: 61.4,
    ademeItem: 'Box (Internet-Router)',
    source: CO2_SOURCES.ademe,
  },

  // '60' Drucker & Scanner, '70' Komponenten, '80' Peripherie:
  // intentionally no factor — no open per-category LCA we can stand
  // behind. No claim beats a guess.
}

/**
 * Average weight (kg) for a generic IT device when no category data is
 * available. Used ONLY for e-waste tonnage estimates — never for CO₂.
 */
export const AVG_DEVICE_WEIGHT_KG = 2.5

/** Fallback weight (kg) for listings with unknown category (≈ laptop). */
export const FALLBACK_DEVICE_WEIGHT_KG = 2.0

/**
 * Default weight estimates (kg) by category — e-waste tonnage only.
 * CO₂ is NEVER derived from weight (a weight×factor shortcut produced
 * indefensible numbers like 340 kg for a printer; removed 2026-07).
 */
export const CATEGORY_WEIGHT_KG: Record<string, number> = {
  '10': 2.0,   // Laptops
  '20': 8.0,   // Desktop PCs
  '30': 5.0,   // Monitore
  '40': 0.5,   // Tablets
  '50': 0.2,   // Smartphones
  '60': 6.0,   // Drucker & Scanner
  '70': 0.5,   // Komponenten (avg)
  '80': 0.3,   // Peripherie (avg)
  '90': 1.0,   // Netzwerk
  '101': 2.0, '102': 1.8, '103': 2.5, '104': 1.2, '105': 1.5,
  '201': 7.0, '202': 12.0, '203': 15.0, '204': 1.5,
  '701': 1.0, '702': 0.05, '703': 0.1, '704': 0.05,
  '801': 0.5, '802': 0.1, '805': 0.3,
}

/** Conservative rounding: DOWN to the nearest 5 kg. */
function floorTo5(kg: number): number {
  return Math.floor(kg / 5) * 5
}

/**
 * Estimate CO₂ avoided by buying this refurbished device instead of a
 * new one, in kg CO₂e — or `null` when the category has no defensible
 * factor (callers hide the badge entirely).
 *
 * avoided = newDeviceProductionKg × (1 − REFURB_OVERHEAD_SHARE),
 * rounded DOWN to 5 kg. Assumes the purchase replaces a new device;
 * the usage phase is excluded on both sides (a refurbished device
 * consumes the same electricity as a new one).
 */
export function estimateCO2Savings(category: string): number | null {
  const factor = CATEGORY_CO2_FACTORS[category]
  if (!factor) return null
  return floorTo5(factor.newDeviceProductionKg * (1 - REFURB_OVERHEAD_SHARE))
}

/** Which mode produced the estimate — kept for the methodology page. */
export function estimateCO2Source(category: string): 'direct' | null {
  return CATEGORY_CO2_FACTORS[category] ? 'direct' : null
}

/**
 * Display helper: small totals must not collapse to "~0 t".
 * Below 1 t the number is shown in kg (rounded down to 10 kg).
 */
export function co2DisplayValue(kg: number): { value: number; unit: 'kg' | 't' } {
  if (kg < 1000) return { value: Math.floor(kg / 10) * 10, unit: 'kg' }
  return { value: Math.round((kg / 1000) * 10) / 10, unit: 't' }
}
