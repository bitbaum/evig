import { Link } from '@/i18n/navigation'
import {
  Loader2,
  CheckCircle2,
  ListChecks,
  ExternalLink,
  Vote,
  HelpCircle,
} from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  PRIORITY_HINT_LABELS,
} from '@/config/protocols'
import type { StructuredNotes, ActionLinkRecord, DecisionVoteRecord, DecisionOutcomeRecord } from '@/lib/schemas/protocols'
import DecisionActions from '@/components/admin/protocols/DecisionActions'

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
      <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{count}</span>
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
      <div id="protocol-step-tasks" className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] rounded-lg p-4">
        <Heading level={3} className="text-sm text-neutral-900 dark:text-white mb-1">Keine Aktionen erkannt</Heading>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Die KI hat keine konkreten Aufgaben oder Entscheidungen extrahiert. Überarbeite den Inhalt oben und starte die Verarbeitung erneut.
        </p>
      </div>
    )
  }

  const tasks = notes.action_items.filter(i => i.item_type === 'task')
  const decisions = notes.action_items.filter(i => i.item_type === 'decision')
  const openQuestions = notes.action_items.filter(i => i.item_type === 'info')

  const canAct = isReview || isFinalized

  return (
    <div id="protocol-step-tasks" className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <Heading level={2} className="text-neutral-900 dark:text-white">
            Aktionen
          </Heading>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">
            {notes.action_items.length}
          </span>
        </div>
        {unlinkedTaskItems.length > 0 && canAct && (
          <button
            onClick={onCreateAllTasks}
            disabled={bulkCreatingTasks}
            className="text-xs px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 transition-colors"
          >
            {bulkCreatingTasks
              ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Erstellt…</>
              : `${unlinkedTaskItems.length} Aufgaben erstellen`
            }
          </button>
        )}
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
            icon={<ListChecks className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
            label="Aufgaben"
            count={tasks.length}
            accent="bg-primary-50/50 dark:bg-primary-900/10 border-neutral-100 dark:border-white/[0.04]"
          />
          <div className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
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
                decisionVotes={decisionVotes}
                decisionOutcomes={decisionOutcomes}
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
        <div className={tasks.length > 0 ? 'border-t border-neutral-200 dark:border-white/[0.06]' : ''}>
          <BucketHeader
            icon={<Vote className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
            label="Entscheidungen"
            count={decisions.length}
            accent="bg-violet-50/50 dark:bg-violet-900/10 border-neutral-100 dark:border-white/[0.04]"
          />
          <div className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
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
                decisionVotes={decisionVotes}
                decisionOutcomes={decisionOutcomes}
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
        <div className={(tasks.length > 0 || decisions.length > 0) ? 'border-t border-neutral-200 dark:border-white/[0.06]' : ''}>
          <BucketHeader
            icon={<HelpCircle className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />}
            label="Offene Fragen / Info"
            count={openQuestions.length}
            accent="bg-neutral-50 dark:bg-neutral-800/30 border-neutral-100 dark:border-white/[0.04]"
          />
          <div className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
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
                decisionVotes={decisionVotes}
                decisionOutcomes={decisionOutcomes}
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
  decisionVotes: DecisionVoteRecord[]
  decisionOutcomes: DecisionOutcomeRecord[]
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
  attendeeCount,
  decisionVotes,
  decisionOutcomes,
  currentUserId,
  isProtocolCreator,
  onCreateTask,
  onRefresh,
}: ActionRowProps) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-white leading-relaxed">{item.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          {item.assigned_to_name && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {item.assigned_to_name}
            </span>
          )}
          {item.due_hint && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {item.due_hint}
            </span>
          )}
          {item.priority_hint && item.priority_hint !== 'normal' && (
            <span className={`text-xs font-medium ${
              item.priority_hint === 'high'
                ? 'text-error-600 dark:text-error-400'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}>
              {PRIORITY_HINT_LABELS[item.priority_hint] ?? item.priority_hint}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 pt-0.5">
        {isLinked && link ? (
          <Link
            href={`/admin/tasks/${link.linked_task_id}`}
            className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verknüpft
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : item.item_type === 'task' && canAct ? (
          <button
            onClick={() => onCreateTask(item)}
            disabled={creatingTask === item.id}
            className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 disabled:opacity-50"
          >
            {creatingTask === item.id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <ListChecks className="w-3.5 h-3.5" />
            }
            Aufgabe erstellen
          </button>
        ) : item.item_type === 'decision' && canAct ? (
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
  )
}
