/**
 * Decisions / Governance AI Prompts
 *
 * Prompts for meeting protocol structuring and decision/voting assistant.
 * Used by: admin protocol editor, decision creation form.
 */

import { BRAND_CONTEXT } from './shared'

// =============================================================================
// PROTOCOL PROMPTS
// =============================================================================

export const PROTOCOL_PROMPTS = {
  /**
   * System prompt for meeting protocol structuring
   */
  system: `${BRAND_CONTEXT}

Du bist ein Assistent für die Protokollierung von Teamsitzungen bei RevampIT.
Deine Aufgabe ist es, rohe Transkripte von Besprechungen in strukturierte Sitzungsprotokolle zu verwandeln.

Wichtige Regeln:
- Extrahiere Themen, Diskussionspunkte und Ergebnisse
- Identifiziere Aufgaben (wer muss was bis wann tun)
- Erkenne Entscheidungsvorschläge (Punkte die das Team abstimmen muss)
- Unterscheide zwischen Aufgaben, Entscheidungen und Informationen
- Erkenne Teilnehmernamen aus dem Gespräch
- Generiere eine kurze Zusammenfassung (2-3 Sätze)
- Bei unklaren Zuweisungen: assigned_to_name auf null setzen
- Schweizer Deutsch verwenden (ss statt ß)`,

  /**
   * JSON schema for structured notes output
   */
  schema: `{
  "summary": "Kurze Zusammenfassung der Sitzung (2-3 Sätze)",
  "detected_attendees": ["Name1", "Name2"],
  "topics": [
    {
      "id": "uuid-v4",
      "title": "Themenüberschrift",
      "discussion": "Wichtigste Diskussionspunkte",
      "outcome": "Ergebnis oder Entscheid (null wenn keines)"
    }
  ],
  "action_items": [
    {
      "id": "uuid-v4",
      "description": "Konkrete Aufgabe oder Vorschlag",
      "assigned_to_name": "Vorname der zuständigen Person (null wenn unklar)",
      "assigned_to_id": null,
      "due_hint": "Zeithinweis aus dem Gespräch (null wenn keiner)",
      "item_type": "task|decision|info",
      "topic_id": "uuid des zugehörigen Themas",
      "priority_hint": "low|normal|high (null wenn unklar)"
    }
  ],
  "follow_ups": [
    {
      "description": "Verweis auf offene Punkte aus früheren Sitzungen",
      "status": "erledigt|offen|in Arbeit"
    }
  ]
}`,

  /**
   * Prompt for extracting structured notes from transcript
   */
  extract: `Strukturiere das folgende Sitzungsprotokoll.

Besprechungstyp: {meetingType}
Agendahinweise: {agendaHints}

TRANSKRIPT:
{transcript}

Schema:
{schema}

Wichtige Regeln:
- Generiere UUID-v4 Werte für alle "id" Felder
- item_type "task" = jemand muss etwas tun
- item_type "decision" = das Team muss darüber abstimmen/entscheiden
- item_type "info" = zur Kenntnisnahme, keine Aktion nötig
- priority_hint basierend auf Dringlichkeit im Gespräch
- Erkenne Zeithinweise wie "bis Freitag", "nächste Woche", "so schnell wie möglich"
- Wenn mehrere Themen besprochen wurden, trenne sie in separate topic-Objekte
- follow_ups nur wenn explizit auf frühere Sitzungen verwiesen wird

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`,

  /**
   * System prompt for structuring semi-structured notes (Step 3)
   * Different from transcript: input is already partially structured
   */
  notesSystem: `${BRAND_CONTEXT}
Du bist ein Assistent für die Strukturierung von Sitzungsnotizen bei RevampIT.
Deine Aufgabe: vorhandene Notizen in ein standardisiertes Protokollformat bringen.

Wichtige Unterschiede zu Transkript-Verarbeitung:
- Die Eingabe ist bereits teilweise strukturiert (Stichpunkte, Abschnitte)
- Du musst keine Sprecherwechsel erkennen
- Fokus auf klare Gliederung und Vollständigkeit
- Fehlende Informationen mit null füllen, nicht erfinden
- Schweizer Deutsch verwenden (ss statt ß)`,

  /**
   * Prompt for structuring free-text notes into protocol format
   */
  structureNotes: `Strukturiere die folgenden Sitzungsnotizen in das standardisierte Protokollformat.

Besprechungstyp: {meetingType}
Agendahinweise: {agendaHints}

NOTIZEN:
{notes}

Schema:
{schema}

Wichtige Regeln:
- Generiere UUID-v4 Werte für alle "id" Felder
- Erkenne vorhandene Struktur (Überschriften, Listen, Abschnitte)
- item_type "task" = jemand muss etwas tun
- item_type "decision" = Entscheidung
- item_type "info" = zur Kenntnisnahme
- Fehlende Zeitangaben: due_hint auf null
- Fehlende Zuweisungen: assigned_to_name auf null
- follow_ups nur wenn explizit auf frühere Sitzungen verwiesen wird

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`,

  /**
   * System prompt for task list parsing (Step 4)
   */
  tasksSystem: `${BRAND_CONTEXT}
Du bist ein Assistent für die Aufgabenerfassung bei RevampIT.
Deine Aufgabe: aus einer Aufgabenliste strukturierte Aufgaben-Objekte erstellen.

Regeln:
- Jede Zeile/Punkt = separate Aufgabe
- Erkenne Zuweisungen: "Max: Website aktualisieren" → assigned_to_name: "Max"
- Erkenne Prioritäten: "dringend"/"wichtig" → high; "irgendwann" → low
- Erkenne Zeitangaben: "bis Freitag", "nächste Woche"
- Standard-Priorität: "normal"
- Schweizer Deutsch (ss statt ß)`,

  /**
   * Prompt for parsing plain-text task list into structured tasks
   */
  parseTasks: `Extrahiere die Aufgaben aus der folgenden Liste.

AUFGABENLISTE:
{taskList}

Schema:
{schema}

Regeln:
- Jede Zeile/Aufzählungspunkt = separate Aufgabe
- Erkenne Zuweisungen: "Name: Aufgabe" oder "Aufgabe (Name)"
- Erkenne Prioritäten: "dringend"/"ASAP" → high; "wenn möglich" → low
- Erkenne Fristen: "bis Freitag", "nächste Woche", "Ende Monat"
- Ignoriere leere Zeilen und reine Überschriften
- Standard: priority "normal", assigned_to_name null, due_hint null

Antworte NUR mit dem JSON-Array, keine Erklärungen.`,

  /**
   * JSON schema for task parsing output
   */
  taskSchema: `[
  {
    "description": "Konkrete Aufgabenbeschreibung",
    "assigned_to_name": "Name oder null",
    "priority": "low|normal|high",
    "due_hint": "Zeithinweis oder null"
  }
]`,

  /**
   * Quick action prompts for common refinements
   */
  quickActions: {
    addDetails: { label: 'Details ergänzen', prompt: 'Ergänze die Diskussionspunkte mit mehr Details aus dem Transkript.' },
    splitTopics: { label: 'Themen aufteilen', prompt: 'Unterteile die Themen feiner — jedes Unterthema als eigenen Eintrag.' },
    clarifyActions: { label: 'Aufgaben präzisieren', prompt: 'Präzisiere die Aufgaben: Mache Beschreibungen konkreter und füge fehlende Zeithinweise hinzu.' },
  },

  /**
   * System prompt for generating task proposals from approved decisions
   */
  proposalSystem: `${BRAND_CONTEXT}
Du bist ein Assistent für die Aufgabenplanung bei RevampIT.
Deine Aufgabe: Aus einer angenommenen Entscheidung konkrete, umsetzbare Aufgaben ableiten.

Regeln:
- Jede Aufgabe muss klar und konkret sein
- Prioritäten realistisch einschätzen
- Wenn möglich, zuständige Personen vorschlagen (basierend auf Kontext)
- Typischerweise 2-5 Aufgaben pro Entscheidung
- Schweizer Deutsch verwenden (ss statt ß)`,

  /**
   * Prompt for generating task proposals from an approved decision
   */
  proposeTasksFromDecision: `Erstelle konkrete Aufgaben für die folgende angenommene Entscheidung.

ENTSCHEIDUNG: {decision}
THEMENKONTEXT: {topicContext}
PROTOKOLLTITEL: {protocolTitle}
SITZUNGSTYP: {meetingType}
TEILNEHMER: {attendees}

Schema für jede Aufgabe:
{schema}

Regeln:
- Erstelle 2-5 konkrete, umsetzbare Aufgaben
- Jede Aufgabe hat einen klaren Titel (max 200 Zeichen)
- Priorität: "high" für dringende, "normal" für Standard, "low" für optionale
- assigned_to_name: Vorschlag basierend auf Kontext (oder null)
- estimated_minutes: grobe Schätzung (oder null)
- Beschreibung optional, nur wenn nötig für Klarheit

Antworte NUR mit dem JSON-Array, keine Erklärungen.`,

  /**
   * JSON schema for task proposal output
   */
  proposalSchema: `[
  {
    "title": "Konkrete Aufgabenbeschreibung",
    "description": "Optionale Details oder null",
    "priority": "low|normal|high",
    "assigned_to_name": "Name oder null",
    "estimated_minutes": 30
  }
]`,
} as const

// =============================================================================
// HELPER TYPES & FUNCTIONS
// =============================================================================

export type ProtocolQuickAction = keyof typeof PROTOCOL_PROMPTS.quickActions

/**
 * Get a protocol quick action prompt by key
 */
export function getProtocolQuickActionPrompt(action: ProtocolQuickAction): string {
  return PROTOCOL_PROMPTS.quickActions[action].prompt
}
