/**
 * Seed script for org_numbers table
 *
 * Populates the shared SSOT table with reconciled organizational numbers.
 * Source of truth: revamp-info NUMBERS_REGISTRY (audited 2026-02-16)
 *
 * Usage: npx tsx scripts/db/seed-org-numbers.ts
 */

import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

interface OrgNumberRow {
  key: string
  value: string
  numeric_value: number | null
  label: string
  category: 'impact' | 'social' | 'economic' | 'operations'
  confidence: 'high' | 'medium' | 'estimated' | 'target'
  methodology: string | null
  calculation: string | null
  source_document: string | null
  external_link: string | null
  last_verified: string
}

const numbers: OrgNumberRow[] = [
  // ===== IMPACT =====
  {
    key: 'co2_production_new_laptop',
    value: '350',
    numeric_value: 350,
    label: 'kg CO₂ Herstellung neuer Laptop',
    category: 'impact',
    confidence: 'high',
    methodology: 'Fraunhofer IZM Studie 2023: Lifecycle Assessment Laptops',
    calculation: null,
    source_document: 'fraunhofer-izm-2023-co2-lifecycle.pdf',
    external_link: 'https://www.izm.fraunhofer.de/de/abteilungen/umwelt_energiemanagement.html',
    last_verified: '2026-02-16',
  },
  {
    key: 'co2_refurbishment', // gitleaks:allow
    value: '65',
    numeric_value: 65,
    label: 'kg CO₂ Refurbishment',
    category: 'impact',
    confidence: 'high',
    methodology: 'Fraunhofer IZM 2023: CO₂ für Aufbereitung inkl. Transport, Reinigung, Softwareinstallation',
    calculation: null,
    source_document: 'fraunhofer-izm-2023-co2-lifecycle.pdf',
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'co2_savings_per_device',
    value: '285',
    numeric_value: 285,
    label: 'kg CO₂ Einsparung pro Gerät',
    category: 'impact',
    confidence: 'high',
    methodology: 'Differenz Neuproduktion - Refurbishment',
    calculation: '350kg (Neuproduktion) - 65kg (Refurbishment) = 285kg',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'devices_sold_per_year',
    value: '~150',
    numeric_value: 150,
    label: 'Geräte pro Jahr verkauft',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Abgeleitet aus Warenverkauf-Umsatz (Kivitendo Konto 3100)',
    calculation: 'CHF 22k Warenverkauf (2025) ÷ ~CHF 150 Durchschnittspreis ≈ 150',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'devices_processed_per_year',
    value: '~1000',
    numeric_value: 1000,
    label: 'Geräte pro Jahr verarbeitet (inkl. Recycling, Teile, Spenden)',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Schätzung inkl. Recycling, Ersatzteilgewinnung, Gratis-Abgaben. Nicht systematisch erfasst.',
    calculation: 'Verkauf ~150 + Recycling + Teile + Spenden ≈ ~1000 verarbeitete Geräte',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'avg_device_weight_kg',
    value: '5',
    numeric_value: 5,
    label: 'kg Durchschnittsgewicht pro Gerät (inkl. Peripherie)',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Durchschnitt über Laptops, Desktops und zugehörige Peripheriegeräte',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'reuse_rate',
    value: '75%',
    numeric_value: 75,
    label: 'Wiederverwendungsrate',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Interne Auswertung: Anteil der eingegangenen Geräte, die wieder in Umlauf gebracht werden',
    calculation: '~75% refurbished und verkauft/gespendet, ~25% Ersatzteilgewinnung oder Recycling',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'device_lifespan_extension_years',
    value: '5',
    numeric_value: 5,
    label: 'Jahre zusätzliche Nutzungsdauer',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Erfahrungswerte aus 20+ Jahren Refurbishing: Linux verlängert Lebensdauer älterer Hardware signifikant',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'annual_co2_saved_tons', // gitleaks:allow
    value: '~43',
    numeric_value: 43,
    label: 'Tonnen CO₂ eingespart pro Jahr (verkaufte Geräte)',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Berechnet aus verkauften Geräten × CO₂-Einsparung pro Gerät',
    calculation: '150 Geräte × 285kg ÷ 1000 ≈ 43 Tonnen',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'annual_ewaste_prevented_tons',
    value: '~0.75',
    numeric_value: 0.75,
    label: 'Tonnen Elektroschrott verhindert pro Jahr (verkaufte Geräte)',
    category: 'impact',
    confidence: 'estimated',
    methodology: 'Gewicht der verkauften Geräte, die vor Entsorgung gerettet werden',
    calculation: '150 Geräte × 5kg ÷ 1000 = 0.75 Tonnen',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },

  // ===== SOCIAL =====
  {
    key: 'people_helped_total',
    value: '100+',
    numeric_value: 100,
    label: 'Menschen begleitet seit 2003',
    category: 'social',
    confidence: 'medium',
    methodology: 'Praktikanten + Volunteers + Workshop-Teilnehmer (nicht systematisch erfasst vor 2024)',
    calculation: 'Geschätzt basierend auf durchschnittlich 4-5 Personen/Jahr seit 2003',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'annual_people_trained',
    value: '20',
    numeric_value: 20,
    label: 'Personen jährlich geschult',
    category: 'social',
    confidence: 'estimated',
    methodology: 'Teilnehmer:innen an Workshops, Praktika und Weiterbildungsprogrammen pro Jahr',
    calculation: '~12 Praktikant:innen + ~6 Workshop-Teilnehmer + ~2 Langzeit-Teilnehmer',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'internship_success_rate',
    value: '~40%',
    numeric_value: 40,
    label: 'Erfolgsquote Praktika',
    category: 'social',
    confidence: 'estimated',
    methodology: 'Geschätzt auf Basis historischer Erfahrungswerte, nicht systematisch erhoben',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'annual_career_reentries',
    value: '~4',
    numeric_value: 4,
    label: 'Berufliche Wiedereinstiege pro Jahr',
    category: 'social',
    confidence: 'estimated',
    methodology: 'Abgeleitet aus Praktikantenzahl und Erfolgsquote',
    calculation: '~10 Praktikant:innen/Jahr × ~40% Erfolgsrate ≈ 4',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },

  // ===== OPERATIONS =====
  {
    key: 'founding_year',
    value: '2003',
    numeric_value: 2003,
    label: 'Gründungsjahr',
    category: 'operations',
    confidence: 'high',
    methodology: 'Handelsregister Eintrag, Gründungsjahr verifiziert',
    calculation: null,
    source_document: null,
    external_link: 'https://www.zefix.ch/',
    last_verified: '2026-02-16',
  },
  {
    key: 'team_size_community',
    value: '~20',
    numeric_value: 20,
    label: 'Team-Grösse (Community inkl. Freiwillige)',
    category: 'operations',
    confidence: 'medium',
    methodology: 'Kernteam + aktive Freiwillige + Praktikant:innen',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'team_fte',
    value: '3',
    numeric_value: 3,
    label: 'FTE Kernteam (bezahlte Stellen)',
    category: 'operations',
    confidence: 'high',
    methodology: 'Vero (Geschäftsleitung) + Dani (Operations) + Andreas (Strategie/Entwicklung)',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'avg_device_price_chf',
    value: '150',
    numeric_value: 150,
    label: 'CHF Durchschnittspreis pro Gerät',
    category: 'operations',
    confidence: 'estimated',
    methodology: 'Geschätzter Durchschnittspreis aus Warenverkauf / Geräteanzahl',
    calculation: 'Mix aus Laptops (CHF 100-300), Desktops (CHF 50-150), Monitore (CHF 30-80)',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },

  // ===== ECONOMIC =====
  {
    key: 'hourly_rate_chf',
    value: '70',
    numeric_value: 70,
    label: 'CHF Stundensatz',
    category: 'economic',
    confidence: 'high',
    methodology: 'Offizieller Stundensatz für Reparaturen und Dienstleistungen',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'assessment_fee_chf',
    value: '30',
    numeric_value: 30,
    label: 'CHF Bewertungsgebühr',
    category: 'economic',
    confidence: 'high',
    methodology: 'Pauschale für professionelle Geräte-Bewertung, wird in Reparaturkosten angerechnet',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'customer_savings_chf',
    value: '~800',
    numeric_value: 800,
    label: 'CHF durchschnittliche Kundeneinsparung',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Differenz Neugerätepreis - Reparaturkosten',
    calculation: 'CHF 950 (vergleichbares Neugerät) - CHF 150 (durchschnittliche Reparaturkosten) = CHF 800',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'new_device_comparison_chf',
    value: '950',
    numeric_value: 950,
    label: 'CHF Vergleichspreis Neugerät',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Durchschnittlicher Preis eines vergleichbaren neuen Laptops',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'avg_repair_cost_chf',
    value: '150',
    numeric_value: 150,
    label: 'CHF durchschnittliche Reparaturkosten',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Durchschnitt über alle Reparaturaufträge',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'donation_impact_laptop_chf',
    value: '50',
    numeric_value: 50,
    label: 'CHF Spende: Reparatur eines Laptops für eine Familie',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Materialkosten für Aufbereitung eines gespendeten Geräts',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'donation_impact_internship_chf',
    value: '150',
    numeric_value: 150,
    label: 'CHF Spende: Ein Monat Praktikumsstelle',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Anteilige Kosten für einen Monat Betreuung und Material',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'donation_impact_data_recovery_chf',
    value: '500',
    numeric_value: 500,
    label: 'CHF Spende: Vollständige Datenrettung für KMU',
    category: 'economic',
    confidence: 'estimated',
    methodology: 'Durchschnittliche Kosten einer vollständigen Datenrettung',
    calculation: null,
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
  {
    key: 'annual_budget_chf',
    value: '60000',
    numeric_value: 60000,
    label: 'CHF Jahresbudget (2025)',
    category: 'economic',
    confidence: 'high',
    methodology: 'Kivitendo Erfolgsrechnung 2025 (Volljahr)',
    calculation: 'Gesamteinnahmen: CHF 60\'402 (Warenverkauf 22k + Dienstleistungen 28k + Rest)',
    source_document: null,
    external_link: null,
    last_verified: '2026-02-16',
  },
]

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const row of numbers) {
      await client.query(
        `INSERT INTO org_numbers (key, value, numeric_value, label, category, confidence, methodology, calculation, source_document, external_link, last_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           numeric_value = EXCLUDED.numeric_value,
           label = EXCLUDED.label,
           category = EXCLUDED.category,
           confidence = EXCLUDED.confidence,
           methodology = EXCLUDED.methodology,
           calculation = EXCLUDED.calculation,
           source_document = EXCLUDED.source_document,
           external_link = EXCLUDED.external_link,
           last_verified = EXCLUDED.last_verified,
           updated_at = NOW()`,
        [
          row.key,
          row.value,
          row.numeric_value,
          row.label,
          row.category,
          row.confidence,
          row.methodology,
          row.calculation,
          row.source_document,
          row.external_link,
          row.last_verified,
        ]
      )
    }

    await client.query('COMMIT')
    console.log(`Seeded ${numbers.length} org_numbers successfully.`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
