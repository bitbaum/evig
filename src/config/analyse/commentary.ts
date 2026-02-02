/**
 * Analyse Commentary Configuration (SSOT)
 *
 * Template-based rules for generating actionable commentary.
 * Each rule defines conditions, findings, implications, and recommendations.
 */

export type InsightPriority = 'high' | 'medium' | 'low'

export interface CommentaryRule {
  id: string
  // Condition description (evaluated in code)
  condition: string
  // What we found
  finding: string
  // What it means
  implication: string
  // What to do about it
  recommendation: string
  priority: InsightPriority
}

/**
 * Commentary rules for financial metrics
 */
export const FINANCIAL_COMMENTARY_RULES: CommentaryRule[] = [
  // Self-financing rules
  {
    id: 'self_financing_high',
    condition: 'self_financing >= 70%',
    finding: 'Hohe Eigenfinanzierungsquote',
    implication: 'Starke finanzielle Unabhängigkeit von Spenden',
    recommendation: 'Modell beibehalten; Reserven für Schwankungen aufbauen',
    priority: 'low',
  },
  {
    id: 'self_financing_medium',
    condition: 'self_financing >= 50% && self_financing < 70%',
    finding: 'Ausgewogene Finanzierung',
    implication: 'Gute Balance zwischen Eigenerwirtschaftung und Spendeneinnahmen',
    recommendation: 'Dienstleistungsbereich weiter stärken für mehr Unabhängigkeit',
    priority: 'medium',
  },
  {
    id: 'self_financing_low',
    condition: 'self_financing < 50%',
    finding: 'Eigenfinanzierung unter 50%',
    implication: 'Hohe Spendenabhängigkeit; Risiko bei Spendenrückgang',
    recommendation: 'Dienstleistungen ausbauen oder Preise anpassen; alternative Einnahmequellen prüfen',
    priority: 'high',
  },

  // Year-over-year growth rules
  {
    id: 'growth_strong',
    condition: 'yoy_growth > 20%',
    finding: 'Starkes Umsatzwachstum',
    implication: 'Nachfrage wächst deutlich; Kapazitäten könnten knapp werden',
    recommendation: 'Kapazitätsplanung prüfen; Team-Erweiterung evaluieren',
    priority: 'medium',
  },
  {
    id: 'growth_healthy',
    condition: 'yoy_growth > 5% && yoy_growth <= 20%',
    finding: 'Gesundes Wachstum',
    implication: 'Stabile positive Entwicklung',
    recommendation: 'Kurs beibehalten; Qualität vor Quantität',
    priority: 'low',
  },
  {
    id: 'growth_stagnant',
    condition: 'yoy_growth >= -5% && yoy_growth <= 5%',
    finding: 'Stagnierender Umsatz',
    implication: 'Keine Wachstumsdynamik; mögliche Marktsättigung',
    recommendation: 'Neue Zielgruppen oder Angebote evaluieren',
    priority: 'medium',
  },
  {
    id: 'growth_decline',
    condition: 'yoy_growth < -5%',
    finding: 'Umsatzrückgang',
    implication: 'Ernstes Warnsignal; könnte finanzielle Stabilität gefährden',
    recommendation: 'Ursachenanalyse durchführen; Sofortmassnahmen prüfen',
    priority: 'high',
  },

  // Category-specific rules
  {
    id: 'services_dominant',
    condition: 'dienstleistungen_share > 50%',
    finding: 'Dienstleistungs-dominant',
    implication: 'Starke Serviceorientierung; personenabhängig',
    recommendation: 'Skalierbarkeit prüfen; Produktangebote als Ergänzung erwägen',
    priority: 'low',
  },
  {
    id: 'products_dominant',
    condition: 'warenverkauf_share > 60%',
    finding: 'Produkt-dominant',
    implication: 'Abhängig von Wareneingang; Lagerrisiken',
    recommendation: 'Diversifikation durch Services; Lieferkette stabilisieren',
    priority: 'medium',
  },
  {
    id: 'integration_zero',
    condition: 'integration == 0',
    finding: 'Keine Integrations-Arbeitsplätze',
    implication: 'Soziales Kernziel nicht erfüllt',
    recommendation: 'Integrations-Programm reaktivieren oder neue Partner suchen',
    priority: 'high',
  },

  // Donation dependency
  {
    id: 'donations_high',
    condition: 'donations_share > 40%',
    finding: 'Hoher Spendenanteil',
    implication: 'Starke Abhängigkeit von wenigen Spendern',
    recommendation: 'Spenderbasis diversifizieren; Eigeneinnahmen steigern',
    priority: 'high',
  },
]

/**
 * Commentary rules for environmental metrics
 */
export const ENVIRONMENTAL_COMMENTARY_RULES: CommentaryRule[] = [
  {
    id: 'devices_target_met',
    condition: 'devices_saved >= target',
    finding: 'Geräteziel erreicht',
    implication: 'Positive Umweltwirkung erzielt',
    recommendation: 'Ziel für nächstes Jahr erhöhen; Erfolg kommunizieren',
    priority: 'low',
  },
  {
    id: 'devices_target_missed',
    condition: 'devices_saved < target',
    finding: 'Geräteziel nicht erreicht',
    implication: 'Weniger Umweltwirkung als geplant',
    recommendation: 'Beschaffungskanäle erweitern; Marketing für Gerätespenden',
    priority: 'medium',
  },
  {
    id: 'co2_significant',
    condition: 'co2_saved > 100000', // > 100 Tonnen
    finding: 'Signifikante CO2-Einsparung',
    implication: 'Messbarer Beitrag zum Klimaschutz',
    recommendation: 'In Jahresbericht und Kommunikation hervorheben',
    priority: 'low',
  },
]

/**
 * Commentary rules for social metrics
 */
export const SOCIAL_COMMENTARY_RULES: CommentaryRule[] = [
  {
    id: 'integrations_active',
    condition: 'job_integrations > 0',
    finding: 'Aktive Arbeitsintegration',
    implication: 'Soziale Mission wird umgesetzt',
    recommendation: 'Erfolgsgeschichten dokumentieren; Partnerschaften ausbauen',
    priority: 'low',
  },
  {
    id: 'integrations_missing',
    condition: 'job_integrations == 0',
    finding: 'Keine Arbeitsintegrationen',
    implication: 'Soziale Kernmission gefährdet',
    recommendation: 'Integrations-Programm prioritär wieder aufbauen',
    priority: 'high',
  },
  {
    id: 'volunteers_strong',
    condition: 'active_volunteers >= 20',
    finding: 'Starke Freiwilligen-Basis',
    implication: 'Gute Community-Verankerung',
    recommendation: 'Freiwilligen-Appreciation; Weiterbildung anbieten',
    priority: 'low',
  },
  {
    id: 'volunteers_weak',
    condition: 'active_volunteers < 10',
    finding: 'Wenige aktive Freiwillige',
    implication: 'Begrenzte Kapazität; hohe Last auf Kernteam',
    recommendation: 'Rekrutierungs-Kampagne; Einstiegshürden senken',
    priority: 'medium',
  },
]

/**
 * Get all commentary rules
 */
export function getAllCommentaryRules(): CommentaryRule[] {
  return [
    ...FINANCIAL_COMMENTARY_RULES,
    ...ENVIRONMENTAL_COMMENTARY_RULES,
    ...SOCIAL_COMMENTARY_RULES,
  ]
}

/**
 * Get rules by priority
 */
export function getRulesByPriority(priority: InsightPriority): CommentaryRule[] {
  return getAllCommentaryRules().filter(r => r.priority === priority)
}

// Priority labels and colors for display
export const PRIORITY_CONFIG: Record<InsightPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'Hoch', color: 'text-red-700', bgColor: 'bg-red-100' },
  medium: { label: 'Mittel', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  low: { label: 'Niedrig', color: 'text-green-700', bgColor: 'bg-green-100' },
}
