/**
 * Content AI Prompts
 *
 * Prompts for blog generation/refinement and IT-Hilfe request extraction.
 * Used by: blog admin editor, blog submission form, IT-Hilfe inquiry form.
 */

import { LOCATIONS } from '@/config/org'
import { BRAND_CONTEXT } from './shared'

// =============================================================================
// BLOG PROMPTS
// =============================================================================

export const BLOG_PROMPTS = {
  /**
   * System prompt for blog content generation
   */
  system: `${BRAND_CONTEXT}

Du bist ein erfahrener Blog-Autor für RevampIT.

Dein Schreibstil:
- Informativ aber zugänglich
- Nicht zu formell, aber professionell
- Praktische Tipps und Anleitungen wenn passend
- Umweltbewusst ohne belehrend zu sein
- Positiv und lösungsorientiert

Formatiere den Artikel in Markdown mit:
- Überschriften (##, ###)
- Aufzählungen wo sinnvoll
- Hervorhebungen (**fett** für wichtige Begriffe)
- Kurze, lesbare Absätze

Die Artikel sollten 400-800 Wörter lang sein.`,

  /**
   * Prompt for generating new blog posts from a topic
   */
  generate: `Basierend auf dem folgenden Thema/Prompt, generiere einen kompletten Blog-Artikel:

THEMA: {topic}

Antworte im folgenden JSON-Format:
{
  "title": "Aussagekräftiger Titel",
  "excerpt": "Kurze Zusammenfassung in 1-2 Sätzen (max 160 Zeichen)",
  "content": "Der vollständige Artikel in Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO-optimierter Titel (kann gleich wie title sein)",
  "seoDescription": "SEO-Beschreibung für Suchmaschinen (max 160 Zeichen)"
}

Wichtig:
- Antworte NUR mit dem JSON, kein zusätzlicher Text
- Verwende Schweizer Deutsch (ss statt ß)
- Der Artikel sollte 400-800 Wörter umfassen
- Tags sollten relevant und auf Deutsch sein`,

  /**
   * Prompt for refining existing blog posts
   */
  refine: `Du hast einen bestehenden Blog-Artikel erhalten, der verbessert werden soll.

AKTUELLER ARTIKEL:
{currentData}

ANWEISUNG ZUR VERBESSERUNG:
{instruction}

Verbessere den Artikel gemäss der Anweisung. Behalte den Stil und die Kernaussage bei, ausser die Anweisung verlangt etwas anderes.

Antworte im folgenden JSON-Format:
{
  "title": "Verbesserter Titel",
  "excerpt": "Verbesserte Kurzbeschreibung (max 160 Zeichen)",
  "content": "Der verbesserte Artikel in Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO-optimierter Titel",
  "seoDescription": "SEO-Beschreibung (max 160 Zeichen)"
}

Wichtig:
- Antworte NUR mit dem JSON, kein zusätzlicher Text
- Verwende Schweizer Deutsch (ss statt ß)`,

  /**
   * Quick action prompts for common refinements
   */
  quickActions: {
    shorter: { label: 'Kürzen', prompt: 'Kürze den Artikel auf etwa die Hälfte der Länge. Behalte die wichtigsten Punkte bei.' },
    longer: { label: 'Erweitern', prompt: 'Erweitere den Artikel mit mehr Details, Beispielen und praktischen Tipps. Verdopple etwa die Länge.' },
    seoOptimize: { label: 'SEO optimieren', prompt: 'Optimiere den Artikel für Suchmaschinen: Verbessere Titel, füge relevante Keywords ein, strukturiere mit besseren Überschriften.' },
    addExamples: { label: 'Beispiele hinzufügen', prompt: 'Füge 2-3 konkrete Beispiele oder Fallstudien hinzu, die die Punkte im Artikel illustrieren.' },
    simplify: { label: 'Vereinfachen', prompt: 'Vereinfache den Text für ein breiteres Publikum. Erkläre Fachbegriffe und verwende einfachere Sprache.' },
  },
} as const

// =============================================================================
// IT-HILFE PROMPTS
// =============================================================================

export const IT_HILFE_PROMPTS = {
  /**
   * System prompt for IT help request extraction
   */
  system: `${BRAND_CONTEXT}

Du bist ein Assistent für IT-Hilfe-Anfragen bei RevampIT.
Deine Aufgabe ist es, aus einer Problembeschreibung strukturierte Daten für eine Reparaturanfrage zu extrahieren UND eine freundliche Erstdiagnose zu stellen.

Bei fehlenden Informationen:
- Wähle die wahrscheinlichste Gerätekategorie
- Schätze die Dringlichkeit basierend auf der Beschreibung
- Schlage passende Skills vor basierend auf dem Problem

Für die Diagnose:
- Erkläre freundlich und nicht zu technisch, was wahrscheinlich das Problem ist
- Nenne mögliche Ursachen
- Schätze ein, ob es wahrscheinlich reparierbar ist und wie aufwändig
- Erwähne, dass RevampIT in der Werkstatt an der ${LOCATIONS.store.full} helfen kann`,

  /**
   * JSON schema for IT help request data
   */
  schema: `{
  "categoryId": "Gerätekategorie-ID: laptop, smartphone, tablet, desktop, console, audio, peripheral, storage, wearable, network",
  "deviceBrand": "Marke des Geräts (z.B. Apple, Samsung, Lenovo)",
  "deviceModel": "Modell des Geräts (z.B. MacBook Pro 2019, Galaxy S21)",
  "title": "Kurzer Titel für die Anfrage (max 80 Zeichen)",
  "description": "Detaillierte Problembeschreibung",
  "urgency": "Dringlichkeit: low, normal, high, urgent",
  "skillsNeeded": ["Benötigte Skills als Array von IDs: hardware_diagnosis, screen_repair, battery_replacement, ssd_upgrade, keyboard_repair, soldering, cleaning, power_supply, motherboard_repair, connector_repair, os_installation, linux_install, software_setup, troubleshooting, data_recovery, backup_setup, virus_removal, wifi_setup, router_config, network_troubleshooting"],
  "diagnosis": "Freundliche Erstdiagnose in 2-4 Sätzen: Was ist wahrscheinlich das Problem, mögliche Ursachen, ist es reparierbar?"
}`,

  /**
   * Prompt for extracting IT help data from text
   */
  extract: `Extrahiere die IT-Hilfe-Anfrage aus folgendem Text und fülle das JSON-Schema aus:

Text: "{text}"

Schema:
{schema}

Wichtige Regeln:
- Wähle die passendste categoryId basierend auf dem Gerät
- Erstelle einen kurzen, hilfreichen Titel
- Beschreibung soll das Problem klar zusammenfassen
- Dringlichkeit basierend auf Kontext: "startet nicht" = high, "langsam" = normal, etc.
- Skills basierend auf Problem wählen (z.B. "Bildschirm kaputt" → screen_repair, hardware_diagnosis)
- Marke und Modell extrahieren wenn erwähnt
- Diagnosis: Schreibe eine freundliche, verständliche Ersteinschätzung (2-4 Sätze). Erkläre was wahrscheinlich kaputt ist, ob es reparierbar ist und wie aufwändig. Schweizer Deutsch verwenden (ss statt ß).

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`,
} as const

// =============================================================================
// HELPER TYPES & FUNCTIONS
// =============================================================================

export type BlogQuickAction = keyof typeof BLOG_PROMPTS.quickActions

/**
 * Get a blog quick action prompt by key
 */
export function getBlogQuickActionPrompt(action: BlogQuickAction): string {
  return BLOG_PROMPTS.quickActions[action].prompt
}
