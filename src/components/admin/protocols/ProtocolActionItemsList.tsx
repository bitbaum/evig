import { Link } from '@/i18n/navigation'
import {
  Loader2,
  CheckCircle2,
  ListChecks,
  ExternalLink,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  ACTION_ITEM_TYPE_LABELS,
  ACTION_ITEM_TYPE_COLORS,
  ACTION_ITEM_BORDER_COLORS,
  PRIORITY_HINT_LABELS,
} from '@/config/protocols'
import type { StructuredNotes, ActionLinkRecord, DecisionVoteRecord, DecisionOutcomeRecord } from '@/lib/schemas/protocols'
import DecisionActions from '@/app/admin/protocols/[id]/DecisionActions'

interface Props {
  notes: StructuredNotes
  actionLinks: ActionLinkRecord[]
  linkedActionIds: Set<string>
  unlinkedTaskItems: StructuredNotes['action_items']
  isReview: boolean
  isFinalized: boolean
  protocolId: string
  protocolTitle: string
  meetingDate: string
  attendeeCount: number
  creatingTask: string | null
  bulkCreatingTasks: boolean
  bulkTaskErrors: string[]
  decisionVotes: DecisionVoteRecord[]
  decisionOutcomes: DecisionOutcomeRecord[]
  currentUserId: string
  isProtocolCreator: boolean
  onCreateTask: (actionItem: StructuredNotes['action_items'][0]) => void
  onCreateAllTasks: () => void
  onRefresh: () => void
}

export function ProtocolActionItemsList({
  notes,
  actionLinks,
  linkedActionIds,
  unlinkedTaskItems,
  isReview,
  isFinalized,
  protocolId,
  attendeeCount,
  creatingTask,
  bulkCreatingTasks,
  bulkTaskErrors,
  decisionVotes,
  decisionOutcomes,
  currentUserId,
  isProtocolCreator,
  onCreateTask,
  onCreateAllTasks,
  onRefresh,
}: Props) {
  if (!notes.action_items || notes.action_items.length === 0) {
    return (
      <div id="protocol-step-tasks" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <Heading level={3} className="text-sm text-blue-900 mb-1">Keine Aktionen erkannt</Heading>
        <p className="text-sm text-blue-800">
          Die KI hat keine konkreten Aufgaben oder Entscheidungen extrahiert. Überarbeite den Inhalt oben und starte die Verarbeitung erneut.
        </p>
      </div>
    )
  }

  return (
    <div id="protocol-step-tasks" className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-neutral-50 flex items-center justify-between gap-3">
        <Heading level={2} className="text-lg text-neutral-900">
          <ListChecks className="w-5 h-5 inline mr-2 text-neutral-400" />
          Aktionen ({notes.action_items.length})
        </Heading>
        {unlinkedTaskItems.length > 0 && (isReview || isFinalized) && (
          <button
            onClick={onCreateAllTasks}
            disabled={bulkCreatingTasks}
            className="text-sm px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {bulkCreatingTasks ? 'Erstellt...' : `Schritt 4: ${unlinkedTaskItems.length} Aufgaben erstellen`}
          </button>
        )}
      </div>
      {bulkTaskErrors.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          <p className="font-medium">Nicht erstellte Aufgaben:</p>
          <ul className="list-disc list-inside mt-1">
            {bulkTaskErrors.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="divide-y">
        {notes.action_items.map((item) => {
          const isLinked = linkedActionIds.has(item.id)
          const link = actionLinks.find(l => l.action_item_id === item.id)
          const borderClass = ACTION_ITEM_BORDER_COLORS[item.item_type] || ''

          return (
            <div key={item.id} className={`p-4 ${borderClass}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        ACTION_ITEM_TYPE_COLORS[item.item_type] || 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {ACTION_ITEM_TYPE_LABELS[item.item_type]}
                    </span>
                    {item.priority_hint && (
                      <span className="text-xs text-neutral-500">
                        {PRIORITY_HINT_LABELS[item.priority_hint] || item.priority_hint}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-900">{item.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                    {item.assigned_to_name && (
                      <span>Zuständig: {item.assigned_to_name}</span>
                    )}
                    {item.due_hint && (
                      <span>Fällig: {item.due_hint}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isLinked && link ? (
                    <Link
                      href={`/admin/tasks/${link.linked_task_id}`}
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Verknüpft
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : item.item_type === 'task' && (isReview || isFinalized) ? (
                    <button
                      onClick={() => onCreateTask(item)}
                      disabled={creatingTask === item.id}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {creatingTask === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ListChecks className="w-4 h-4" />
                      )}
                      Aufgabe erstellen
                    </button>
                  ) : item.item_type === 'decision' && (isReview || isFinalized) ? (
                    <DecisionActions
                      protocolId={protocolId}
                      actionItemId={item.id}
                      votes={decisionVotes.filter(v => v.action_item_id === item.id)}
                      outcome={decisionOutcomes.find(o => o.action_item_id === item.id)}
                      currentUserId={currentUserId}
                      isProtocolCreator={isProtocolCreator}
                      attendeeCount={attendeeCount}
                      onRefresh={onRefresh}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
