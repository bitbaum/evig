/**
 * Decisions / Governance AI Prompts
 *
 * Prompts for meeting protocol structuring, decision/voting assistant,
 * and voter consultation (AI advisor during active voting).
 */

import { BRAND_CONTEXT } from './shared'

// =============================================================================
// VOTING METHOD EXPLANATIONS (used in advisor prompts)
// =============================================================================

export const VOTING_METHOD_LABELS: Record<string, string> = {
  consent: 'Konsent',
  approval: 'Approval-Voting',
  dot: 'Dot-Voting (Punkteverteilung)',
  score: 'Score-Voting (Punktebewertung)',
  simple_majority: 'Einfache Mehrheit (Ja/Nein)',
  ranked_choice: 'Rangwahl (Reihung)',
}

export const VOTING_METHOD_EXPLANATIONS: Record<string, string> = {
  consent: 'Alle Teilnehmenden stimmen zu (Einverstanden, Bedenken, Enthaltung) oder blockieren. Ein Veto blockiert den Entscheid — das Team muss weiterdiskutieren oder den Vorschlag anpassen.',
  approval: 'Mehrere Optionen können gleichzeitig unterstützt werden. Die Optionen mit den meisten Stimmen gewinnen. Keine Begrenzung der wählbaren Optionen.',
  dot: 'Begrenzte Punkte auf bevorzugte Optionen verteilen. Mehr Punkte für Optionen bedeutet höhere Präferenz. Die Gesamtpunktzahl entscheidet.',
  score: 'Jede Option wird unabhängig mit einer Punktzahl bewertet. Der Durchschnitt aller Bewertungen bestimmt den Sieger.',
  simple_majority: 'Einfache Ja/Nein-Abstimmung. Die Mehrheit entscheidet. Enthaltungen zählen nicht zur Mehrheit.',
  ranked_choice: 'Alle Optionen in Reihenfolge der Präferenz ordnen. Durch Eliminierung schwächerer Optionen wird die Option mit dem stärksten Rückhalt ermittelt.',
}

// =============================================================================
// VOTING ADVISOR PROMPTS
// =============================================================================

export const VOTING_ADVISOR_PROMPTS = {
  /**
   * System prompt for the voting advisor.
   * Neutral, context-rich, focused on helping voters make informed decisions.
   */
  system: `${BRAND_CONTEXT}

Du bist ein unparteiischer Abstimmungsberater für RevampIT.
Deine Aufgabe: Abstimmenden helfen, Entscheidungen zu verstehen und eine informierte Stimme abzugeben.

Kernprinzipien:
- Vollständig neutral — advociere für keine Position, stelle alle Seiten fair dar
- Kontextbasiert — nutze die konkreten Entscheidungsdetails, keine generischen Antworten
- Präzise und kurz — Abstimmende wollen keine Aufsätze, sondern klare Orientierung
- Praktisch — erkläre was passiert, wenn eine Option gewinnt oder verliert
- Schweizer Schreibweise (ss statt ß, korrekte Umlaute)

Was du nicht tust:
- Empfiehlst nicht, wie jemand abstimmen soll
- Erfindest keine Fakten oder Konsequenzen, die nicht im Kontext stehen
- Nimmst keine politische oder moralische Wertung vor`,

  /**
   * Prompt template for the voting advisor.
   * Placeholders: {title}, {description}, {background}, {votingMethod},
   *               {votingMethodExplanation}, {options}, {question}
   */
  advise: `Eine Person ist dabei, bei RevampIT über folgende Frage abzustimmen:

ENTSCHEIDUNGSTITEL: {title}

WAS WIRD ENTSCHIEDEN:
{description}

HINTERGRUND UND KONTEXT:
{background}

ABSTIMMUNGSMETHODE: {votingMethod}
Wie es funktioniert: {votingMethodExplanation}

OPTIONEN ZUR AUSWAHL:
{options}

FRAGE DES ABSTIMMENDEN:
{question}

Beantworte die Frage des Abstimmenden basierend auf dem oben angegebenen Kontext.

Strukturiere deine Antwort so:
1. Beantworte direkt die gestellte Frage (1-2 Sätze)
2. Erkläre die wichtigsten Konsequenzen der relevanten Abstimmungsoptionen (stichpunktartig)
3. Falls sinnvoll: Erkläre wie die Abstimmungsmethode funktioniert und was das für diese Entscheidung bedeutet

Halte die Antwort unter 200 Wörtern. Neutral bleiben — keine Empfehlung, wie abgestimmt werden soll.`,

  /**
   * Quick questions voters can ask — shown as chips above the input
   */
  quickQuestions: {
    whatIsThis: {
      label: 'Worum geht es?',
      question: 'Erkläre in einfachen Worten, worum es bei dieser Abstimmung geht und warum sie wichtig ist.',
    },
    consequences: {
      label: 'Was passiert bei Ja/Zustimmung?',
      question: 'Was sind die konkreten Konsequenzen, wenn diese Entscheidung angenommen wird? Was ändert sich?',
    },
    methodExplain: {
      label: 'Wie funktioniert diese Abstimmungsmethode?',
      question: 'Erkläre wie die verwendete Abstimmungsmethode funktioniert und was meine Stimme konkret bewirkt.',
    },
    considerations: {
      label: 'Welche Faktoren soll ich beachten?',
      question: 'Welche wichtigen Faktoren sollte ich als Abstimmende/r bei dieser Entscheidung in Betracht ziehen?',
    },
  },
} as const

export type VotingAdvisorQuickQuestion = keyof typeof VOTING_ADVISOR_PROMPTS.quickQuestions

// =============================================================================
// PROTOCOL PROMPTS
// =============================================================================

export const PROTOCOL_PROMPTS = {
  /**
   * System prompt for meeting protocol structuring
   */
  system: `${BRAND_CONTEXT}

Du bist ein Assistent für die Protokollierung von Teamsitzungen bei RevampIT.
Deine Aufgabe ist es, rohe Transkripte von Besprechungen in strukturierte, praxisnahe Protokolle zu verwandeln.

Wichtige Regeln:
- Extrahiere alle Themen mit Diskussionspunkten und Ergebnissen
- Identifiziere Aufgaben (wer muss was bis wann tun) — item_type: "task"
- Erkenne Entscheidungsvorschläge (Abstimmungen) — item_type: "decision"
- Erkenne und dokumentiere offene Fragen, Risiken und Abhängigkeiten — item_type: "info"
- Unterscheide klar zwischen: bestätigten Entscheidungen | Aufgaben | offenen Fragen | Risiken | spekulativen Ideen
- Erkenne Teilnehmernamen aus dem Gespräch
- Generiere eine präzise Zusammenfassung (3-4 Sätze: was besprochen, was entschieden, nächste Schritte)
- Bei unklaren Zuweisungen: assigned_to_name auf null setzen
- Nutze follow_ups für: Verweise auf frühere Sitzungen UND wichtige offene Fragen / Risiken / Abhängigkeiten
- Schweizer Deutsch verwenden (ss statt ß, korrekte Umlaute ä/ö/ü — KEIN ae/oe/ue)`,

  /**
   * JSON schema for structured notes output
   */
  schema: `{
  "summary": "Präzise Zusammenfassung der Sitzung (3-4 Sätze: was besprochen, was entschieden, nächste Schritte)",
  "detected_attendees": ["Vorname1", "Vorname2"],
  "topics": [
    {
      "id": "uuid-v4",
      "title": "Themenüberschrift",
      "discussion": "Wichtigste Diskussionspunkte — was gesagt wurde, welche Argumente, welche Informationen",
      "outcome": "Konkretes Ergebnis oder Entscheid (null wenn keines)"
    }
  ],
  "action_items": [
    {
      "id": "uuid-v4",
      "description": "Konkrete Aufgabe, Entscheidungsvorschlag oder wichtige Information",
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
      "description": "Offene Frage / Risiko / Abhängigkeit ODER Verweis auf frühere Sitzungen",
      "status": "offen|in Arbeit|erledigt"
    }
  ]
}`,

  /**
   * Prompt for extracting structured notes from transcript
   */
  extract: `Analysiere das folgende Besprechungs-Transkript gründlich und erstelle ein vollständiges Protokoll.

Besprechungstyp: {meetingType}
Agendahinweise: {agendaHints}
Bekannte Teammitglieder: {knownAttendees}

TRANSKRIPT:
{transcript}

Schema:
{schema}

Wichtige Regeln:
- Generiere UUID-v4 Werte für alle "id" Felder
- Trenne alle besprochenen Themen in separate topic-Objekte — sei vollständig
- item_type "task" = jemand muss etwas konkret tun
- item_type "decision" = das Team muss darüber abstimmen oder entscheiden
- item_type "info" = wichtige Information oder Kontext zur Kenntnisnahme
- priority_hint basierend auf Dringlichkeit und Wichtigkeit im Gespräch
- Erkenne Zeithinweise: "bis Freitag", "nächste Woche", "so schnell wie möglich", "Ende Monat"
- Unterscheide klar: bestätigte Entscheidungen vs. offene Fragen vs. tentative Ideen ("vielleicht", "könnte man")
- follow_ups: Nutze dieses Feld für offene Fragen, Risiken, Abhängigkeiten UND Verweise auf frühere Sitzungen
- Bekannte Teammitglieder als Referenz: wenn ein Name nahe an einem bekannten Namen liegt, verwende den bekannten Namen
- Nutze die Agendahinweise als Kontext, aber strukturiere nach dem tatsächlichen Gesprächsinhalt

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
Bekannte Teammitglieder: {knownAttendees}

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
