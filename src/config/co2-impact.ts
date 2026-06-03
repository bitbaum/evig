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
 * Direct CO₂ savings values (kg CO₂e) for categories with a credible
 * category-specific LCA study. We prefer these over the weight × factor
 * approximation because they come from a primary source citing a real
 * study — same source used in org-numbers.defaults.ts.
 *
 * Categories without an override fall through to the weight-based
 * estimate (less precise, also conservative).
 */
const CATEGORY_CO2_KG_OVERRIDE: Record<string, number> = {
  // Laptop family — Circular Computing 2021 (230-laptop study) gives
  // ~285 kg CO₂e avoided per refurbished laptop. The weight-based formula
  // (2 kg × 57 = 114 kg) under-claims by ~60%, which is conservative but
  // wastes the credibility we already have in our cited number.
  '10':  285,   // Laptops
  '101': 285,   // Business Laptops
  '102': 285,   // Consumer Laptops
  '103': 285,   // Gaming Laptops
  '104': 285,   // Ultrabooks
  '105': 285,   // Convertibles
  // Desktops, monitors, smartphones, etc. don't yet have a per-category
  // citation — fall back to weight × factor. Add overrides here as we
  // wire in additional studies (e.g. Apple/Dell per-SKU PCFs).
}

/**
 * Estimate CO₂ savings for a product listing in kg CO₂e.
 *
 * Prefers a per-category cited value when available, else falls back
 * to weight × per-kg factor. Returns `null` if the category is unknown
 * (callers should hide the badge entirely — showing 0 or a guessed
 * number erodes credibility).
 *
 * Rounded to nearest 5 kg under 100, nearest 10 above — spurious
 * precision ("287.4 kg") signals over-confidence. Always render with
 * a `~` prefix and a link to /transparenz/co2 in the UI.
 */
export function estimateCO2Savings(category: string): number | null {
  const direct = CATEGORY_CO2_KG_OVERRIDE[category]
  const raw = direct ?? (CATEGORY_WEIGHT_KG[category] ?? 0) * CO2_PER_KG
  if (raw <= 0) return null
  const step = raw < 100 ? 5 : 10
  return Math.round(raw / step) * step
}

/** Internal: which mode produced the estimate, for the methodology page. */
export function estimateCO2Source(category: string): 'direct' | 'weight' | null {
  if (CATEGORY_CO2_KG_OVERRIDE[category] != null) return 'direct'
  if (CATEGORY_WEIGHT_KG[category] != null) return 'weight'
  return null
}

export { CATEGORY_CO2_KG_OVERRIDE }
