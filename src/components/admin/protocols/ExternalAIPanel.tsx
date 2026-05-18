'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ExternalAIPanelProps {
  transcript: string
  importing: boolean
  onImport: (content: string) => void
}

const AI_SERVICES = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/' },
  { name: 'Claude', url: 'https://claude.ai/' },
  { name: 'Gemini', url: 'https://gemini.google.com/' },
  { name: 'Grok', url: 'https://grok.x.ai/' },
]

function buildPrompt(transcript: string): string {
  return `Du bist ein Protokoll-Assistent.

Analysiere das folgende Besprechungs-Transkript gründlich und erstelle ein vollständiges Protokoll.

Extrahiere:
- Alle besprochenen Themen mit Diskussion und konkreten Ergebnissen
- Konkrete Aufgaben mit Zuständigen und Zeitrahmen
- Entscheidungen, über die abgestimmt werden muss
- Offene Fragen und Risiken (als follow_ups mit status "offen")
- Alle genannten Personen als Teilnehmer

Ausgabe AUSSCHLIESSLICH als JSON in diesem Format:

{
  "summary": "Präzise Zusammenfassung (3-4 Sätze: was besprochen, was entschieden, nächste Schritte)",
  "detected_attendees": ["Vorname1", "Vorname2"],
  "topics": [
    {
      "id": "generiere-uuid-v4",
      "title": "Thementitel",
      "discussion": "Detaillierte Diskussionspunkte — was gesagt wurde, welche Argumente",
      "outcome": "Konkretes Ergebnis oder null"
    }
  ],
  "action_items": [
    {
      "id": "generiere-uuid-v4",
      "description": "Konkrete, umsetzbare Aufgabe",
      "assigned_to_name": "Vorname oder null",
      "assigned_to_id": null,
      "due_hint": "Zeithinweis aus dem Gespräch oder null",
      "item_type": "task",
      "topic_id": "uuid des zugehörigen topics",
      "priority_hint": "high|normal|low"
    }
  ],
  "follow_ups": [
    {
      "description": "Offene Frage, Risiko oder Abhängigkeit",
      "status": "offen"
    }
  ]
}

Regeln:
- Generiere gültige UUID v4 für alle id-Felder
- item_type: "task" = jemand muss etwas tun | "decision" = Team muss abstimmen | "info" = zur Kenntnisnahme
- Schweizer Deutsch: ss statt ß, ä/ö/ü korrekt verwenden (KEIN ae/oe/ue)
- Antworte NUR mit dem JSON, keine Einleitung oder Erklärung

TRANSKRIPT:
${transcript}`
}

export function ExternalAIPanel({ transcript, importing, onImport }: ExternalAIPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const canCopy = transcript.length >= 50

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPrompt(transcript))
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors text-left"
      >
        <span>Externe KI verwenden — ChatGPT, Claude, Gemini oder Grok</span>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" />}
      </button>

      {expanded && (
        <div className="border-t border-dashed border-neutral-200 dark:border-white/[0.08] p-4 space-y-5 bg-neutral-50/50 dark:bg-white/[0.01]">

          {/* Step 1 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Schritt 1 — Prompt kopieren
            </p>
            <div className="flex items-start gap-3">
              <Button
                onClick={handleCopy}
                disabled={!canCopy}
                variant="secondary"
                size="sm"
                className="gap-2 flex-shrink-0"
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />Kopiert!</>
                  : <><Copy className="w-3.5 h-3.5" />Prompt + Transkript kopieren</>
                }
              </Button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1">
                Kopiert einen fertigen Prompt mit Transkript und JSON-Schema — einfach in das externe Tool einfügen.
              </p>
            </div>
            {!canCopy && (
              <p className="text-xs text-warning-600 dark:text-warning-400">Bitte zuerst das Transkript eingeben.</p>
            )}
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Schritt 2 — Externes Tool öffnen
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_SERVICES.map(service => (
                <a
                  key={service.name}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-white/[0.1] rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  {service.name}
                </a>
              ))}
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Schritt 3 — JSON-Antwort einfügen und importieren
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder='Antwort der externen KI hier einfügen (JSON oder Markdown)…'
              className="font-mono text-xs"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => onImport(pasteText)}
                disabled={!pasteText.trim() || importing}
                variant="primary"
                size="sm"
                className="gap-2"
              >
                {importing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Wird importiert…</>
                  : 'Externe Notizen importieren'
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
