import { z } from 'zod'

const actionTypeSchema = z.enum([
  'create_task',
  'create_decision_draft',
  'create_protocol_draft',
  'navigate',
])

const baseActionSchema = z.object({
  id: z.string().min(1).max(80),
  type: actionTypeSchema,
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(400),
  cta: z.string().min(1).max(60),
  risky: z.boolean().default(false),
  payload: z.record(z.string(), z.unknown()),
})

const actionEnvelopeSchema = z.object({
  version: z.literal('1.0'),
  actions: z.array(baseActionSchema).max(4),
})

export type HirnActionType = z.infer<typeof actionTypeSchema>
export type HirnActionCard = z.infer<typeof baseActionSchema>
export type HirnActionEnvelope = z.infer<typeof actionEnvelopeSchema>

const ACTION_BLOCK_REGEX = /```hirn-actions\n([\s\S]*?)\n```/i

export function stripActionBlock(content: string): string {
  return content.replace(ACTION_BLOCK_REGEX, '').trim()
}

export function parseActionEnvelope(content: string): {
  actions: HirnActionCard[]
  parsingError?: string
} {
  const match = content.match(ACTION_BLOCK_REGEX)
  if (!match) return { actions: [] }

  try {
    const raw = JSON.parse(match[1])
    const parsed = actionEnvelopeSchema.safeParse(raw)

    if (!parsed.success) {
      return { actions: [], parsingError: parsed.error.issues[0]?.message || 'Ungültiges Aktions-Format' }
    }

    return { actions: parsed.data.actions }
  } catch {
    return { actions: [], parsingError: 'Aktions-Block konnte nicht gelesen werden' }
  }
}

export const HIRN_ACTION_INSTRUCTION = `
Wenn du eine klar ausführbare interne Aktion erkennst, füge am Ende deiner Antwort genau einen strukturierten Block ein.
Format:
\`\`\`hirn-actions
{"version":"1.0","actions":[{"id":"a1","type":"create_task","title":"...","summary":"...","cta":"Aufgabe erstellen","risky":false,"payload":{...}}]}
\`\`\`

Verfügbare Typen:
- create_task: Neue Aufgabe erstellen. payload: {title, description, task_type, category, priority, ...}
- create_decision_draft: Entscheid-Entwurf erstellen. payload: {title, description, category, ...}
- create_protocol_draft: Protokoll-Entwurf erstellen. payload: {title, meeting_date, participants, ...}
- navigate: Zur passenden Seite navigieren. payload: {url: "/admin/...", label: "Seitenname"}

Regeln:
- Nur bei konkretem Ausführungswunsch Actions ausgeben, sonst kein Block.
- Maximal 4 Actions.
- payload muss für den Typ vollständig sein.
- Für Produkt-Erfassung: navigate mit url="/admin/erfassung" und cta="Produkt erfassen".
- Für Workshop-Verwaltung: navigate mit url="/admin/workshops" und cta="Workshops verwalten".
- Für Marketplace: navigate mit url="/marketplace/sell" und cta="Inserat erstellen".
- Text ausserhalb des Blocks bleibt normal menschlich.
`.trim()
