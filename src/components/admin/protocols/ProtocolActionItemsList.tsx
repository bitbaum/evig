import { Link } from '@/i18n/navigation'
import {
  Loader2,
  CheckCircle2,
  ListChecks,
  ExternalLink,
  Vote,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import {
  PRIORITY_HINT_LABELS,
} from '@/config/protocols'
import type { StructuredNotes, ActionLinkRecord } from '@/lib/schemas/protocols'
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud'
import DecisionBridge from '@/components/admin/protocols/DecisionBridge'

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
  // QQ.6 — standalone decisions linked to this protocol's action items.
  protocolDecisions: ProtocolDecisionSummary[]
  currentUserId: string
  isProtocolCreator: boolean
  onCreateTask: (actionItem: StructuredNotes['action_items'][0]) => void
  onCreateAllTasks: () => void
  onRefresh: () => void
}

interface BucketHeaderProps {
  icon: React.ReactNode
  label: string
  count: number
  accent: string
}

function BucketHeader({ icon, label, count, accent }: BucketHeaderProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${accent}`}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
      <span className="ml-auto text-xs text-text-tertiary tabular-nums">{count}</span>
    </div>
  )
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
  protocolDecisions,
  currentUserId,
  isProtocolCreator,
  onCreateTask,
  onCreateAllTasks,
  onRefresh,
}: Props) {
  // Quick lookup: actionItemId → linked standalone decision (if any).
  const decisionsByActionItem = new Map(
    protocolDecisions.map((d) => [d.actionItemId, d])
  )
  if (!notes.action_items || notes.action_items.length === 0) {
    return (
      <div id="protocol-step-tasks" className="bg-surface-raised border border rounded-lg p-4">
        <Heading level={3} className="text-sm text-text-primary mb-1">Keine Aktionen erkannt</Heading>
        <p className="text-sm text-text-secondary">
          Die KI hat keine konkreten Aufgaben oder Entscheidungen extrahiert. Überarbeite den Inhalt oben und starte die Verarbeitung erneut.
        </p>
      </div>
    )
  }

  const tasks = notes.action_items.filter(i => i.item_type === 'task')
  const decisions = notes.action_items.filter(i => i.item_type === 'decision')
  const openQuestions = notes.action_items.filter(i => i.item_type === 'info')
  const openDecisionCount = decisions.filter((d) => {
    const linked = decisionsByActionItem.get(d.id)
    return !linked || !linked.isClosed
  }).length

  const canAct = isReview || isFinalized
  const showSummaryBanner = canAct && notes.action_items.length > 0

  return (
    <div id="protocol-step-tasks" className="bg-surface-base rounded-lg border border overflow-hidden">

      {showSummaryBanner && (
        <div className="px-4 py-4 border-b border-subtle bg-action-muted/50 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-action mt-0.5 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium text-text-primary">
                KI hat erkannt:{' '}
                {tasks.length > 0 && (
                  <span className="text-action">
                    {tasks.length} {tasks.length === 1 ? 'Aufgabe' : 'Aufgaben'}
                  </span>
                )}
                {tasks.length > 0 && (decisions.length > 0 || openQuestions.length > 0) && ' · '}
                {decisions.length > 0 && (
                  <span className="text-violet-700 dark:text-violet-300">
                    {decisions.length} {decisions.length === 1 ? 'Entscheidung' : 'Entscheidungen'}
                  </span>
                )}
                {decisions.length > 0 && openQuestions.length > 0 && ' · '}
                {openQuestions.length > 0 && (
                  <span className="text-text-secondary">
                    {openQuestions.length} Info
                  </span>
                )}
              </p>
              <p className="text-xs text-text-secondary">
                {unlinkedTaskItems.length > 0 && (
                  <>Erstelle alle Aufgaben mit einem Klick. </>
                )}
                {openDecisionCount > 0 && (
                  <>Entscheidungen sind offen — Teilnehmer können unten direkt abstimmen.</>
                )}
                {unlinkedTaskItems.length === 0 && openDecisionCount === 0 && (
                  <>Alle Aufgaben verknüpft, alle Entscheidungen geschlossen.</>
                )}
              </p>
            </div>
            {unlinkedTaskItems.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={onCreateAllTasks}
                disabled={bulkCreatingTasks}
                className="shrink-0 gap-2"
              >
                {bulkCreatingTasks
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Erstellt…</>
                  : <><ListChecks className="w-4 h-4" />Alle {unlinkedTaskItems.length} {unlinkedTaskItems.length === 1 ? 'Aufgabe' : 'Aufgaben'} erstellen</>
                }
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-subtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-text-muted" />
          <Heading level={2} className="text-text-primary">
            Aktionen
          </Heading>
          <span className="text-xs text-text-muted tabular-nums">
            {notes.action_items.length}
          </span>
        </div>
      </div>

      {bulkTaskErrors.length > 0 && (
        <div className="mx-4 mt-3 rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-400">
          <p className="font-medium">Nicht erstellte Aufgaben:</p>
          <ul className="list-disc list-inside mt-1">
            {bulkTaskErrors.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Bucket 1: Tasks */}
      {tasks.length > 0 && (
        <div>
          <BucketHeader
            icon={<ListChecks className="w-3.5 h-3.5 text-action" />}
            label="Aufgaben"
            count={tasks.length}
            accent="bg-action-muted/50 border-subtle"
          />
          <div className="divide-y divide-subtle">
            {tasks.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                isLinked={linkedActionIds.has(item.id)}
                link={actionLinks.find(l => l.action_item_id === item.id)}
                canAct={canAct}
                creatingTask={creatingTask}
                protocolId={protocolId}
                attendeeCount={attendeeCount}
                linkedDecision={decisionsByActionItem.get(item.id)}
                
                currentUserId={currentUserId}
                isProtocolCreator={isProtocolCreator}
                onCreateTask={onCreateTask}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bucket 2: Decisions */}
      {decisions.length > 0 && (
        <div className={tasks.length > 0 ? 'border-t border' : ''}>
          <BucketHeader
            icon={<Vote className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
            label="Entscheidungen"
            count={decisions.length}
            accent="bg-violet-50/50 dark:bg-violet-900/10 border-subtle"
          />
          <div className="divide-y divide-subtle">
            {decisions.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                isLinked={linkedActionIds.has(item.id)}
                link={actionLinks.find(l => l.action_item_id === item.id)}
                canAct={canAct}
                creatingTask={creatingTask}
                protocolId={protocolId}
                attendeeCount={attendeeCount}
                linkedDecision={decisionsByActionItem.get(item.id)}
                
                currentUserId={currentUserId}
                isProtocolCreator={isProtocolCreator}
                onCreateTask={onCreateTask}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bucket 3: Open Questions / Info */}
      {openQuestions.length > 0 && (
        <div className={(tasks.length > 0 || decisions.length > 0) ? 'border-t border' : ''}>
          <BucketHeader
            icon={<HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />}
            label="Offene Fragen / Info"
            count={openQuestions.length}
            accent="bg-surface-raised border-subtle"
          />
          <div className="divide-y divide-subtle">
            {openQuestions.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                isLinked={linkedActionIds.has(item.id)}
                link={actionLinks.find(l => l.action_item_id === item.id)}
                canAct={canAct}
                creatingTask={creatingTask}
                protocolId={protocolId}
                attendeeCount={attendeeCount}
                linkedDecision={decisionsByActionItem.get(item.id)}
                
                currentUserId={currentUserId}
                isProtocolCreator={isProtocolCreator}
                onCreateTask={onCreateTask}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ActionRow — single item row, shared across all buckets
// =============================================================================

interface ActionRowProps {
  item: StructuredNotes['action_items'][0]
  isLinked: boolean
  link: ActionLinkRecord | undefined
  canAct: boolean
  creatingTask: string | null
  protocolId: string
  attendeeCount: number
  linkedDecision: ProtocolDecisionSummary | undefined
  currentUserId: string
  isProtocolCreator: boolean
  onCreateTask: (item: StructuredNotes['action_items'][0]) => void
  onRefresh: () => void
}

function ActionRow({
  item,
  isLinked,
  link,
  canAct,
  creatingTask,
  protocolId,
  linkedDecision,
  isProtocolCreator,
  onCreateTask,
  onRefresh,
}: ActionRowProps) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-relaxed">{item.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {item.assigned_to_name && (
            <span className="text-xs text-text-tertiary">
              {item.assigned_to_name}
            </span>
          )}
          {item.due_hint && (
            <span className="text-xs text-text-muted">
              {item.due_hint}
            </span>
          )}
          {item.priority_hint && item.priority_hint !== 'normal' && (
            <span className={`text-xs font-medium ${
              item.priority_hint === 'high'
                ? 'text-error-600 dark:text-error-400'
                : 'text-text-muted'
            }`}>
              {PRIORITY_HINT_LABELS[item.priority_hint] ?? item.priority_hint}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 pt-0.5">
        {isLinked && link ? (
          <Link
            href={`/admin/tasks/${link.linked_task_id}`}
            className="inline-flex items-center gap-1 text-xs text-action hover:text-action"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verknüpft
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : item.item_type === 'task' && canAct ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateTask(item)}
            disabled={creatingTask === item.id}
            className="inline-flex items-center gap-1 text-xs text-action hover:text-action h-auto px-0 bg-transparent hover:bg-transparent"
          >
            {creatingTask === item.id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ListChecks className="w-3.5 h-3.5" />
            }
            Aufgabe erstellen
          </Button>
        ) : item.item_type === 'decision' && canAct ? (
          <DecisionBridge
            protocolId={protocolId}
            actionItemId={item.id}
            actionItemDescription={item.description}
            linkedDecision={linkedDecision}
            isProtocolCreator={isProtocolCreator}
            onRefresh={onRefresh}
          />
        ) : null}
      </div>
    </div>
  )
}
