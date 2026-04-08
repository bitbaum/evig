/**
 * Admin Edit Task Page
 *
 * Form to edit an existing task.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import type { TaskEditItem } from '@/lib/schemas/tasks'
import TaskEditFormClient from './TaskEditFormClient'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Aufgabe bearbeiten | RevampIT Admin',
  description: 'Aufgabe bearbeiten.',
}

async function getTask(id: string): Promise<TaskEditItem | null> {
  try {
    const result = await query<TaskEditItem>(
      `SELECT id, title, description, instructions, task_type, category, priority, schedule_human, estimated_minutes, due_date, tags, assigned_to
       FROM ${TABLE_NAMES.TASKS}
       WHERE id = $1 AND is_archived = false`,
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    logger.error('Error fetching task for edit', { error, taskId: id })
    return null
  }
}

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/tasks/${id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-gray-300" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-gray-900">Aufgabe bearbeiten</Heading>
            <p className="text-gray-600">{task.title}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <TaskEditFormClient task={task} />
    </div>
  )
}
