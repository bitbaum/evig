/**
 * CO2 Impact Configuration
 *
 * Estimates CO2 savings from reusing IT equipment instead of buying new.
 * Based on Fraunhofer IZM lifecycle analysis (2023):
 *   - Average IT device: ~285 kg CO2 for manufacturing per 5 kg device
 *   - Reuse avoids ~57 kg CO2 per kg of device weight
 *
 * These are conservative estimates. Actual savings depend on
 * device type, manufacturing location, and replacement frequency.
 */

/** kg CO2 saved per kg of reused device weight (Fraunhofer IZM 2023) */
export const CO2_PER_KG = 57

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
 * Estimate CO2 savings for a product listing.
 * Returns kg CO2 saved, or null if category is unknown.
 */
export function estimateCO2Savings(category: string): number | null {
  const weightKg = CATEGORY_WEIGHT_KG[category]
  if (weightKg == null) return null
  return Math.round(weightKg * CO2_PER_KG)
}
