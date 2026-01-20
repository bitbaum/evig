/**
 * Number Sources Registry
 *
 * Maps every displayable number to its source, calculation method,
 * and confidence level for full traceability.
 *
 * IMPORTANT: This file uses methodology-ssot.ts as the SINGLE SOURCE OF TRUTH
 * for all methodology definitions. Never define methodology inline here.
 */

import type { NumberFormat } from '../types';
import { METHODOLOGIES, type MethodologyId } from './methodology-ssot';

// ============================================================================
// Types
// ============================================================================

export type SourceType = 'source' | 'derived' | 'estimated';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'no_data';

export interface NumberSourceDefinition {
  id: string;
  displayName: string;
  description: string;
  format: NumberFormat;
  source: {
    type: SourceType;
    confidence: ConfidenceLevel;
    methodology: string;
    accountCode?: string;
    accountName?: string;
  };
  formula?: {
    expression: string;
    humanReadable: string;
    dependencies?: string[];
  };
  limitations?: string[];
  relatedNumbers?: string[];
}

// ============================================================================
// Account Code Definitions (from Kivitendo)
// ============================================================================

export const ACCOUNT_CODES = {
  '30-38': {
    name: 'Nettoerlöse Total',
    description: 'Summe aller Nettoerlöse aus der Buchhaltung',
  },
  '3100': {
    name: 'Warenverkauf',
    description: 'Einnahmen aus dem Verkauf von IT-Geräten (Laptops, Desktops, Phones)',
  },
  '3400': {
    name: 'Dienstleistungen',
    description: 'Einnahmen aus Reparaturen, IT-Services und Beratung',
  },
  '3450': {
    name: 'Integrations-Arbeitsplätze',
    description: 'Einnahmen aus arbeitsmarktlichen Integrationsmassnahmen',
  },
  '3500': {
    name: 'Spenden',
    description: 'Freiwillige Spenden von Privatpersonen und Organisationen',
  },
  '3510': {
    name: 'Aufstockung Richtpreis',
    description: 'Freiwillige Mehrzahlungen über den Richtpreis hinaus',
  },
} as const;

// ============================================================================
// Source Definitions
// ============================================================================

const createSourceDefinition = (
  id: string,
  displayName: string,
  description: string,
  format: NumberFormat,
  accountCode: keyof typeof ACCOUNT_CODES,
): NumberSourceDefinition => ({
  id,
  displayName,
  description,
  format,
  source: {
    type: 'source',
    confidence: 'high',
    methodology: 'direct_kivitendo',
    accountCode,
    accountName: ACCOUNT_CODES[accountCode].name,
  },
  limitations: [
    'Nur CHF-Beträge, keine Stückzahlen',
    'Monatliche Granularität aus Buchhaltung',
  ],
});

const createDerivedDefinition = (
  id: string,
  displayName: string,
  description: string,
  format: NumberFormat,
  formula: { expression: string; humanReadable: string; dependencies: string[] },
  confidence: ConfidenceLevel = 'high',
): NumberSourceDefinition => ({
  id,
  displayName,
  description,
  format,
  source: {
    type: 'derived',
    confidence,
    methodology: 'calculated',
  },
  formula,
});

// ============================================================================
// Number Sources Registry
// ============================================================================

export function createNumberSources(year: number): Record<string, NumberSourceDefinition> {
  return {
    // ========== Direct Source Values ==========
    [`financial_total_${year}`]: createSourceDefinition(
      `financial_total_${year}`,
      `Gesamteinnahmen ${year}`,
      'Summe aller Nettoerlöse im Jahr',
      'CHF',
      '30-38'
    ),

    [`financial_warenverkauf_${year}`]: createSourceDefinition(
      `financial_warenverkauf_${year}`,
      `Warenverkauf ${year}`,
      'Einnahmen aus dem Verkauf von IT-Geräten',
      'CHF',
      '3100'
    ),

    [`financial_dienstleistungen_${year}`]: createSourceDefinition(
      `financial_dienstleistungen_${year}`,
      `Dienstleistungen ${year}`,
      'Einnahmen aus Reparaturen und IT-Services',
      'CHF',
      '3400'
    ),

    [`financial_integration_${year}`]: createSourceDefinition(
      `financial_integration_${year}`,
      `Integration ${year}`,
      'Einnahmen aus Integrations-Arbeitsplätzen',
      'CHF',
      '3450'
    ),

    [`financial_spenden_${year}`]: createSourceDefinition(
      `financial_spenden_${year}`,
      `Spenden ${year}`,
      'Freiwillige Spenden',
      'CHF',
      '3500'
    ),

    [`financial_aufstockung_${year}`]: createSourceDefinition(
      `financial_aufstockung_${year}`,
      `Aufstockung ${year}`,
      'Freiwillige Mehrzahlungen über Richtpreis',
      'CHF',
      '3510'
    ),

    // ========== Derived Values ==========
    [`financial_earned_${year}`]: createDerivedDefinition(
      `financial_earned_${year}`,
      `Eigenerwirtschaftet ${year}`,
      'Summe der selbst erwirtschafteten Einnahmen (ohne Spenden)',
      'CHF',
      {
        expression: 'warenverkauf + dienstleistungen + integration',
        humanReadable: 'Warenverkauf + Dienstleistungen + Integration',
        dependencies: [
          `financial_warenverkauf_${year}`,
          `financial_dienstleistungen_${year}`,
          `financial_integration_${year}`,
        ],
      }
    ),

    [`financial_donations_${year}`]: createDerivedDefinition(
      `financial_donations_${year}`,
      `Spenden & Förderung ${year}`,
      'Summe aller Spenden und freiwilligen Aufstockungen',
      'CHF',
      {
        expression: 'spenden + aufstockung',
        humanReadable: 'Spenden + Aufstockung Richtpreis',
        dependencies: [
          `financial_spenden_${year}`,
          `financial_aufstockung_${year}`,
        ],
      }
    ),

    [`financial_self_financing_${year}`]: createDerivedDefinition(
      `financial_self_financing_${year}`,
      `Eigenfinanzierungsquote ${year}`,
      'Anteil der selbst erwirtschafteten Einnahmen an den Gesamteinnahmen',
      'percent',
      {
        expression: '(earned / total) × 100',
        humanReadable: '(Eigenerwirtschaftet / Gesamteinnahmen) × 100',
        dependencies: [
          `financial_earned_${year}`,
          `financial_total_${year}`,
        ],
      }
    ),

    [`financial_monthly_avg_${year}`]: createDerivedDefinition(
      `financial_monthly_avg_${year}`,
      `Monatsdurchschnitt ${year}`,
      'Durchschnittliche Einnahmen pro Monat',
      'CHF',
      {
        expression: 'total / months_available',
        humanReadable: 'Gesamteinnahmen / Anzahl Monate mit Daten',
        dependencies: [`financial_total_${year}`],
      }
    ),
  };
}

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get number source definition by key
 */
export function getNumberSource(
  numberKey: string,
  year: number
): NumberSourceDefinition | null {
  const sources = createNumberSources(year);
  return sources[numberKey] || null;
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-red-100 text-red-800';
    case 'no_data':
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Get confidence description
 */
export function getConfidenceDescription(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Direkt aus Kivitendo-Buchhaltung, geprüfte Daten';
    case 'medium':
      return 'Berechnet aus geprüften Daten, Formel validiert';
    case 'low':
      return 'Schätzung oder Annahme, sollte verifiziert werden';
    case 'no_data':
      return 'Daten werden noch nicht erhoben';
  }
}

/**
 * Get source type description
 */
export function getSourceTypeDescription(type: SourceType): string {
  switch (type) {
    case 'source':
      return 'Direkter Wert aus Quelldaten';
    case 'derived':
      return 'Berechnet aus anderen Werten';
    case 'estimated':
      return 'Schätzung basierend auf Annahmen';
  }
}

// ============================================================================
// KPI Number Sources (All 28 KPIs)
// ============================================================================

/**
 * KPI Source Definitions
 * Each KPI has a unique ID that can be referenced from any component.
 * The methodology is always referenced from methodology-ssot.ts (SSOT)
 */

export interface KPISource {
  id: string;
  dimension: string;
  pillar: 'Umwelt' | 'Gesellschaft' | 'Bildung' | null;
  displayName: string;
  description: string;
  format: NumberFormat;
  unit: string;
  target: string;
  confidence: ConfidenceLevel;
  methodologyId: MethodologyId | null;
  dataSource: string;
  hasData: boolean;
  collectionMethod?: string;
  whyImportant: string;
  formula?: {
    expression: string;
    humanReadable: string;
    dependencies: string[];
  };
}

export const KPI_SOURCES: Record<string, KPISource> = {
  // ========== Umweltwirkung (Environmental) - Pillar: Umwelt ==========
  DEVICES_TOTAL: {
    id: 'DEVICES_TOTAL',
    dimension: 'Umweltwirkung',
    pillar: 'Umwelt',
    displayName: 'Geräte Total',
    description: 'Gesamtzahl der im Jahr verarbeiteten IT-Geräte',
    format: 'number',
    unit: 'Geräte',
    target: 'Wachstum',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Device Intake Tracking',
    hasData: false,
    collectionMethod: 'Jedes eingehende Gerät erfassen: Typ, Marke, Modell, Zustand',
    whyImportant: 'Grundlage für alle Umweltberechnungen. Ohne Stückzahlen keine Wirkungsmessung.',
  },

  REUSE_RATE: {
    id: 'REUSE_RATE',
    dimension: 'Umweltwirkung',
    pillar: 'Umwelt',
    displayName: 'Wiederverwendungsrate',
    description: 'Anteil der Geräte, die wiederverwendet statt recycelt werden',
    format: 'percent',
    unit: '%',
    target: '>70%',
    confidence: 'no_data',
    methodologyId: 'device_lifetime_extension',
    dataSource: 'Device Outcome Tracking',
    hasData: false,
    collectionMethod: 'Bei jedem Geräteausgang: Status erfassen (verkauft, gespendet, recycelt, Ersatzteile)',
    whyImportant: 'Wiederverwendung ist 10x besser als Recycling. Diese Rate zeigt unsere Kernwirkung.',
    formula: {
      expression: '(sold + donated) / total × 100',
      humanReadable: '(Verkauft + Gespendet) / Total × 100',
      dependencies: ['DEVICES_SOLD', 'DEVICES_DONATED', 'DEVICES_TOTAL'],
    },
  },

  CO2_AVOIDED: {
    id: 'CO2_AVOIDED',
    dimension: 'Umweltwirkung',
    pillar: 'Umwelt',
    displayName: 'CO₂ vermieden',
    description: 'Vermiedene CO₂-Emissionen durch Wiederverwendung statt Neuproduktion',
    format: 'number',
    unit: 'kg CO₂e',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'device_co2_avoided',
    dataSource: 'Berechnet aus Device Outcome + BAFU-Referenzwerten',
    hasData: false,
    collectionMethod: 'Automatisch berechnet wenn Device Tracking implementiert',
    whyImportant: 'Kernmetrik unserer Umweltwirkung. Zeigt konkret, was wir für das Klima tun.',
    formula: {
      expression: 'Σ(Geräte × (CO₂_Neuproduktion - CO₂_Aufbereitung))',
      humanReadable: 'Summe aller Geräte × (CO₂ Neugerät − CO₂ Aufbereitung)',
      dependencies: ['DEVICES_REUSED', 'CO2_PER_DEVICE'],
    },
  },

  EWASTE_AVOIDED: {
    id: 'EWASTE_AVOIDED',
    dimension: 'Umweltwirkung',
    pillar: 'Umwelt',
    displayName: 'E-Waste vermieden',
    description: 'Gewicht an Elektroschrott, der durch Wiederverwendung vermieden wurde',
    format: 'number',
    unit: 'kg',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'ewaste_prevention',
    dataSource: 'Berechnet aus Device Outcome + SENS-Referenzgewichten',
    hasData: false,
    collectionMethod: 'Automatisch berechnet wenn Device Tracking implementiert',
    whyImportant: 'E-Waste ist eines der grössten Umweltprobleme. Jedes kg zählt.',
    formula: {
      expression: 'Σ(Geräte × Durchschnittsgewicht)',
      humanReadable: 'Summe aller wiederverwendeten Geräte × Durchschnittsgewicht',
      dependencies: ['DEVICES_REUSED', 'DEVICE_WEIGHT'],
    },
  },

  LIFETIME_EXTENDED: {
    id: 'LIFETIME_EXTENDED',
    dimension: 'Umweltwirkung',
    pillar: 'Umwelt',
    displayName: 'Lebensjahre verlängert',
    description: 'Geschätzte zusätzliche Nutzungsjahre der wiederverwendeten Geräte',
    format: 'number',
    unit: 'Jahre',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'device_lifetime_extension',
    dataSource: 'Berechnet: Geräte × 4 Jahre (Annahme)',
    hasData: false,
    collectionMethod: 'Automatisch berechnet wenn Device Tracking implementiert',
    whyImportant: 'Jedes Jahr Verlängerung spart Ressourcen für ein neues Gerät.',
    formula: {
      expression: 'Geräte × 4 Jahre',
      humanReadable: 'Wiederverwendete Geräte × 4 Jahre durchschnittliche Verlängerung',
      dependencies: ['DEVICES_REUSED'],
    },
  },

  // ========== Soziale Wirkung (Social) - Pillar: Gesellschaft ==========
  INTEGRATION_MONTHS: {
    id: 'INTEGRATION_MONTHS',
    dimension: 'Soziale Wirkung',
    pillar: 'Gesellschaft',
    displayName: 'Personenmonate Integration',
    description: 'Summe der Personenmonate in Integrationsmassnahmen',
    format: 'number',
    unit: 'Personenmonate',
    target: 'Gemäss Kapazität',
    confidence: 'no_data',
    methodologyId: 'integration_effectiveness',
    dataSource: 'Teilhabe-Tracking',
    hasData: false,
    collectionMethod: 'Monatliche Erfassung: Person × Monate in Programm',
    whyImportant: 'Misst unseren direkten Beitrag zur Arbeitsmarktintegration.',
  },

  INTEGRATION_HOURS: {
    id: 'INTEGRATION_HOURS',
    dimension: 'Soziale Wirkung',
    pillar: 'Gesellschaft',
    displayName: 'Arbeitsstunden geleistet',
    description: 'Total der Arbeitsstunden von Personen in Integrationsmassnahmen',
    format: 'number',
    unit: 'Stunden',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'integration_effectiveness',
    dataSource: 'Teilhabe-Tracking',
    hasData: false,
    collectionMethod: 'Wöchentliche Stundenerfassung pro Person',
    whyImportant: 'Zeigt die Intensität unserer Integrationsmassnahmen.',
  },

  SKILLS_TRANSFERRED: {
    id: 'SKILLS_TRANSFERRED',
    dimension: 'Soziale Wirkung',
    pillar: 'Gesellschaft',
    displayName: 'Kompetenzen vermittelt',
    description: 'Anzahl der vermittelten IT-Kompetenzen an Teilnehmende',
    format: 'number',
    unit: 'Kompetenzen',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'education_transfer',
    dataSource: 'Kompetenz-Tracking',
    hasData: false,
    collectionMethod: 'Checkliste pro Teilnehmer: Welche Skills wurden erlernt',
    whyImportant: 'Qualitative Messung dessen, was Teilnehmende mitnehmen.',
  },

  JOB_MARKET_READY: {
    id: 'JOB_MARKET_READY',
    dimension: 'Soziale Wirkung',
    pillar: 'Gesellschaft',
    displayName: 'Arbeitsmarktfähigkeit verbessert',
    description: 'Anzahl Personen mit verbesserter Arbeitsmarktfähigkeit',
    format: 'number',
    unit: 'Personen',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'integration_effectiveness',
    dataSource: 'Abschluss-Assessment',
    hasData: false,
    collectionMethod: 'Assessment bei Programmende: Verbesserung dokumentieren',
    whyImportant: 'Das Ziel der Integration: Menschen für den Arbeitsmarkt fit machen.',
  },

  DIGITAL_PARTICIPATION: {
    id: 'DIGITAL_PARTICIPATION',
    dimension: 'Soziale Wirkung',
    pillar: 'Gesellschaft',
    displayName: 'Digitale Teilhabe ermöglicht',
    description: 'Geschätzte Anzahl Menschen mit verbessertem digitalem Zugang',
    format: 'number',
    unit: 'Personen',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'social_participation',
    dataSource: 'Berechnet: Günstig verkaufte Geräte × 1.5',
    hasData: false,
    collectionMethod: 'Automatisch aus Device Outcome (günstig verkauft)',
    whyImportant: 'Digitale Teilhabe ist heute essentiell. Wir ermöglichen Zugang.',
    formula: {
      expression: 'Günstige_Geräte × 1.5',
      humanReadable: 'Günstig verkaufte Geräte × 1.5 Personen pro Haushalt',
      dependencies: ['DEVICES_AFFORDABLE'],
    },
  },

  // ========== Zugänglichkeit (Accessibility) - Pillar: Gesellschaft ==========
  DEVICES_SOLD: {
    id: 'DEVICES_SOLD',
    dimension: 'Zugänglichkeit',
    pillar: 'Gesellschaft',
    displayName: 'Geräte verkauft',
    description: 'Anzahl der im Jahr verkauften Geräte',
    format: 'number',
    unit: 'Geräte',
    target: 'Nach Kapazität',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Device Outcome Tracking',
    hasData: false,
    collectionMethod: 'Bei Verkauf erfassen: Gerät-ID, Preis, Käufer-Typ',
    whyImportant: 'Grundmetrik für Reichweite unserer Geräte.',
  },

  DEVICES_DONATED: {
    id: 'DEVICES_DONATED',
    dimension: 'Zugänglichkeit',
    pillar: 'Gesellschaft',
    displayName: 'Geräte gespendet',
    description: 'Anzahl der kostenlos an Bedürftige abgegebenen Geräte',
    format: 'number',
    unit: 'Geräte',
    target: 'Nach Bedarf',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Device Outcome Tracking',
    hasData: false,
    collectionMethod: 'Bei Spende erfassen: Gerät-ID, Empfänger',
    whyImportant: 'Direkteste Form der sozialen Wirkung.',
  },

  PRICE_ACCESSIBILITY: {
    id: 'PRICE_ACCESSIBILITY',
    dimension: 'Zugänglichkeit',
    pillar: 'Gesellschaft',
    displayName: 'Preis-Zugänglichkeit',
    description: 'Durchschnittspreis unserer Geräte im Verhältnis zum Markt',
    format: 'percent',
    unit: '% unter Markt',
    target: '30-50% unter Markt',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Preisvergleich: Unsere Preise vs. Markt',
    hasData: false,
    collectionMethod: 'Quartalsweise Marktpreise erfassen, Vergleich berechnen',
    whyImportant: 'Zeigt, wie viel günstiger wir sind und wem wir Zugang ermöglichen.',
  },

  GEOGRAPHIC_REACH: {
    id: 'GEOGRAPHIC_REACH',
    dimension: 'Zugänglichkeit',
    pillar: 'Gesellschaft',
    displayName: 'Geografische Reichweite',
    description: 'Anzahl verschiedener PLZ/Kantone, in die wir liefern',
    format: 'number',
    unit: 'PLZ-Gebiete',
    target: 'Gesamte Schweiz',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Verkaufsdaten mit PLZ',
    hasData: false,
    collectionMethod: 'PLZ bei Verkauf erfassen, jährlich unique PLZs zählen',
    whyImportant: 'Zeigt unsere Reichweite über Zürich hinaus.',
  },

  CUSTOMER_SATISFACTION: {
    id: 'CUSTOMER_SATISFACTION',
    dimension: 'Zugänglichkeit',
    pillar: 'Gesellschaft',
    displayName: 'Kundenzufriedenheit',
    description: 'Durchschnittliche Bewertung durch Käufer',
    format: 'number',
    unit: '/5',
    target: '≥4.5/5',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Feedback-Umfragen',
    hasData: false,
    collectionMethod: 'Nach Kauf: Kurze Umfrage (5 Fragen) per Email',
    whyImportant: 'Zufriedene Kunden = nachhaltige Nutzung + Weiterempfehlung.',
  },

  // ========== Bildungswirkung (Educational) - Pillar: Bildung ==========
  LINUX_INSTALLATIONS: {
    id: 'LINUX_INSTALLATIONS',
    dimension: 'Bildungswirkung',
    pillar: 'Bildung',
    displayName: 'Linux-Installationen',
    description: 'Anzahl der mit Linux ausgelieferten Geräte',
    format: 'number',
    unit: 'Geräte',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'linux_adoption',
    dataSource: 'Device Outcome Tracking (OS-Feld)',
    hasData: false,
    collectionMethod: 'Bei jedem verkauften Gerät OS erfassen',
    whyImportant: 'Jede Linux-Installation ist Wissenstransfer zu Open Source.',
  },

  WORKSHOPS_HELD: {
    id: 'WORKSHOPS_HELD',
    dimension: 'Bildungswirkung',
    pillar: 'Bildung',
    displayName: 'Workshops durchgeführt',
    description: 'Anzahl der durchgeführten Schulungen und Workshops',
    format: 'number',
    unit: 'Workshops',
    target: '≥12/Jahr',
    confidence: 'no_data',
    methodologyId: 'workshop_impact',
    dataSource: 'Workshop-Tracking',
    hasData: false,
    collectionMethod: 'Nach jedem Workshop: Datum, Thema, Teilnehmende',
    whyImportant: 'Direkte Wissensvermittlung an die Community.',
  },

  WORKSHOP_PARTICIPANTS: {
    id: 'WORKSHOP_PARTICIPANTS',
    dimension: 'Bildungswirkung',
    pillar: 'Bildung',
    displayName: 'Workshop-Teilnehmende',
    description: 'Gesamtzahl der Workshop-Teilnahmen im Jahr',
    format: 'number',
    unit: 'Teilnehmende',
    target: 'Wachstum',
    confidence: 'no_data',
    methodologyId: 'workshop_impact',
    dataSource: 'Workshop-Tracking',
    hasData: false,
    collectionMethod: 'Teilnehmerliste pro Workshop führen',
    whyImportant: 'Reichweite unserer Bildungsarbeit.',
  },

  LEARNING_HOURS: {
    id: 'LEARNING_HOURS',
    dimension: 'Bildungswirkung',
    pillar: 'Bildung',
    displayName: 'Lernstunden vermittelt',
    description: 'Geschätzte Stunden des Wissenstransfers',
    format: 'number',
    unit: 'Stunden',
    target: 'Maximieren',
    confidence: 'no_data',
    methodologyId: 'education_transfer',
    dataSource: 'Berechnet: Teilnehmende × Stunden',
    hasData: false,
    collectionMethod: 'Automatisch aus Workshop/Integration-Daten',
    whyImportant: 'Quantifiziert unseren Bildungsbeitrag.',
    formula: {
      expression: '(Workshop_TN × Workshop_h) + (Integration × Lernanteil)',
      humanReadable: 'Workshop-Stunden + Lernanteil der Integrations-Arbeit',
      dependencies: ['WORKSHOP_PARTICIPANTS', 'INTEGRATION_HOURS'],
    },
  },

  KNOWHOW_PROJECTS: {
    id: 'KNOWHOW_PROJECTS',
    dimension: 'Bildungswirkung',
    pillar: 'Bildung',
    displayName: 'Knowhow-Projekte',
    description: 'Anzahl der Projekte mit Wissenstransfer-Fokus',
    format: 'number',
    unit: 'Projekte',
    target: 'Nach Kapazität',
    confidence: 'no_data',
    methodologyId: 'education_transfer',
    dataSource: 'Projekt-Tracking',
    hasData: false,
    collectionMethod: 'Projekte mit Bildungsfokus erfassen',
    whyImportant: '"Knowhow" ist Teil unseres Mottos - Projekte zeigen gelebte Werte.',
  },

  // ========== Finanzielle Nachhaltigkeit (Financial) ==========
  REV_TOTAL: {
    id: 'REV_TOTAL',
    dimension: 'Finanzielle Nachhaltigkeit',
    pillar: null,
    displayName: 'Gesamteinnahmen',
    description: 'Summe aller Einnahmen im Jahr',
    format: 'CHF',
    unit: 'CHF',
    target: 'Budget erreichen',
    confidence: 'high',
    methodologyId: 'direct_kivitendo',
    dataSource: 'Kivitendo Buchhaltung (Konto 30-38)',
    hasData: true,
    whyImportant: 'Grundlage für Missionsfinanzierung. Ohne Einnahmen keine Wirkung.',
  },

  COST_COVERAGE: {
    id: 'COST_COVERAGE',
    dimension: 'Finanzielle Nachhaltigkeit',
    pillar: null,
    displayName: 'Kostendeckung',
    description: 'Verhältnis Einnahmen zu Gesamtkosten',
    format: 'percent',
    unit: '%',
    target: '100%',
    confidence: 'medium',
    methodologyId: 'direct_kivitendo',
    dataSource: 'Buchhaltung: Einnahmen / Ausgaben',
    hasData: false,
    collectionMethod: 'Ausgaben-Export aus Kivitendo benötigt',
    whyImportant: 'Zeigt finanzielle Gesundheit. 100% = wir decken alle Kosten.',
    formula: {
      expression: 'Einnahmen / Ausgaben × 100',
      humanReadable: 'Gesamteinnahmen / Gesamtausgaben × 100',
      dependencies: ['REV_TOTAL', 'EXPENSES_TOTAL'],
    },
  },

  LIQUIDITY: {
    id: 'LIQUIDITY',
    dimension: 'Finanzielle Nachhaltigkeit',
    pillar: null,
    displayName: 'Liquiditätsreserve',
    description: 'Anzahl Monate, die mit aktuellen Reserven überbrückt werden können',
    format: 'number',
    unit: 'Monate',
    target: '≥3 Monate',
    confidence: 'medium',
    methodologyId: 'direct_kivitendo',
    dataSource: 'Buchhaltung: Bankbestand / Monatliche Ausgaben',
    hasData: false,
    collectionMethod: 'Kontostand am Stichtag / durchschnittliche Monatsausgaben',
    whyImportant: 'Sicherheit für Engpässe. 3 Monate = gesunder Puffer.',
    formula: {
      expression: 'Bankbestand / Durchschnittliche_Monatsausgaben',
      humanReadable: 'Kontostand / Durchschnittliche monatliche Ausgaben',
      dependencies: ['BANK_BALANCE', 'AVG_MONTHLY_EXPENSES'],
    },
  },

  SELF_SUFFICIENCY: {
    id: 'SELF_SUFFICIENCY',
    dimension: 'Finanzielle Nachhaltigkeit',
    pillar: null,
    displayName: 'Eigenerwirtschaftungsgrad',
    description: 'Anteil der selbst erwirtschafteten Einnahmen (ohne Spenden/Förderung)',
    format: 'percent',
    unit: '%',
    target: '60-70%',
    confidence: 'high',
    methodologyId: 'direct_kivitendo',
    dataSource: 'Kivitendo: (3100+3400+3450) / Total',
    hasData: true,
    whyImportant: 'Unabhängigkeit von externen Mitteln. Hoher Grad = nachhaltig.',
    formula: {
      expression: '(Warenverkauf + Dienstleistungen + Integration) / Total × 100',
      humanReadable: 'Eigenerwirtschaftet / Gesamteinnahmen × 100',
      dependencies: ['financial_earned', 'financial_total'],
    },
  },

  MISSION_INVEST: {
    id: 'MISSION_INVEST',
    dimension: 'Finanzielle Nachhaltigkeit',
    pillar: null,
    displayName: 'Missions-Investitionen',
    description: 'Anteil der Ausgaben, der direkt in die Mission fliesst',
    format: 'percent',
    unit: '%',
    target: '≥80%',
    confidence: 'low',
    methodologyId: 'direct_kivitendo',
    dataSource: 'Buchhaltung: Missions-bezogene Ausgaben / Total',
    hasData: false,
    collectionMethod: 'Ausgaben nach Missions-Bezug kategorisieren',
    whyImportant: 'Zeigt Effizienz: Wie viel kommt bei der Mission an?',
    formula: {
      expression: 'Direkte_Missionsausgaben / Gesamtausgaben × 100',
      humanReadable: 'Direkte Missionsausgaben / Gesamtausgaben × 100',
      dependencies: ['MISSION_EXPENSES', 'EXPENSES_TOTAL'],
    },
  },

  // ========== Betriebseffizienz (Operational) ==========
  TURNAROUND_DAYS: {
    id: 'TURNAROUND_DAYS',
    dimension: 'Betriebseffizienz',
    pillar: null,
    displayName: 'Durchlaufzeit',
    description: 'Durchschnittliche Tage von Eingang bis Verkauf/Spende',
    format: 'number',
    unit: 'Tage',
    target: '≤30 Tage',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Device Tracking: Eingang bis Ausgang',
    hasData: false,
    collectionMethod: 'Datum bei Eingang und Ausgang erfassen, Differenz berechnen',
    whyImportant: 'Effizienz-Indikator. Schneller = mehr Geräte = mehr Wirkung.',
  },

  QUALITY_RATE: {
    id: 'QUALITY_RATE',
    dimension: 'Betriebseffizienz',
    pillar: null,
    displayName: 'Qualitätsrate',
    description: 'Anteil der Geräte ohne Rückläufer/Reklamationen',
    format: 'percent',
    unit: '%',
    target: '≥95%',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Reklamations-Tracking',
    hasData: false,
    collectionMethod: 'Reklamationen erfassen, Quote berechnen',
    whyImportant: 'Qualität = Vertrauen = nachhaltige Nutzung.',
  },

  VOLUNTEER_EFFICIENCY: {
    id: 'VOLUNTEER_EFFICIENCY',
    dimension: 'Betriebseffizienz',
    pillar: null,
    displayName: 'Freiwilligen-Effizienz',
    description: 'Geräte pro Freiwilligen-Stunde',
    format: 'number',
    unit: 'Geräte/h',
    target: 'Optimieren',
    confidence: 'no_data',
    methodologyId: null,
    dataSource: 'Berechnet: Geräte / Freiwilligenstunden',
    hasData: false,
    collectionMethod: 'Freiwilligenstunden erfassen',
    whyImportant: 'Zeigt, wie effektiv wir Freiwilligenarbeit nutzen.',
    formula: {
      expression: 'Verarbeitete_Geräte / Freiwilligenstunden',
      humanReadable: 'Verarbeitete Geräte / Freiwilligenstunden',
      dependencies: ['DEVICES_TOTAL', 'VOLUNTEER_HOURS'],
    },
  },
};

// ============================================================================
// KPI Lookup Functions
// ============================================================================

/**
 * Get KPI source definition by ID
 */
export function getKPISource(kpiId: string): KPISource | null {
  return KPI_SOURCES[kpiId] || null;
}

/**
 * Get all KPIs for a specific dimension
 */
export function getKPIsByDimension(dimension: string): KPISource[] {
  return Object.values(KPI_SOURCES).filter(kpi => kpi.dimension === dimension);
}

/**
 * Get all KPIs for a specific pillar
 */
export function getKPIsByPillar(pillar: string): KPISource[] {
  return Object.values(KPI_SOURCES).filter(kpi => kpi.pillar === pillar);
}

/**
 * Get all dimensions
 */
export function getAllDimensions(): string[] {
  return [...new Set(Object.values(KPI_SOURCES).map(kpi => kpi.dimension))];
}

/**
 * Check if a KPI has data available
 */
export function hasKPIData(kpiId: string): boolean {
  const kpi = KPI_SOURCES[kpiId];
  return kpi?.hasData ?? false;
}
