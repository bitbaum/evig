'use client'

import { AIAdvisorChat } from '@/components/ai/AIAdvisorChat'

/**
 * TaskAIChat — "ask the AI for help" on a task, complementing the human
 * "Um Hilfe bitten" flow in TaskActionsClient. Practical help: how to
 * proceed, break the work down, spot blockers, draft a message.
 */
interface TaskAIChatProps {
  title: string
  description: string | null
  instructions: string | null
  status: string
  priority: string
  dueDate: string | null
  protocolTitle: string | null
}

const QUICK_QUESTIONS = [
  { label: 'Wie gehe ich vor?', question: 'Wie gehe ich bei dieser Aufgabe am besten vor? Gib mir konkrete Schritte.' },
  { label: 'In Schritte zerlegen', question: 'Zerlege diese Aufgabe in kleine, abhakbare Teilschritte.' },
  { label: 'Was könnte blockieren?', question: 'Welche Hindernisse oder offenen Fragen könnten diese Aufgabe blockieren, und wie räume ich sie aus?' },
  { label: 'Nachricht entwerfen', question: 'Entwirf eine kurze Nachricht an das Team, mit der ich für diese Aufgabe um Unterstützung bitte.' },
]

export function TaskAIChat(props: TaskAIChatProps) {
  return (
    <AIAdvisorChat
      heading="KI um Hilfe bitten — Frag die KI zu dieser Aufgabe"
      endpoint="/api/ai/task-advisor"
      quickQuestions={QUICK_QUESTIONS}
      placeholder="Stelle eine eigene Frage zu dieser Aufgabe..."
      hint="Die KI kennt nur Titel, Beschreibung und Anleitung dieser Aufgabe — prüfe Vorschläge, bevor du sie umsetzt."
      buildBody={(question) => ({
        title: props.title,
        description: props.description,
        instructions: props.instructions,
        status: props.status,
        priority: props.priority,
        dueDate: props.dueDate,
        protocolTitle: props.protocolTitle,
        question,
      })}
    />
  )
}
