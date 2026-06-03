/**
 * CO2 Impact Configuration
 *
 * Estimates CO2 savings from reusing IT equipment instead of buying new.
 * The emission factor below is sourced from org-numbers.defaults.ts —
 * single source of truth for every CO₂ figure with citations attached
 * (see /transparenz/co2 page for the linked methodology).
 *
 * These are conservative estimates. Actual savings depend on device
 * type, manufacturing location, and replacement frequency. Always
 * label outputs with `~` and link to /transparenz/co2 — credibility
 * comes from showing the math, not from the headline number.
 */

import { getDefaultNumeric } from '@/lib/org-numbers.defaults'

/**
 * kg CO₂e avoided per kg of refurbished device — derived from
 * `co2_factor_per_kg_device` in `org-numbers.defaults.ts`. That entry
 * carries methodology + sourceDocument + externalLink + lastVerified.
 */
export const CO2_PER_KG: number = getDefaultNumeric('co2_factor_per_kg_device')

/**
 * Average weight (kg) for a generic IT device when no category data is available.
 * Used for shop sales without category breakdown and for total e-waste estimation.
 */
export const AVG_DEVICE_WEIGHT_KG = 2.5

/**
 * Fallback weight (kg) for P2P listings where the category is unknown.
 * Matches average laptop weight (category '10').
 */
export const FALLBACK_DEVICE_WEIGHT_KG = 2.0

/**
 * Default weight estimates (kg) by main category.
 * Category values from KATEGORIEN in config/erfassung/categories.ts
 */
export const CATEGORY_WEIGHT_KG: Record<string, number> = {
  // Main categories
  '10': 2.0,   // Laptops
  '20': 8.0,   // Desktop PCs
  '30': 5.0,   // Monitore
  '40': 0.5,   // Tablets
  '50': 0.2,   // Smartphones
  '60': 6.0,   // Drucker & Scanner
  '70': 0.5,   // Komponenten (avg)
  '80': 0.3,   // Peripherie (avg)
  '90': 1.0,   // Netzwerk

  // Sub-categories with specific overrides
  '101': 2.0,  // Business Laptops
  '102': 1.8,  // Consumer Laptops
  '103': 2.5,  // Gaming Laptops
  '104': 1.2,  // Ultrabooks
  '105': 1.5,  // Convertibles
  '201': 7.0,  // Office PCs
  '202': 12.0, // Gaming PCs
  '203': 15.0, // Workstations
  '204': 1.5,  // Mini PCs
  '701': 1.0,  // Grafikkarten
  '702': 0.05, // RAM
  '703': 0.1,  // SSDs/HDDs
  '704': 0.05, // CPUs
  '801': 0.5,  // Tastaturen
  '802': 0.1,  // Mäuse
  '805': 0.3,  // Docking Stations
}

/**
 * Estimate CO₂ savings for a product listing in kg CO₂e.
 *
 * Returns `null` if the category isn't in CATEGORY_WEIGHT_KG (callers
 * should hide the badge entirely rather than display a fallback —
 * showing 0 or a guessed number erodes credibility).
 *
 * Rounded to nearest 5 kg under 100, nearest 10 above — spurious
 * precision ("287.4 kg") signals over-confidence. Always render with
 * a `~` prefix and a link to /transparenz/co2 in the UI.
 */
export function estimateCO2Savings(category: string): number | null {
  const weightKg = CATEGORY_WEIGHT_KG[category]
  if (weightKg == null) return null
  const raw = weightKg * CO2_PER_KG
  if (raw <= 0) return null
  const step = raw < 100 ? 5 : 10
  return Math.round(raw / step) * step
}
