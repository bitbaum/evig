/**
 * Admin Task Detail Page - Server Component
 *
 * Shows task details, completion history, and actions.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { REQUEST_STATUSES } from '@/config/tasks'
import type { TaskRequestRecord } from '@/lib/schemas/tasks'
import { auth } from '@/auth'
import { getTaskProtocolSource } from '@/lib/services/protocol-decision-tasks'
import {
  getTask,
  getCompletions,
  getAttentionFlags,
  getRequests,
} from '@/lib/tasks/task-detail'
import { TaskHeader } from './detail/TaskHeader'
import { TaskAlerts } from './detail/TaskAlerts'
import { TaskMainContent } from './detail/TaskMainContent'
import { TaskStatusBadges, TaskSidebar } from './detail/TaskSidebar'

export const metadata: Metadata = {
  title: 'Aufgabe Details',
  description: 'Aufgabendetails und Verlauf anzeigen.',
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  const [session, completions, flags, requests, protocolSource] = await Promise.all([
    auth(),
    getCompletions(id),
    getAttentionFlags(id),
    getRequests(id),
    getTaskProtocolSource(id),
  ])

  const activeFlags = flags.filter((f) => !f.is_resolved)
  const pendingRequests = requests.filter((r) => r.status === REQUEST_STATUSES.PENDING)
  const viewerId = session?.user?.id

  /**
   * Can the current viewer respond to this request?
   * - Targeted: only the requested user
   * - Broadcast (requested_user_id is null): any viewer except the requester
   * - Requester themselves: never (server enforces; we hide the UI too)
   */
  const canViewerRespond = (req: TaskRequestRecord): boolean => {
    if (!viewerId) return false
    if (req.requested_by === viewerId) return false
    if (req.is_broadcast) return true
    return req.requested_user_id === viewerId
  }

  return (
    <div className="space-y-6">
      <TaskHeader id={id} task={task} protocolSource={protocolSource} />

      <TaskStatusBadges task={task} />

      <TaskAlerts
        activeFlags={activeFlags}
        pendingRequests={pendingRequests}
        canViewerRespond={canViewerRespond}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskMainContent task={task} completions={completions} protocolSource={protocolSource} />
        <TaskSidebar task={task} completions={completions} flags={flags} requests={requests} />
      </div>
    </div>
  )
}
