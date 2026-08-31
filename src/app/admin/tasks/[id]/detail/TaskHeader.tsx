/**
 * TaskHeader — page header (back link, title, category/type) + protocol source banner.
 * Presentational server component for the admin task detail page.
 */

import Link from 'next/link';
import { formatDateShort } from '@/lib/date-formats';
import { TASK_CATEGORY_LABELS, TASK_TYPE_LABELS } from '@/config/tasks';
import type { TaskDetail } from '@/lib/schemas/tasks';
import { ArrowLeft, ClipboardList, Edit, FileText } from 'lucide-react';
import Heading from '@/components/admin/AdminHeading';
import { ROUTES } from '@/config/routes';
import type { getTaskProtocolSource } from '@/lib/services/protocol-decision-tasks';

type ProtocolSource = Awaited<ReturnType<typeof getTaskProtocolSource>>;

export function TaskHeader({
  id,
  task,
  protocolSource,
}: {
  id: string;
  task: TaskDetail;
  protocolSource: ProtocolSource;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.admin.tasks}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Link>
          <div className="w-px h-6 bg-surface-overlay" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-action" />
            </div>
            <div>
              <Heading level={1} className="text-2xl font-bold text-text-primary">
                {task.title}
              </Heading>
              <p className="text-text-secondary">
                {TASK_CATEGORY_LABELS[task.category]} · {TASK_TYPE_LABELS[task.task_type]}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tasks/${id}/edit`}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border hover:border-strong rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {protocolSource && (
        <div className="rounded-lg border border-subtle bg-surface-raised px-4 py-3 flex items-center gap-3">
          <FileText className="w-4 h-4 text-action shrink-0" />
          <p className="text-sm text-text-secondary">
            Aus Protokoll{' '}
            <Link
              href={`/admin/protocols/${protocolSource.protocolId}`}
              className="font-medium text-action hover:text-action-hover"
            >
              {protocolSource.protocolTitle}
            </Link>
            {protocolSource.meetingDate ? ` · ${formatDateShort(protocolSource.meetingDate)}` : ''}
          </p>
        </div>
      )}
    </>
  );
}
