'use client'

import { AIAdvisorChat } from '@/components/ai/AIAdvisorChat'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface ProtocolAIChatProps {
  title: string
  notes: StructuredNotes
  defaultExpanded?: boolean
}

const QUICK_QUESTIONS = [
  { label: 'Was wurde entschieden?', question: 'Was sind die wichtigsten Entscheidungen dieser Sitzung?' },
  { label: 'Welche Aufgaben wurden vergeben?', question: 'Welche Aufgaben wurden vergeben und wer ist zuständig?' },
  { label: 'Was ist das Wichtigste?', question: 'Was ist das wichtigste Ergebnis dieser Sitzung in einem Satz?' },
  { label: 'Was sind die nächsten Schritte?', question: 'Was sind die nächsten konkreten Schritte nach dieser Sitzung?' },
]

export function ProtocolAIChat({ title, notes, defaultExpanded = false }: ProtocolAIChatProps) {
  return (
    <AIAdvisorChat
      heading="KI-Assistent — Frag die KI zu diesem Protokoll"
      endpoint="/api/ai/protocol-advisor"
      quickQuestions={QUICK_QUESTIONS}
      placeholder="Stelle eine eigene Frage zu diesem Protokoll..."
      hint="Die KI antwortet basierend auf dem Protokollinhalt — prüfe wichtige Punkte immer im Protokoll selbst."
      defaultExpanded={defaultExpanded}
      buildBody={(question) => ({
        title,
        summary: notes.summary,
        topics: notes.topics?.map(t => ({
          title: t.title,
          discussion: t.discussion,
          outcome: t.outcome,
        })),
        actionItems: notes.action_items?.map(a => ({
          description: a.description,
          assigned_to_name: a.assigned_to_name,
          item_type: a.item_type,
        })),
        question,
      })}
    />
  )
}
