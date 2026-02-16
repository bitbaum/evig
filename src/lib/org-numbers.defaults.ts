/**
 * Organizational Numbers — Client-safe Defaults
 *
 * Contains types, static defaults, and synchronous accessors.
 * Safe for client components — no DB dependency.
 *
 * For server-side DB queries, use org-numbers.ts (server-only).
 * Source: revamp-info NUMBERS_REGISTRY (audited 2026-02-16)
 */

// ============================================================================
// Types
// ============================================================================

export type OrgNumberCategory = 'impact' | 'social' | 'economic' | 'operations'
export type OrgNumberConfidence = 'high' | 'medium' | 'estimated' | 'target'

export interface OrgNumber {
  key: string
  value: string
  numericValue: number | null
  label: string
  category: OrgNumberCategory
  confidence: OrgNumberConfidence
  methodology: string | null
  calculation: string | null
  sourceDocument: string | null
  externalLink: string | null
  lastVerified: string
  updatedAt: string
}

// ============================================================================
// Static defaults (for SSG/build-time, client components, and fallback)
// ============================================================================

function d(
  key: string,
  value: string,
  numericValue: number | null,
  label: string,
  category: OrgNumberCategory,
  confidence: OrgNumberConfidence,
): OrgNumber {
  return {
    key, value, numericValue, label, category, confidence,
    methodology: null, calculation: null, sourceDocument: null,
    externalLink: null, lastVerified: '2026-02-16', updatedAt: '2026-02-16',
  }
}

export const ORG_NUMBERS_DEFAULTS: Record<string, OrgNumber> = {
  // Impact
  co2_production_new_laptop:     d('co2_production_new_laptop', '350', 350, 'kg CO₂ Herstellung neuer Laptop', 'impact', 'high'),
  co2_refurbishment:             d('co2_refurbishment', '65', 65, 'kg CO₂ Refurbishment', 'impact', 'high'),
  co2_savings_per_device:        d('co2_savings_per_device', '285', 285, 'kg CO₂ Einsparung pro Gerät', 'impact', 'high'),
  devices_sold_per_year:         d('devices_sold_per_year', '~150', 150, 'Geräte pro Jahr verkauft', 'impact', 'estimated'),
  devices_processed_per_year:    d('devices_processed_per_year', '~1000', 1000, 'Geräte pro Jahr verarbeitet', 'impact', 'estimated'),
  avg_device_weight_kg:          d('avg_device_weight_kg', '5', 5, 'kg Durchschnittsgewicht pro Gerät', 'impact', 'estimated'),
  reuse_rate:                    d('reuse_rate', '75%', 75, 'Wiederverwendungsrate', 'impact', 'estimated'),
  device_lifespan_extension_years: d('device_lifespan_extension_years', '5', 5, 'Jahre zusätzliche Nutzungsdauer', 'impact', 'estimated'),
  annual_co2_saved_tons:         d('annual_co2_saved_tons', '~43', 43, 'Tonnen CO₂ eingespart pro Jahr', 'impact', 'estimated'),
  annual_ewaste_prevented_tons:  d('annual_ewaste_prevented_tons', '~0.75', 0.75, 'Tonnen Elektroschrott verhindert', 'impact', 'estimated'),

  // Social
  people_helped_total:           d('people_helped_total', '100+', 100, 'Menschen begleitet seit 2003', 'social', 'medium'),
  annual_people_trained:         d('annual_people_trained', '20', 20, 'Personen jährlich geschult', 'social', 'estimated'),
  internship_success_rate:       d('internship_success_rate', '~40%', 40, 'Erfolgsquote Praktika', 'social', 'estimated'),
  annual_career_reentries:       d('annual_career_reentries', '~4', 4, 'Berufliche Wiedereinstiege pro Jahr', 'social', 'estimated'),

  // Operations
  founding_year:                 d('founding_year', '2003', 2003, 'Gründungsjahr', 'operations', 'high'),
  team_size_community:           d('team_size_community', '~20', 20, 'Team-Grösse (Community)', 'operations', 'medium'),
  team_fte:                      d('team_fte', '3', 3, 'FTE Kernteam', 'operations', 'high'),
  avg_device_price_chf:          d('avg_device_price_chf', '150', 150, 'CHF Durchschnittspreis pro Gerät', 'operations', 'estimated'),

  // Economic
  hourly_rate_chf:               d('hourly_rate_chf', '70', 70, 'CHF Stundensatz', 'economic', 'high'),
  assessment_fee_chf:            d('assessment_fee_chf', '30', 30, 'CHF Bewertungsgebühr', 'economic', 'high'),
  customer_savings_chf:          d('customer_savings_chf', '~800', 800, 'CHF durchschnittliche Kundeneinsparung', 'economic', 'estimated'),
  new_device_comparison_chf:     d('new_device_comparison_chf', '950', 950, 'CHF Vergleichspreis Neugerät', 'economic', 'estimated'),
  avg_repair_cost_chf:           d('avg_repair_cost_chf', '150', 150, 'CHF durchschnittliche Reparaturkosten', 'economic', 'estimated'),
  donation_impact_laptop_chf:    d('donation_impact_laptop_chf', '50', 50, 'CHF Spende: Laptop-Reparatur', 'economic', 'estimated'),
  donation_impact_internship_chf: d('donation_impact_internship_chf', '150', 150, 'CHF Spende: Monat Praktikumsstelle', 'economic', 'estimated'),
  donation_impact_data_recovery_chf: d('donation_impact_data_recovery_chf', '500', 500, 'CHF Spende: Datenrettung KMU', 'economic', 'estimated'),
  annual_budget_chf:             d('annual_budget_chf', '60000', 60000, 'CHF Jahresbudget (2025)', 'economic', 'high'),
}

// ============================================================================
// Convenience accessors (build-time safe, no async)
// ============================================================================

/** Get numeric value from defaults. Throws if key missing or not numeric. */
export function getDefaultNumeric(key: string): number {
  const entry = ORG_NUMBERS_DEFAULTS[key]
  if (!entry || entry.numericValue == null) {
    throw new Error(`ORG_NUMBERS_DEFAULTS.${key} not found or not numeric`)
  }
  return entry.numericValue
}

/** Get display value from defaults. */
export function getDefaultValue(key: string): string {
  const entry = ORG_NUMBERS_DEFAULTS[key]
  if (!entry) throw new Error(`ORG_NUMBERS_DEFAULTS.${key} not found`)
  return entry.value
}
