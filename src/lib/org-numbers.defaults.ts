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
  opts: {
    methodology?: string | null
    calculation?: string | null
    sourceDocument?: string | null
    externalLink?: string | null
    lastVerified?: string
  } = {},
): OrgNumber {
  return {
    key, value, numericValue, label, category, confidence,
    methodology: opts.methodology ?? null,
    calculation: opts.calculation ?? null,
    sourceDocument: opts.sourceDocument ?? null,
    externalLink: opts.externalLink ?? null,
    lastVerified: opts.lastVerified ?? '2026-02-16',
    updatedAt: '2026-06-03',
  }
}

export const ORG_NUMBERS_DEFAULTS: Record<string, OrgNumber> = {
  // Impact — every CO₂ figure has a citation, a calculation, and a last-verified date.
  // Credibility comes from under-claiming, not under-explaining. Whenever a number is
  // touched, update lastVerified to the date the source was re-checked.
  co2_production_new_laptop: d(
    'co2_production_new_laptop', '331', 331,
    'kg CO₂e Herstellung neuer Laptop (LCA, repräsentativer Mittelwert)',
    'impact', 'medium',
    {
      methodology: 'Repräsentativer Mittelwert aus drei unabhängigen Studien zur Herstellungs-CO₂-Bilanz von Laptops. Wir verwenden den konservativeren Mittelwert (331 kg), nicht den Maximalwert.',
      calculation: 'Mittelwert: Circular Computing 2021 (331 kg, 230-Laptop-Studie), Öko-Institut/UBA 2020 (~214 kg, Range 169–259), Apple/Dell PER 2024 (147–322 kg pro Modell). Konservativ runden wir nach oben statt nach unten nicht.',
      sourceDocument: 'Circular Computing 2021: "Carbon Footprint of a Laptop"',
      externalLink: 'https://circularcomputing.com/news/carbon-footprint-laptop/',
      lastVerified: '2026-06-03',
    },
  ),
  co2_refurbishment: d(
    'co2_refurbishment', '46', 46,
    'kg CO₂e Aufbereitung pro Laptop',
    'impact', 'medium',
    {
      methodology: 'Strom, Test-/Diagnoseaufwand, Ersatzteile (häufig Akku, RAM, SSD), Verpackung. Schweizer Strommix (~12 g CO₂e/kWh) zugrunde gelegt.',
      calculation: '~46 kg CO₂e = Strom (15 kWh × 0,012 kg) + Akku (~30 kg) + Versand + Verpackung (~16 kg). Konservative Annahme.',
      sourceDocument: 'Circular Computing 2021, Tabelle 3 (Refurbishment-Footprint)',
      externalLink: 'https://circularcomputing.com/news/carbon-footprint-laptop/',
      lastVerified: '2026-06-03',
    },
  ),
  co2_savings_per_device: d(
    'co2_savings_per_device', '285', 285,
    'kg CO₂e Einsparung pro aufbereitetem Laptop (Mittelwert)',
    'impact', 'medium',
    {
      methodology: 'Vermiedene Neugerät-Herstellung minus Aufbereitungsaufwand. Gilt für die Kategorie Laptop (~2 kg).',
      calculation: '331 (Neugerät) − 46 (Aufbereitung) = 285 kg CO₂e pro Laptop.',
      sourceDocument: 'Eigene Berechnung aus den darüberstehenden Werten',
      externalLink: 'https://circularcomputing.com/news/carbon-footprint-laptop/',
      lastVerified: '2026-06-03',
    },
  ),
  // Per-kilogram emission factor — used for category-by-weight CO₂ estimates on shop / marketplace.
  co2_factor_per_kg_device: d(
    'co2_factor_per_kg_device', '57', 57,
    'kg CO₂e vermieden pro kg Gerätegewicht (Schätzfaktor)',
    'impact', 'estimated',
    {
      methodology: 'Konservativer Mittelwert für die Herstellung-Phase eines durchschnittlichen IT-Geräts. Nur für die Kategorie-basierte Anzeige; modellgenaue Werte (Apple/Dell PER) sind genauer.',
      calculation: 'Mittelwert aus Laptop (~165 kg/kg), Desktop (~44 kg/kg), Monitor (~56 kg/kg), Smartphone (~350 kg/kg). Stark vereinfacht — siehe Methodik.',
      sourceDocument: 'Öko-Institut / UBA 2020 "Umweltbilanzen Notebook"; Apple PER 2024',
      externalLink: 'https://www.umweltbundesamt.de/publikationen/oekologische-bewertung-von-notebooks',
      lastVerified: '2026-06-03',
    },
  ),
  devices_sold_per_year:         d('devices_sold_per_year', '~150', 150, 'Geräte pro Jahr verkauft', 'impact', 'estimated'),
  devices_processed_per_year:    d('devices_processed_per_year', '~1000', 1000, 'Geräte pro Jahr verarbeitet', 'impact', 'estimated'),
  avg_device_weight_kg:          d('avg_device_weight_kg', '5', 5, 'kg Durchschnittsgewicht pro Gerät', 'impact', 'estimated'),
  reuse_rate:                    d('reuse_rate', '75%', 75, 'Wiederverwendungsrate', 'impact', 'estimated'),
  device_lifespan_extension_years: d('device_lifespan_extension_years', '5', 5, 'Jahre zusätzliche Nutzungsdauer', 'impact', 'estimated'),
  annual_co2_saved_tons: d(
    'annual_co2_saved_tons', '~43', 43,
    'Tonnen CO₂ eingespart pro Jahr',
    'impact', 'estimated',
    {
      methodology: 'Hochrechnung aus verkauften Geräten × durchschnittlicher Einsparung pro Gerät.',
      calculation: '~150 Geräte/Jahr × 285 kg = ~42.750 kg ≈ 43 t.',
      sourceDocument: 'Eigene Berechnung aus devices_sold_per_year und co2_savings_per_device',
      externalLink: null,
      lastVerified: '2026-06-03',
    },
  ),
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
