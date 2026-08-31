/**
 * TaskAlerts — active attention flags + pending requests.
 * Two sibling alert banners; rendered as a Fragment so they stay direct
 * children of the page's `space-y-6` container (spacing preserved).
 * Presentational server component for the admin task detail page.
 */

import { formatDateTimeNumeric } from '@/lib/date-formats';
import type { TaskAttentionFlag, TaskRequestRecord } from '@/lib/schemas/tasks';
import { AlertTriangle, Send } from 'lucide-react';
import { TaskRequestResponseButtons } from '../TaskRequestResponseButtons';
import Heading from '@/components/admin/AdminHeading';

export function TaskAlerts({
  activeFlags,
  pendingRequests,
  canViewerRespond,
}: {
  activeFlags: TaskAttentionFlag[];
  pendingRequests: TaskRequestRecord[];
  canViewerRespond: (req: TaskRequestRecord) => boolean;
}) {
  return (
    <>
      {/* Active Alerts */}
      {activeFlags.length > 0 && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5" />
            <div>
              <Heading level={3} className="font-medium text-error-800 dark:text-error-200">
                Aufgabe braucht Aufmerksamkeit
              </Heading>
              {activeFlags.map((flag) => (
                <p key={flag.id} className="text-sm text-error-700 dark:text-error-300 mt-1">
                  {flag.flagged_by_name || 'Jemand'}: {flag.message || 'Keine Nachricht'}
                  <span className="text-error-500 ml-2">
                    ({formatDateTimeNumeric(flag.created_at)})
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 rounded-lg p-4">
          <div className="flex items-start gap-3 w-full">
            <Send className="w-5 h-5 text-warning-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-3">
              <Heading level={3} className="font-medium text-warning-800 dark:text-warning-200">
                Offene Anfragen
              </Heading>
              {pendingRequests.map((req) => (
                <div key={req.id} className="text-sm text-warning-700 dark:text-warning-300">
                  <p>
                    {req.requested_by_name || 'Jemand'} fragt{' '}
                    {req.is_broadcast
                      ? 'alle Teammitglieder'
                      : req.requested_user_name || 'jemanden'}
                    {req.message && `: "${req.message}"`}
                    <span className="text-warning-500 ml-2">
                      ({formatDateTimeNumeric(req.created_at)})
                    </span>
                  </p>
                  <TaskRequestResponseButtons
                    requestId={req.id}
                    canRespond={canViewerRespond(req)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
