/**
 * Methodology Single Source of Truth (SSOT)
 *
 * This file is THE canonical source for all methodologies, formulas,
 * and scientific references used in the Hirn dashboard.
 *
 * IMPORTANT: All pages MUST import methodology from here.
 * Never define methodology inline in components.
 */

// ============================================================================
// Scientific References
// ============================================================================

export interface ScientificReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  source: string;
  url?: string;
  doi?: string;
  description: string;
}

export const SCIENTIFIC_REFERENCES: Record<string, ScientificReference> = {
  // Environmental Impact References
  BAFU_LIFECYCLE_2023: {
    id: 'BAFU_LIFECYCLE_2023',
    title: 'Ökobilanzen von Elektro- und Elektronikgeräten',
    authors: 'BAFU (Bundesamt für Umwelt)',
    year: 2023,
    source: 'Bundesamt für Umwelt (Schweiz)',
    url: 'https://www.bafu.admin.ch/',
    description: 'Schweizer Referenz für Ökobilanzen elektronischer Geräte, inkl. CO₂-Äquivalente für Produktion und Entsorgung',
  },

  EU_JRC_CIRCULAR_2020: {
    id: 'EU_JRC_CIRCULAR_2020',
    title: 'Assessment of the Environmental Performance of Circular Economy Actions',
    authors: 'European Commission Joint Research Centre',
    year: 2020,
    source: 'EU JRC Technical Reports',
    doi: '10.2760/674',
    description: 'EU-weite Methodik zur Bewertung von Kreislaufwirtschaftsmassnahmen',
  },

  SENS_ERECYCLING_2024: {
    id: 'SENS_ERECYCLING_2024',
    title: 'SENS eRecycling Jahresbericht',
    authors: 'SENS Stiftung',
    year: 2024,
    source: 'SENS eRecycling',
    url: 'https://www.sens.ch/',
    description: 'Schweizer Referenz für E-Waste-Recycling und Rückgewinnungsraten',
  },

  KANTON_ZH_KREISLAUF_2023: {
    id: 'KANTON_ZH_KREISLAUF_2023',
    title: 'Kreislaufwirtschaft im Kanton Zürich',
    authors: 'Amt für Abfall, Wasser, Energie und Luft (AWEL)',
    year: 2023,
    source: 'Kanton Zürich',
    url: 'https://www.zh.ch/de/umwelt-tiere/abfall-ressourcen.html',
    description: 'Kantonale Richtlinien und Referenzwerte für Kreislaufwirtschaft',
  },

  FRAUNHOFER_REUSE_2022: {
    id: 'FRAUNHOFER_REUSE_2022',
    title: 'Environmental Benefits of IT Hardware Reuse',
    authors: 'Fraunhofer IZM',
    year: 2022,
    source: 'Fraunhofer Institut für Zuverlässigkeit und Mikrointegration',
    description: 'Studie zu Umweltvorteilen durch IT-Hardware-Wiederverwendung vs. Recycling',
  },

  // Social Impact References
  SECO_INTEGRATION_2023: {
    id: 'SECO_INTEGRATION_2023',
    title: 'Arbeitsmarktliche Integrationsmaschnahmen – Wirkungsanalyse',
    authors: 'SECO (Staatssekretariat für Wirtschaft)',
    year: 2023,
    source: 'Staatssekretariat für Wirtschaft',
    url: 'https://www.seco.admin.ch/',
    description: 'Schweizer Referenz für Wirkungsmessung arbeitsmarktlicher Massnahmen',
  },

  BSV_TEILHABE_2022: {
    id: 'BSV_TEILHABE_2022',
    title: 'Teilhabe und Inklusion in der Schweiz',
    authors: 'BSV (Bundesamt für Sozialversicherungen)',
    year: 2022,
    source: 'Bundesamt für Sozialversicherungen',
    url: 'https://www.bsv.admin.ch/',
    description: 'Methodik zur Messung sozialer Teilhabe und Inklusion',
  },

  // Educational Impact References
  LPI_LINUX_2023: {
    id: 'LPI_LINUX_2023',
    title: 'Linux Professional Institute Certification Standards',
    authors: 'Linux Professional Institute',
    year: 2023,
    source: 'LPI',
    url: 'https://www.lpi.org/',
    description: 'Internationale Standards für Linux-Kompetenznachweis',
  },

  DIGITALE_GESELLSCHAFT_2024: {
    id: 'DIGITALE_GESELLSCHAFT_2024',
    title: 'Digitale Inklusion in der Schweiz',
    authors: 'Digitale Gesellschaft Schweiz',
    year: 2024,
    source: 'Digitale Gesellschaft',
    url: 'https://www.digitale-gesellschaft.ch/',
    description: 'Methodik zur Messung digitaler Teilhabe und Kompetenzvermittlung',
  },
};

// ============================================================================
// Methodology Definitions
// ============================================================================

export type MethodologyId =
  | 'direct_kivitendo'
  | 'device_co2_avoided'
  | 'device_lifetime_extension'
  | 'material_recovery'
  | 'ewaste_prevention'
  | 'social_participation'
  | 'integration_effectiveness'
  | 'education_transfer'
  | 'workshop_impact'
  | 'linux_adoption';

export interface Methodology {
  id: MethodologyId;
  name: string;
  category: 'financial' | 'environmental' | 'social' | 'educational';
  pillar: 'Umwelt' | 'Gesellschaft' | 'Bildung' | null;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  formula?: Formula;
  references: string[]; // Reference IDs
  assumptions: string[];
  limitations: string[];
  dataCollection: string;
  updateFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface Formula {
  expression: string;
  humanReadable: string;
  variables: FormulaVariable[];
  example?: {
    inputs: Record<string, number>;
    output: number;
    unit: string;
  };
}

export interface FormulaVariable {
  symbol: string;
  name: string;
  unit: string;
  source: string;
}

export const METHODOLOGIES: Record<MethodologyId, Methodology> = {
  // ========== Financial Methodologies ==========
  direct_kivitendo: {
    id: 'direct_kivitendo',
    name: 'Direkte Buchhaltungsdaten',
    category: 'financial',
    pillar: null,
    confidence: 'high',
    description: 'Daten werden direkt aus dem Kivitendo-Buchhaltungssystem exportiert. Höchste Zuverlässigkeit durch revisionssichere Buchhaltung.',
    references: [],
    assumptions: [
      'Buchhaltung wird korrekt geführt',
      'Monatlicher Export erfolgt zeitnah',
      'Kontierung entspricht dem Kontenrahmen',
    ],
    limitations: [
      'Nur CHF-Beträge, keine Stückzahlen',
      'Keine Echtzeit-Daten (monatlicher Export)',
      'Periodenabgrenzung kann zu Verschiebungen führen',
    ],
    dataCollection: 'Monatlicher JSON-Export aus Kivitendo über Reports → Export → JSON',
    updateFrequency: 'monthly',
  },

  // ========== Environmental Methodologies ==========
  device_co2_avoided: {
    id: 'device_co2_avoided',
    name: 'Vermiedene CO₂-Emissionen pro Gerät',
    category: 'environmental',
    pillar: 'Umwelt',
    confidence: 'medium',
    description: 'Berechnung der vermiedenen CO₂-Emissionen durch Wiederverwendung statt Neuproduktion.',
    formula: {
      expression: 'CO₂_avoided = N_devices × (CO₂_new - CO₂_refurb)',
      humanReadable: 'Vermiedene Emissionen = Anzahl Geräte × (CO₂ Neuproduktion − CO₂ Aufbereitung)',
      variables: [
        { symbol: 'N_devices', name: 'Anzahl aufbereitete Geräte', unit: 'Stück', source: 'Device Outcome Tracking' },
        { symbol: 'CO₂_new', name: 'CO₂ pro Neugerät', unit: 'kg CO₂e', source: 'BAFU/EU JRC Referenzwerte' },
        { symbol: 'CO₂_refurb', name: 'CO₂ pro Aufbereitung', unit: 'kg CO₂e', source: 'Eigene Messung + BAFU' },
      ],
      example: {
        inputs: { N_devices: 100, CO2_new: 300, CO2_refurb: 15 },
        output: 28500,
        unit: 'kg CO₂e',
      },
    },
    references: ['BAFU_LIFECYCLE_2023', 'EU_JRC_CIRCULAR_2020', 'FRAUNHOFER_REUSE_2022'],
    assumptions: [
      'Neuproduktion würde stattfinden (Substitutionsannahme)',
      'Durchschnittliche Gerätezusammensetzung (Laptop/Desktop-Mix)',
      'Schweizer Strommix für Aufbereitung',
    ],
    limitations: [
      'Keine gerätespezifische LCA (Lifecycle Assessment)',
      'Substitutionseffekt nicht direkt messbar',
      'Regionale Unterschiede bei Produktion nicht berücksichtigt',
    ],
    dataCollection: 'Device Outcome Tracking (Anzahl) + Referenzwerte aus Studien',
    updateFrequency: 'monthly',
  },

  device_lifetime_extension: {
    id: 'device_lifetime_extension',
    name: 'Lebensdauerverlängerung',
    category: 'environmental',
    pillar: 'Umwelt',
    confidence: 'medium',
    description: 'Geschätzte zusätzliche Nutzungsdauer der aufbereiteten Geräte.',
    formula: {
      expression: 'Years_extended = N_devices × avg_extension',
      humanReadable: 'Verlängerte Nutzungsjahre = Anzahl Geräte × durchschnittliche Verlängerung',
      variables: [
        { symbol: 'N_devices', name: 'Anzahl aufbereitete Geräte', unit: 'Stück', source: 'Device Outcome Tracking' },
        { symbol: 'avg_extension', name: 'Durchschnittliche Verlängerung', unit: 'Jahre', source: 'Annahme: 3-5 Jahre' },
      ],
      example: {
        inputs: { N_devices: 100, avg_extension: 4 },
        output: 400,
        unit: 'Nutzungsjahre',
      },
    },
    references: ['FRAUNHOFER_REUSE_2022', 'EU_JRC_CIRCULAR_2020'],
    assumptions: [
      '3-5 Jahre zusätzliche Nutzung pro Gerät',
      'Geräte würden sonst entsorgt werden',
      'Qualitätsprüfung sichert Funktionsfähigkeit',
    ],
    limitations: [
      'Tatsächliche Nutzungsdauer beim Käufer nicht bekannt',
      'Keine Langzeit-Nachverfolgung',
      'Varianz je nach Gerätetyp und -alter',
    ],
    dataCollection: 'Device Outcome Tracking + Standardannahme',
    updateFrequency: 'monthly',
  },

  material_recovery: {
    id: 'material_recovery',
    name: 'Materialrückgewinnung',
    category: 'environmental',
    pillar: 'Umwelt',
    confidence: 'low',
    description: 'Geschätzte Menge an Rohstoffen, die durch Wiederverwendung eingespart werden.',
    formula: {
      expression: 'Materials_kg = N_devices × avg_weight × material_factor',
      humanReadable: 'Eingesparte Materialien = Anzahl Geräte × Durchschnittsgewicht × Materialfaktor',
      variables: [
        { symbol: 'N_devices', name: 'Anzahl Geräte', unit: 'Stück', source: 'Device Outcome Tracking' },
        { symbol: 'avg_weight', name: 'Durchschnittsgewicht', unit: 'kg', source: 'SENS eRecycling' },
        { symbol: 'material_factor', name: 'Wiederverwendungsfaktor', unit: '%', source: 'Annahme: 85%' },
      ],
    },
    references: ['SENS_ERECYCLING_2024', 'BAFU_LIFECYCLE_2023'],
    assumptions: [
      'Durchschnittsgewicht Laptop: 2.2kg, Desktop: 8kg',
      '85% des Materials wird wiederverwendet (nicht recycelt)',
      'Materialzusammensetzung entspricht Durchschnitt',
    ],
    limitations: [
      'Keine gewichtsgenaue Erfassung pro Gerät',
      'Materialzusammensetzung variiert stark',
      'Seltene Erden nicht separat erfasst',
    ],
    dataCollection: 'Device Intake Tracking + SENS-Referenzgewichte',
    updateFrequency: 'monthly',
  },

  ewaste_prevention: {
    id: 'ewaste_prevention',
    name: 'E-Waste-Vermeidung',
    category: 'environmental',
    pillar: 'Umwelt',
    confidence: 'medium',
    description: 'Menge an Elektroschrott, der durch Wiederverwendung vermieden wird.',
    formula: {
      expression: 'E_waste_kg = N_devices × avg_weight',
      humanReadable: 'Vermiedener E-Waste = Anzahl wiederverwendete Geräte × Durchschnittsgewicht',
      variables: [
        { symbol: 'N_devices', name: 'Wiederverwendete Geräte', unit: 'Stück', source: 'Device Outcome: sold + donated' },
        { symbol: 'avg_weight', name: 'Durchschnittsgewicht', unit: 'kg', source: 'SENS eRecycling' },
      ],
    },
    references: ['SENS_ERECYCLING_2024', 'KANTON_ZH_KREISLAUF_2023'],
    assumptions: [
      'Geräte wären sonst als E-Waste entsorgt worden',
      'SENS-Durchschnittsgewichte sind repräsentativ',
    ],
    limitations: [
      'Alternativschicksal (Recycling) nicht berücksichtigt',
      'Keine individuelle Gewichtserfassung',
    ],
    dataCollection: 'Device Outcome Tracking + SENS-Referenzgewichte',
    updateFrequency: 'monthly',
  },

  // ========== Social Methodologies ==========
  social_participation: {
    id: 'social_participation',
    name: 'Digitale Teilhabe',
    category: 'social',
    pillar: 'Gesellschaft',
    confidence: 'medium',
    description: 'Messung der ermöglichten digitalen Teilhabe durch günstige Geräte.',
    formula: {
      expression: 'Participation = N_affordable × accessibility_factor',
      humanReadable: 'Digitale Teilhabe = Anzahl günstige Geräte × Zugänglichkeitsfaktor',
      variables: [
        { symbol: 'N_affordable', name: 'Günstig verkaufte Geräte', unit: 'Stück', source: 'Device Outcome: sold below market' },
        { symbol: 'accessibility_factor', name: 'Zugänglichkeitsfaktor', unit: 'Personen/Gerät', source: 'Annahme: 1.5' },
      ],
    },
    references: ['BSV_TEILHABE_2022', 'DIGITALE_GESELLSCHAFT_2024'],
    assumptions: [
      '1.5 Personen pro Gerät haben Zugang',
      'Zielgruppe hätte sonst keinen oder erschwerten Zugang',
      'Geräte werden tatsächlich genutzt',
    ],
    limitations: [
      'Keine Nachverfolgung der Käufer',
      'Zielgruppenzugehörigkeit nicht verifiziert',
      'Nutzungsintensität unbekannt',
    ],
    dataCollection: 'Device Outcome Tracking (Verkaufskategorie)',
    updateFrequency: 'monthly',
  },

  integration_effectiveness: {
    id: 'integration_effectiveness',
    name: 'Integrations-Wirksamkeit',
    category: 'social',
    pillar: 'Gesellschaft',
    confidence: 'high',
    description: 'Messung der Wirksamkeit arbeitsmarktlicher Integrationsmassnahmen.',
    references: ['SECO_INTEGRATION_2023', 'BSV_TEILHABE_2022'],
    assumptions: [
      'Teilnehmende absolvieren vollständige Massnahme',
      'Arbeitsstunden werden korrekt erfasst',
      'Betreuungsschlüssel entspricht Vertrag',
    ],
    limitations: [
      'Langzeit-Outcome (Job-Vermittlung) nicht erfasst',
      'Qualitative Wirkung schwer messbar',
      'Vergleichsgruppe fehlt',
    ],
    dataCollection: 'Teilhabe-Tracking (Personenmonate, Arbeitsstunden)',
    updateFrequency: 'monthly',
  },

  // ========== Educational Methodologies ==========
  education_transfer: {
    id: 'education_transfer',
    name: 'Wissenstransfer',
    category: 'educational',
    pillar: 'Bildung',
    confidence: 'medium',
    description: 'Messung des Wissenstransfers durch praktische Arbeit und Anleitung.',
    formula: {
      expression: 'Knowledge_hours = N_participants × hours_per_week × weeks',
      humanReadable: 'Wissensstunden = Teilnehmende × Stunden/Woche × Wochen',
      variables: [
        { symbol: 'N_participants', name: 'Anzahl Teilnehmende', unit: 'Personen', source: 'Teilhabe-Tracking' },
        { symbol: 'hours_per_week', name: 'Lernstunden pro Woche', unit: 'h', source: 'Annahme: ~20% der Arbeitszeit' },
        { symbol: 'weeks', name: 'Dauer der Massnahme', unit: 'Wochen', source: 'Teilhabe-Tracking' },
      ],
    },
    references: ['LPI_LINUX_2023', 'DIGITALE_GESELLSCHAFT_2024'],
    assumptions: [
      '~20% der Arbeitszeit ist aktives Lernen',
      'Betreuung durch Fachpersonen gesichert',
      'Praktische Arbeit vermittelt IT-Kompetenzen',
    ],
    limitations: [
      'Lernfortschritt nicht individuell gemessen',
      'Keine formalen Zertifikate',
      'Kompetenzgewinn subjektiv',
    ],
    dataCollection: 'Teilhabe-Tracking + Annahmen',
    updateFrequency: 'monthly',
  },

  workshop_impact: {
    id: 'workshop_impact',
    name: 'Workshop-Wirkung',
    category: 'educational',
    pillar: 'Bildung',
    confidence: 'medium',
    description: 'Messung der Wirkung von Workshops und Schulungen.',
    formula: {
      expression: 'Impact = N_workshops × avg_participants × satisfaction_rate',
      humanReadable: 'Wirkung = Workshops × Durchschnittliche Teilnehmende × Zufriedenheitsrate',
      variables: [
        { symbol: 'N_workshops', name: 'Anzahl Workshops', unit: 'Events', source: 'Workshop-Tracking' },
        { symbol: 'avg_participants', name: 'Durchschnittliche Teilnehmende', unit: 'Personen', source: 'Workshop-Tracking' },
        { symbol: 'satisfaction_rate', name: 'Zufriedenheitsrate', unit: '%', source: 'Feedback-Umfragen' },
      ],
    },
    references: ['LPI_LINUX_2023', 'DIGITALE_GESELLSCHAFT_2024'],
    assumptions: [
      'Teilnehmende geben ehrliches Feedback',
      'Workshops vermitteln praktisches Wissen',
      'Wissen wird nach Workshop angewendet',
    ],
    limitations: [
      'Langzeit-Wirkung nicht gemessen',
      'Feedback nicht bei allen Workshops erfasst',
      'Kompetenzgewinn nicht objektiv messbar',
    ],
    dataCollection: 'Workshop-Tracking + Feedback-Umfragen',
    updateFrequency: 'quarterly',
  },

  linux_adoption: {
    id: 'linux_adoption',
    name: 'Linux-Adoption',
    category: 'educational',
    pillar: 'Bildung',
    confidence: 'high',
    description: 'Anzahl der Geräte mit Linux-Installation als Indikator für Wissenstransfer.',
    formula: {
      expression: 'Linux_devices = N_sold × linux_rate',
      humanReadable: 'Linux-Geräte = Verkaufte Geräte × Linux-Installationsrate',
      variables: [
        { symbol: 'N_sold', name: 'Verkaufte Geräte', unit: 'Stück', source: 'Device Outcome: sold' },
        { symbol: 'linux_rate', name: 'Linux-Installationsrate', unit: '%', source: 'Device Outcome Tracking' },
      ],
    },
    references: ['LPI_LINUX_2023'],
    assumptions: [
      'Linux-Installation bedeutet Wissenstransfer',
      'Käufer lernen Linux zu nutzen',
      'Open-Source-Philosophie wird vermittelt',
    ],
    limitations: [
      'Tatsächliche Nutzung nicht überprüfbar',
      'Manche Käufer haben bereits Linux-Kenntnisse',
      'Qualität der Einführung variiert',
    ],
    dataCollection: 'Device Outcome Tracking (OS-Feld)',
    updateFrequency: 'monthly',
  },
};

// ============================================================================
// Three Pillars Definition (SSOT)
// ============================================================================

export type PillarId = 'environment' | 'society' | 'education';

export interface Pillar {
  id: PillarId;
  name: string;
  motto: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  dimensions: string[];
  methodologies: MethodologyId[];
}

export const THREE_PILLARS: Record<PillarId, Pillar> = {
  environment: {
    id: 'environment',
    name: 'Umwelt',
    motto: 'Alte Computer',
    icon: '🌍',
    color: 'text-primary-800',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    description: 'Durch die Wiederverwendung von IT-Geräten vermeiden wir E-Waste und reduzieren den Ressourcenverbrauch.',
    dimensions: ['Umweltwirkung'],
    methodologies: ['device_co2_avoided', 'device_lifetime_extension', 'material_recovery', 'ewaste_prevention'],
  },
  society: {
    id: 'society',
    name: 'Gesellschaft',
    motto: 'Neue Chancen',
    icon: '🤝',
    color: 'text-purple-800',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Wir ermöglichen digitale Teilhabe und schaffen Integrations-Arbeitsplätze.',
    dimensions: ['Soziale Wirkung', 'Zugänglichkeit'],
    methodologies: ['social_participation', 'integration_effectiveness'],
  },
  education: {
    id: 'education',
    name: 'Bildung',
    motto: 'Bessere Zukunft',
    icon: '📚',
    color: 'text-primary-800',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    description: '"Knowhow" ist Teil unseres Mottos. Wir vermitteln IT-Kompetenzen durch praktische Arbeit, Workshops und Linux-Schulungen.',
    dimensions: ['Bildungswirkung'],
    methodologies: ['education_transfer', 'workshop_impact', 'linux_adoption'],
  },
};

// ============================================================================
// CO₂ Reference Values (SSOT)
// ============================================================================

export interface CO2ReferenceValue {
  deviceType: string;
  production_kg: number;
  refurbishment_kg: number;
  recycling_kg: number;
  source: string;
  year: number;
}

export const CO2_REFERENCE_VALUES: Record<string, CO2ReferenceValue> = {
  laptop: {
    deviceType: 'Laptop',
    production_kg: 300,
    refurbishment_kg: 15,
    recycling_kg: 50,
    source: 'BAFU_LIFECYCLE_2023',
    year: 2023,
  },
  desktop: {
    deviceType: 'Desktop PC',
    production_kg: 400,
    refurbishment_kg: 20,
    recycling_kg: 70,
    source: 'BAFU_LIFECYCLE_2023',
    year: 2023,
  },
  monitor: {
    deviceType: 'Monitor',
    production_kg: 150,
    refurbishment_kg: 10,
    recycling_kg: 30,
    source: 'BAFU_LIFECYCLE_2023',
    year: 2023,
  },
  smartphone: {
    deviceType: 'Smartphone',
    production_kg: 70,
    refurbishment_kg: 5,
    recycling_kg: 15,
    source: 'BAFU_LIFECYCLE_2023',
    year: 2023,
  },
  tablet: {
    deviceType: 'Tablet',
    production_kg: 100,
    refurbishment_kg: 8,
    recycling_kg: 20,
    source: 'BAFU_LIFECYCLE_2023',
    year: 2023,
  },
};

// ============================================================================
// Device Weight Reference Values (SSOT)
// ============================================================================

export interface DeviceWeight {
  deviceType: string;
  weight_kg: number;
  source: string;
}

export const DEVICE_WEIGHTS: Record<string, DeviceWeight> = {
  laptop: { deviceType: 'Laptop', weight_kg: 2.2, source: 'SENS_ERECYCLING_2024' },
  desktop: { deviceType: 'Desktop PC', weight_kg: 8.0, source: 'SENS_ERECYCLING_2024' },
  monitor: { deviceType: 'Monitor', weight_kg: 5.0, source: 'SENS_ERECYCLING_2024' },
  smartphone: { deviceType: 'Smartphone', weight_kg: 0.2, source: 'SENS_ERECYCLING_2024' },
  tablet: { deviceType: 'Tablet', weight_kg: 0.5, source: 'SENS_ERECYCLING_2024' },
};

// ============================================================================
// Confidence Level Definitions (SSOT)
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'no_data';

export interface ConfidenceLevelDefinition {
  level: ConfidenceLevel;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  requirements: string[];
}

export const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceLevelDefinition> = {
  high: {
    level: 'high',
    name: 'Hoch',
    description: 'Direkt gemessen oder aus geprüften Daten berechnet',
    color: 'text-primary-800',
    bgColor: 'bg-primary-100',
    requirements: [
      'Daten aus primärer Quelle (z.B. Buchhaltung, direktes Tracking)',
      'Vollständige Dokumentation der Erhebung',
      'Regelmässige Aktualisierung',
      'Validierung durch zweite Quelle möglich',
    ],
  },
  medium: {
    level: 'medium',
    name: 'Mittel',
    description: 'Berechnet aus verlässlichen Quellen mit dokumentierten Annahmen',
    color: 'text-warning-800',
    bgColor: 'bg-warning-100',
    requirements: [
      'Formel und Annahmen dokumentiert',
      'Eingangsdaten haben hohe Konfidenz',
      'Wissenschaftliche Referenzen für Annahmen',
      'Unsicherheitsbereich bekannt',
    ],
  },
  low: {
    level: 'low',
    name: 'Niedrig',
    description: 'Schätzung oder basierend auf Annahmen ohne direkte Validierung',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    requirements: [
      'Annahmen dokumentiert aber nicht validiert',
      'Keine oder wenige wissenschaftliche Referenzen',
      'Hohe Unsicherheit',
      'Sollte mit Vorsicht interpretiert werden',
    ],
  },
  no_data: {
    level: 'no_data',
    name: 'Keine Daten',
    description: 'Daten werden noch nicht erhoben oder sind nicht verfügbar',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    requirements: [
      'Datenerhebung nicht implementiert',
      'Historische Daten nicht vorhanden',
      'Erhebungsmethode in Planung',
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getMethodology(id: MethodologyId): Methodology {
  return METHODOLOGIES[id];
}

export function getReference(id: string): ScientificReference | undefined {
  return SCIENTIFIC_REFERENCES[id];
}

export function getReferencesByMethodology(methodologyId: MethodologyId): ScientificReference[] {
  const methodology = METHODOLOGIES[methodologyId];
  return methodology.references
    .map(refId => SCIENTIFIC_REFERENCES[refId])
    .filter((ref): ref is ScientificReference => ref !== undefined);
}

export function getPillarByMethodology(methodologyId: MethodologyId): Pillar | null {
  const methodology = METHODOLOGIES[methodologyId];
  if (!methodology.pillar) return null;

  const pillarKeys: PillarId[] = ['environment', 'society', 'education'];
  const pillarKey = pillarKeys.find(
    key => THREE_PILLARS[key].name === methodology.pillar
  );

  return pillarKey ? THREE_PILLARS[pillarKey] : null;
}

export function getMethodologiesByPillar(pillarId: PillarId): Methodology[] {
  const pillar = THREE_PILLARS[pillarId];
  return pillar.methodologies.map(id => METHODOLOGIES[id]);
}

export function getCO2Savings(deviceType: string, count: number): number {
  const ref = CO2_REFERENCE_VALUES[deviceType];
  if (!ref) return 0;
  return count * (ref.production_kg - ref.refurbishment_kg);
}

export function getEWasteAvoided(deviceType: string, count: number): number {
  const weight = DEVICE_WEIGHTS[deviceType];
  if (!weight) return 0;
  return count * weight.weight_kg;
}
