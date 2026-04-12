import { PROTOCOL_STATUSES } from '@/config/protocols'
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
  hasStructuredNotes?: boolean
  unlinkedTaskCount?: number
}

export function getProtocolWorkflowStep(input: ProtocolStatus | WorkflowContext): ProtocolWorkflowStepId {
  const context: WorkflowContext = typeof input === 'string' ? { status: input } : input

  if (context.status === PROTOCOL_STATUSES.DRAFT) return 'input'
  if (context.status === PROTOCOL_STATUSES.PROCESSING) return 'ai'
  if (context.status === PROTOCOL_STATUSES.FINALIZED) return 'done'

  if (context.status === PROTOCOL_STATUSES.REVIEW) {
    if ((context.unlinkedTaskCount || 0) > 0) return 'tasks'
    return 'review'
  }

  return 'review'
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
  if (status === PROTOCOL_STATUSES.DRAFT) {
    return {
      currentStepId: 'input',
      nextStepId: 'ai',
      ctaLabel: 'Input erfassen und KI starten',
      ctaHint: 'Füge Transkript, Notizen oder Audio hinzu.',
    }
  }

  if (status === PROTOCOL_STATUSES.PROCESSING) {
    return {
      currentStepId: 'ai',
      nextStepId: 'review',
      ctaLabel: null,
      ctaHint: 'Die KI strukturiert aktuell den Inhalt.',
    }
  }

  if (status === PROTOCOL_STATUSES.REVIEW) {
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
