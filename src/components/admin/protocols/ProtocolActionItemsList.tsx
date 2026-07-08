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
import {
  PRIORITY_HINT_LABELS,
  ACTION_ITEM_TYPE_LABELS,
} from '@/config/protocols'
import { pluralDe } from '@/lib/i18n/plural-de'
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

// Plural helpers keyed off the label SSOT so the vocabulary lives in one place.
const pluralTask = (n: number) => pluralDe(n, ACTION_ITEM_TYPE_LABELS.task, 'Aufgaben')
const pluralDecision = (n: number) => pluralDe(n, ACTION_ITEM_TYPE_LABELS.decision, 'Entscheidungen')
const pluralInfo = (n: number) => pluralDe(n, ACTION_ITEM_TYPE_LABELS.info, 'Informationen')

interface BucketHeaderProps {
  icon: React.ReactNode
  label: string
  count: number
  accent: string
}

function BucketHeader({ icon, label, count, accent }: BucketHeaderProps) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-subtle ${accent}`}>
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
  // Provenance: actionItemId's topic → topic title, so each derived item can
  // show which structured-note topic it came from (raw → notes → item chain).
  const topicTitleById = new Map((notes.topics ?? []).map((t) => [t.id, t.title]))

  if (!notes.action_items || notes.action_items.length === 0) {
    return (
      <div className="bg-surface-raised border border-default rounded-lg p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">Keine Aktionen erkannt</h3>
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

  return (
    <div className="bg-surface-base rounded-lg border border-default overflow-hidden">
      {/* One header + one tally. The old design also printed a redundant
          "Aktionen N" superset count next to the "Aufgaben M" subset count,
          which read as two conflicting numbers — removed. */}
      <div className="px-4 py-4 border-b border-subtle bg-action-muted/50">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-action mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-text-primary">
              Aktionen & Entscheidungen
            </h2>
            <p className="text-sm text-text-secondary">
              {[
                tasks.length > 0 ? `${tasks.length} ${pluralTask(tasks.length)}` : null,
                decisions.length > 0 ? `${decisions.length} ${pluralDecision(decisions.length)}` : null,
                openQuestions.length > 0 ? `${openQuestions.length} ${pluralInfo(openQuestions.length)}` : null,
              ].filter(Boolean).join(' · ')}
              {' aus dem Protokoll.'}
            </p>
            {canAct && (
              <p className="text-xs text-text-tertiary">
                {unlinkedTaskItems.length > 0 && <>Erstelle alle Aufgaben mit einem Klick. </>}
                {openDecisionCount > 0 && <>Offene Entscheidungen können unten direkt zur Abstimmung.</>}
                {unlinkedTaskItems.length === 0 && openDecisionCount === 0 && <>Alle Aufgaben verknüpft, alle Entscheidungen geschlossen.</>}
              </p>
            )}
          </div>
          {canAct && unlinkedTaskItems.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateAllTasks}
              disabled={bulkCreatingTasks}
              className="shrink-0 gap-2"
            >
              {bulkCreatingTasks
                ? <><Loader2 className="w-4 h-4 animate-spin" />Erstellt…</>
                : <><ListChecks className="w-4 h-4" />Alle {unlinkedTaskItems.length} {pluralTask(unlinkedTaskItems.length)} erstellen</>
              }
            </Button>
          )}
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
            label={pluralTask(tasks.length)}
            count={tasks.length}
            accent="bg-action-muted/50"
          />
          <div className="divide-y divide-subtle">
            {tasks.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                topicTitle={item.topic_id ? topicTitleById.get(item.topic_id) : undefined}
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
        <div className={tasks.length > 0 ? 'border-t border-default' : ''}>
          <BucketHeader
            icon={<Vote className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
            label={pluralDecision(decisions.length)}
            count={decisions.length}
            accent="bg-purple-50/50 dark:bg-purple-900/10"
          />
          <div className="divide-y divide-subtle">
            {decisions.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                topicTitle={item.topic_id ? topicTitleById.get(item.topic_id) : undefined}
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

      {/* Bucket 3: Info */}
      {openQuestions.length > 0 && (
        <div className={(tasks.length > 0 || decisions.length > 0) ? 'border-t border-default' : ''}>
          <BucketHeader
            icon={<HelpCircle className="w-3.5 h-3.5 text-text-tertiary" />}
            label={pluralInfo(openQuestions.length)}
            count={openQuestions.length}
            accent="bg-surface-raised"
          />
          <div className="divide-y divide-subtle">
            {openQuestions.map((item) => (
              <ActionRow
                key={item.id}
                item={item}
                topicTitle={item.topic_id ? topicTitleById.get(item.topic_id) : undefined}
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
  topicTitle: string | undefined
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
  topicTitle,
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
          {/* Provenance: which structured-note topic this item was derived from */}
          {topicTitle && (
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <span className="text-text-muted">aus:</span> {topicTitle}
            </span>
          )}
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
