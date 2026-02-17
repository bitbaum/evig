import type { ProtocolStatus } from '@/config/protocols'

export const PROTOCOL_WORKFLOW_STEPS = [
  { id: 'input', label: 'Input' },
  { id: 'ai', label: 'AI-Strukturierung' },
  { id: 'review', label: 'Review' },
  { id: 'tasks', label: 'Aufgaben erstellen' },
  { id: 'done', label: 'Abgeschlossen' },
] as const

export type ProtocolWorkflowStepId = (typeof PROTOCOL_WORKFLOW_STEPS)[number]['id']

interface WorkflowContext {
  status: ProtocolStatus
  hasStructuredNotes: boolean
  unlinkedTaskCount?: number
}

export function getProtocolWorkflowStep(status: ProtocolStatus): ProtocolWorkflowStepId {
  if (status === 'draft') return 'input'
  if (status === 'processing') return 'ai'
  if (status === 'review') return 'review'
  return 'done'
}

export function getProtocolWorkflowProgress({
  status,
  hasStructuredNotes,
  unlinkedTaskCount = 0,
}: WorkflowContext): {
  currentStepId: ProtocolWorkflowStepId
  nextStepId: ProtocolWorkflowStepId | null
  ctaLabel: string | null
  ctaHint: string | null
} {
  if (status === 'draft') {
    return {
      currentStepId: 'input',
      nextStepId: 'ai',
      ctaLabel: 'Input erfassen und KI starten',
      ctaHint: 'Fügen Sie Transkript, Notizen oder Audio hinzu.',
    }
  }

  if (status === 'processing') {
    return {
      currentStepId: 'ai',
      nextStepId: 'review',
      ctaLabel: null,
      ctaHint: 'Die KI strukturiert aktuell den Inhalt.',
    }
  }

  if (status === 'review') {
    if (!hasStructuredNotes) {
      return {
        currentStepId: 'review',
        nextStepId: 'ai',
        ctaLabel: 'Inhalt verarbeiten',
        ctaHint: 'Es fehlen strukturierte Notizen für den Review.',
      }
    }

    return {
      currentStepId: 'review',
      nextStepId: 'tasks',
      ctaLabel: unlinkedTaskCount > 0 ? 'Aufgaben erstellen' : 'Review abschliessen',
      ctaHint: unlinkedTaskCount > 0
        ? `${unlinkedTaskCount} Aufgabe(n) sind noch nicht verknüpft.`
        : 'Es sind keine offenen Aufgaben mehr übrig.',
    }
  }

  return {
    currentStepId: 'done',
    nextStepId: null,
    ctaLabel: null,
    ctaHint: 'Workflow abgeschlossen.',
  }
}
