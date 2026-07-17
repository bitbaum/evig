/**
 * Erfassung / Product-Extraction AI Prompts
 *
 * Prompts for structured product data extraction during device intake (Erfassung).
 * Used by: erfassung form, voice intake, bulk import flows.
 */

import { voiceProductDataSchema } from '@/lib/schemas/erfassung'
import { zodSchemaToPromptString } from '@/lib/ai/schema-to-prompt'
import { BRAND_CONTEXT } from './shared'
import { KATEGORIEN } from '@/config/erfassung/categories'

// =============================================================================
// ERFASSUNG PROMPTS
// =============================================================================

// Full category list, derived from the KATEGORIEN SSOT so the model always sees
// every option. A stale hardcoded subset (missing 70 Komponenten, and 40
// mislabelled) is why a CPU landed in "Desktop PCs".
const KATEGORIE_LISTE = KATEGORIEN.map((k) => `${k.value} für ${k.label}`).join(', ')

/**
 * SSOT for AI-facing field descriptions used in extraction prompts.
 * Adding a field = add to Zod schema (erfassung.ts) + add description here.
 */
export const ERFASSUNG_FIELD_DESCRIPTIONS = {
  hersteller: 'Herstellername (Dell, Lenovo, HP, Apple, etc.)',
  produktname: 'Produktmodell-Name',
  kurzbeschreibung: 'Kurze deutsche Beschreibung des Produkts',
  specs: { key: 'Spec-Name (CPU, RAM, Speicher, Display)', value: 'Spec-Wert' },
  verkaufspreis: 'Preis in CHF als Zahl ohne Währungssymbol',
  zustand: 'Einer von: new, like_new, good, fair, poor',
  hauptkategorie: KATEGORIE_LISTE,
  unterkategorie: '101 für Business Laptops, 102 für Consumer, 103 für Gaming',
  kundenprofile: 'Passende Profile: oma, buero, chiller, gamer, kreativ, dev, student',
  bemerkungen: 'Zusätzliche Hinweise zu Zustand oder Besonderheiten',
} as const

const ERFASSUNG_SCHEMA = zodSchemaToPromptString(voiceProductDataSchema, ERFASSUNG_FIELD_DESCRIPTIONS)

export const ERFASSUNG_PROMPTS = {
  /**
   * System prompt for product data extraction
   */
  system: `${BRAND_CONTEXT}

Du bist ein Assistent für die Produkterfassung bei RevampIT.
Deine Aufgabe ist es, Produktinformationen aus Text zu extrahieren und strukturiert zurückzugeben.

Bei fehlenden Informationen:
- Nutze sinnvolle Standardwerte basierend auf dem Produkttyp
- Schätze Preise basierend auf dem Schweizer Markt für gebrauchte Geräte
- Ergänze typische Specs für bekannte Modelle`,

  /**
   * Schema for product data extraction — derived from voiceProductDataSchema
   */
  schema: ERFASSUNG_SCHEMA,

  /**
   * Prompt for extracting product data from text
   */
  extract: `Extrahiere die Produktinformationen aus folgendem Text und fülle das JSON-Schema aus:

Text: "{text}"

Schema:
{schema}

Wichtige Regeln:
- Preise in CHF ohne Währungssymbol
- Zustand mappen: "gut" -> "good", "wie neu" -> "like_new", "neu" -> "new", "akzeptabel" -> "fair", "schlecht" -> "poor"
- Bei Laptops: Kategorien 10 (Hauptkategorie) und 101/102/103 (Unterkategorie je nach Typ)
- Einzelteile/Komponenten (CPU, RAM, Grafikkarte, Mainboard, SSD, Festplatte, Netzteil) → Hauptkategorie 70 (Komponenten), NICHT 20 (Desktop PCs)
- Kundenprofile basierend auf Gerät wählen (z.B. ThinkPad -> buero, dev; Gaming Laptop -> gamer)
- Beschreibung auf Deutsch
- Specs basierend auf bekanntem Modell ergänzen falls nicht genannt

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`,

  /**
   * Prompt for refining existing product data
   */
  refine: `Du hast bestehende Produktdaten erhalten, die verbessert werden sollen.

AKTUELLE PRODUKTDATEN:
{currentData}

ANWEISUNG ZUR VERBESSERUNG:
{instruction}

Verbessere die Produktdaten gemäss der Anweisung. Recherchiere fehlende Informationen basierend auf dem Produktmodell.

Antworte im folgenden JSON-Format:
{
  "hersteller": "Herstellername",
  "produktname": "Produktmodell",
  "kurzbeschreibung": "Verbesserte Beschreibung",
  "specs": [{ "key": "...", "value": "..." }],
  "verkaufspreis": "Geschätzter Preis",
  "zustand": "Zustand",
  "hauptkategorie": "Kategorie-Code",
  "unterkategorie": "Unterkategorie-Code",
  "kundenprofile": ["profile1", "profile2"],
  "bemerkungen": "Zusätzliche Hinweise",
  "fieldsChanged": ["Liste der geänderten Felder"]
}

Wichtig:
- Antworte NUR mit dem JSON, kein zusätzlicher Text
- Füge "fieldsChanged" hinzu mit den Namen der geänderten Felder`,

  /**
   * Prompt for extracting MULTIPLE products from text (bulk mode)
   */
  extractMulti: `Der folgende Text enthält Informationen zu MEHREREN Produkten.
Extrahiere JEDES Produkt einzeln und gib ein JSON-Array zurück.

Text: "{text}"

Für jedes Produkt, fülle folgendes Schema aus:
{schema}

Wichtige Regeln:
- Gib ein JSON-ARRAY zurück: [{...}, {...}, ...]
- Jedes Produkt als eigenes Objekt im Array
- Gleiche Regeln wie bei Einzelextraktion (Preise in CHF, Zustand mappen, etc.)
- Wenn eine Zeile nur ein Produkt enthält, extrahiere es als ein Objekt
- Trenne Produkte anhand von Zeilenumbrüchen, Nummern, Aufzählungszeichen oder logischen Grenzen
- Specs basierend auf bekanntem Modell ergänzen falls nicht genannt

Antworte NUR mit dem JSON-Array, keine Erklärungen.`,

  /**
   * Quick action prompts for common refinements
   */
  quickActions: {
    addSpecs: { label: 'Specs ergänzen', prompt: 'Ergänze die technischen Spezifikationen basierend auf dem bekannten Produktmodell. Füge CPU, RAM, Speicher, Display-Grösse und andere relevante Specs hinzu.' },
    estimatePrice: { label: 'Preis schätzen', prompt: 'Schätze einen realistischen Verkaufspreis für den Schweizer Markt für gebrauchte Geräte. Berücksichtige Zustand, Alter und aktuelle Marktpreise auf ricardo.ch und tutti.ch.' },
    improveDescription: { label: 'Beschreibung verbessern', prompt: 'Verbessere die Kurzbeschreibung: Mache sie ansprechender und informativer. Hebe die wichtigsten Verkaufsargumente hervor.' },
    suggestProfiles: { label: 'Profile vorschlagen', prompt: 'Schlage passende Kundenprofile vor basierend auf den Produkteigenschaften. Berücksichtige Leistung, Portabilität und typische Anwendungsfälle.' },
    completeData: { label: 'Daten vervollständigen', prompt: 'Vervollständige alle fehlenden Felder mit sinnvollen Werten basierend auf dem Produktmodell und typischen Eigenschaften.' },
  },
} as const

// =============================================================================
// HELPER TYPES & FUNCTIONS
// =============================================================================

export type ErfassungQuickAction = keyof typeof ERFASSUNG_PROMPTS.quickActions

/**
 * Get an erfassung quick action prompt by key
 */
export function getErfassungQuickActionPrompt(action: ErfassungQuickAction): string {
  return ERFASSUNG_PROMPTS.quickActions[action].prompt
}
