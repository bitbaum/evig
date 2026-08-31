/**
 * TaskMainContent — left column of the detail grid:
 * description, instructions, actions, AI helper, completion history.
 * Presentational server component for the admin task detail page.
 */

import { formatDateShort, formatDateTimeNumeric } from '@/lib/date-formats';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/config/tasks';
import type { TaskDetail, TaskCompletion } from '@/lib/schemas/tasks';
import { CheckCircle2 } from 'lucide-react';
import TaskActionsClient from '../TaskActionsClient';
import { IconBadge } from '@/components/ui/IconBadge';
import { Card } from '@/components/ui/card';
import { TaskAIChat } from '../TaskAIChat';
import Heading from '@/components/admin/AdminHeading';
import type { getTaskProtocolSource } from '@/lib/services/protocol-decision-tasks';

type ProtocolSource = Awaited<ReturnType<typeof getTaskProtocolSource>>;

export function TaskMainContent({
  task,
  completions,
  protocolSource,
}: {
  task: TaskDetail;
  completions: TaskCompletion[];
  protocolSource: ProtocolSource;
}) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Description */}
      {task.description && (
        <Card className="p-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary mb-3">
            Beschreibung
          </Heading>
          <p className="text-text-secondary whitespace-pre-wrap">{task.description}</p>
        </Card>
      )}

      {/* Instructions */}
      {task.instructions && (
        <Card className="p-6">
          <Heading level={2} className="text-lg font-semibold text-text-primary mb-3">
            Anleitung
          </Heading>
          <div className="text-text-secondary whitespace-pre-wrap">{task.instructions}</div>
        </Card>
      )}

      {/* Actions */}
      <TaskActionsClient taskId={task.id} taskTitle={task.title} isArchived={task.is_archived} />

      {/* AI helper — complements "Um Hilfe bitten": teammates OR the AI */}
      <TaskAIChat
        title={task.title}
        description={task.description}
        instructions={task.instructions}
        status={TASK_STATUS_LABELS[task.current_status] || task.current_status}
        priority={TASK_PRIORITY_LABELS[task.priority] || task.priority}
        dueDate={task.due_date ? formatDateShort(task.due_date) : null}
        protocolTitle={protocolSource?.protocolTitle ?? null}
      />

      {/* Completion History */}
      <Card className="p-6">
        <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">
          Erledigungen ({completions.length})
        </Heading>
        {completions.length === 0 ? (
          <p className="text-text-tertiary">Noch keine Erledigungen</p>
        ) : (
          <div className="space-y-4">
            {completions.map((completion) => (
              <div
                key={completion.id}
                className="flex items-start gap-3 pb-4 border-b last:border-0"
              >
                <IconBadge icon={CheckCircle2} shape="circle" size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary">
                      {completion.completed_by_name || completion.completed_by_email || 'Unbekannt'}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {formatDateTimeNumeric(completion.completed_at)}
                    </p>
                  </div>
                  {completion.duration_minutes && (
                    <p className="text-sm text-text-secondary">
                      Dauer: {completion.duration_minutes} Minuten
                    </p>
                  )}
                  {completion.notes && (
                    <p className="text-sm text-text-secondary mt-1">{completion.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
