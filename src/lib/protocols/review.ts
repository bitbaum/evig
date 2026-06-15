import { PROTOCOL_STATUSES } from '@/config/protocols'
import { DECISION_STATUS } from '@/config/decisions'
import type { ProtocolStatus } from '@/config/protocols'
import type { ActionLinkRecord, StructuredNotes } from '@/lib/schemas/protocols'
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud'

export interface ProtocolReviewCounts {
  topics: number
  actions: number
  tasks: number
  linkedTasks: number
  unlinkedTasks: number
  decisions: number
  openDecisions: number
  closedDecisionsWithoutTask: number
  infos: number
  unresolvedAssignees: number
  followUps: number
}

export interface ProtocolReviewChecklistItem {
  id: 'input' | 'structure' | 'people' | 'decisions' | 'tasks' | 'finalize'
  label: string
  description: string
  state: 'done' | 'active' | 'blocked' | 'pending'
}

function getLinkedActionIds(actionLinks: ActionLinkRecord[]): Set<string> {
  return new Set(actionLinks.map((link) => link.action_item_id))
}

export function getProtocolReviewCounts(
  notes: StructuredNotes | null,
  actionLinks: ActionLinkRecord[] = [],
  protocolDecisions: ProtocolDecisionSummary[] = [],
): ProtocolReviewCounts {
  const actionItems = notes?.action_items ?? []
  const linkedActionIds = getLinkedActionIds(actionLinks)

  const tasks = actionItems.filter((item) => item.item_type === 'task')
  const decisions = actionItems.filter((item) => item.item_type === 'decision')
  // QQ.6: decisions now live in the standalone `decisions` table, linked by
  // (protocol_id, action_item_id). An action item is "open" if no standalone
  // decision exists OR the linked decision is still in voting/discussion.
  const decisionsByActionItem = new Map(
    protocolDecisions.map((d) => [d.actionItemId, d])
  )

  return {
    topics: notes?.topics.length ?? 0,
    actions: actionItems.length,
    tasks: tasks.length,
    linkedTasks: tasks.filter((item) => linkedActionIds.has(item.id)).length,
    unlinkedTasks: tasks.filter((item) => !linkedActionIds.has(item.id)).length,
    decisions: decisions.length,
    openDecisions: decisions.filter((item) => {
      const linkedDecision = decisionsByActionItem.get(item.id)
      // No standalone decision yet → counts as open (needs proposing)
      if (!linkedDecision) return true
      // Standalone decision exists but isn't closed/cancelled → still open
      return !linkedDecision.isClosed
    }).length,
    closedDecisionsWithoutTask: decisions.filter((item) => {
      const linkedDecision = decisionsByActionItem.get(item.id)
      if (!linkedDecision) return false
      return linkedDecision.status === DECISION_STATUS.CLOSED
        && linkedDecision.outcomePassed !== false
        && !linkedDecision.linkedTaskId
    }).length,
    infos: actionItems.filter((item) => item.item_type === 'info').length,
    unresolvedAssignees: tasks.filter((item) => item.assigned_to_name && !item.assigned_to_id).length,
    followUps: notes?.follow_ups.length ?? 0,
  }
}

export function getProtocolReviewChecklist(input: {
  status: ProtocolStatus
  hasRawInput: boolean
  notes: StructuredNotes | null
  actionLinks: ActionLinkRecord[]
  protocolDecisions: ProtocolDecisionSummary[]
}): ProtocolReviewChecklistItem[] {
  const counts = getProtocolReviewCounts(
    input.notes,
    input.actionLinks,
    input.protocolDecisions,
  )
  const hasNotes = Boolean(input.notes)
  const isFinalized = input.status === PROTOCOL_STATUSES.FINALIZED

  return [
    {
      id: 'input',
      label: 'Input vorhanden',
      description: input.hasRawInput ? 'Transkript, Audio oder Notizen sind am Protokoll gespeichert.' : 'Es fehlt noch verwertbarer Input.',
      state: input.hasRawInput || hasNotes ? 'done' : 'blocked',
    },
    {
      id: 'structure',
      label: 'KI-Struktur prüfen',
      description: hasNotes
        ? `${counts.topics} Themen, ${counts.actions} Aktionen und ${counts.followUps} Follow-ups erkannt.`
        : 'Die KI-Strukturierung muss zuerst laufen.',
      state: hasNotes ? 'active' : 'blocked',
    },
    {
      id: 'people',
      label: 'Personen zuordnen',
      description: counts.unresolvedAssignees > 0
        ? `${counts.unresolvedAssignees} Aufgaben haben Namen, aber noch keine sichere Team-Zuordnung.`
        : 'Alle erkannten Zuständigkeiten sind entweder zugeordnet oder bewusst offen.',
      state: counts.unresolvedAssignees > 0 ? 'active' : hasNotes ? 'done' : 'pending',
    },
    {
      id: 'decisions',
      label: 'Entscheidungen klären',
      description: counts.decisions > 0
        ? `${counts.decisions} Entscheidungen erkannt, ${counts.openDecisions} davon ohne Abstimmung oder Abschluss.`
        : 'Keine Entscheidungen erkannt.',
      state: counts.openDecisions > 0 ? 'active' : hasNotes ? 'done' : 'pending',
    },
    {
      id: 'tasks',
      label: 'Aufgaben erzeugen',
      description: counts.tasks > 0
        ? `${counts.linkedTasks}/${counts.tasks} Aufgaben sind mit dem Aufgaben-System verknüpft.`
        : 'Keine Aufgaben erkannt.',
      state: counts.unlinkedTasks > 0 ? 'active' : hasNotes ? 'done' : 'pending',
    },
    {
      id: 'finalize',
      label: 'Abschliessen',
      description: isFinalized
        ? 'Das Protokoll ist abgeschlossen und bleibt als Quelle nachvollziehbar.'
        : 'Erst abschliessen, wenn Struktur, Entscheidungen und Aufgaben stimmen.',
      state: isFinalized ? 'done' : counts.unlinkedTasks > 0 || counts.openDecisions > 0 || counts.closedDecisionsWithoutTask > 0 ? 'pending' : hasNotes ? 'active' : 'blocked',
    },
  ]
}
