'use client';

import { Link } from '@/i18n/navigation';
import { Loader2, CheckCircle2, ListChecks, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRIORITY_HINT_LABELS } from '@/config/protocols';
import type { StructuredNotes, ActionLinkRecord } from '@/lib/schemas/protocols';
import type { ProtocolDecisionSummary } from '@/lib/services/decisions-crud';
import DecisionBridge from '@/components/admin/protocols/DecisionBridge';

interface ActionRowProps {
  item: StructuredNotes['action_items'][0];
  topicTitle: string | undefined;
  isLinked: boolean;
  link: ActionLinkRecord | undefined;
  canAct: boolean;
  creatingTask: string | null;
  protocolId: string;
  attendeeCount: number;
  linkedDecision: ProtocolDecisionSummary | undefined;
  currentUserId: string;
  isProtocolCreator: boolean;
  onCreateTask: (item: StructuredNotes['action_items'][0]) => void;
  onRefresh: () => void;
}

export function ActionRow({
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
            <span className="text-xs text-text-tertiary">{item.assigned_to_name}</span>
          )}
          {item.due_hint && <span className="text-xs text-text-muted">{item.due_hint}</span>}
          {item.priority_hint && item.priority_hint !== 'normal' && (
            <span
              className={`text-xs font-medium ${
                item.priority_hint === 'high'
                  ? 'text-error-600 dark:text-error-400'
                  : 'text-text-muted'
              }`}
            >
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
            {creatingTask === item.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ListChecks className="w-3.5 h-3.5" />
            )}
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
  );
}
