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
import TaskEditFormClient from './TaskEditFormClient'

export const metadata: Metadata = {
  title: 'Aufgabe bearbeiten | RevampIT Admin',
  description: 'Aufgabe bearbeiten.',
}

interface Task {
  id: string
  title: string
  description: string | null
  instructions: string | null
  task_type: string
  category: string
  priority: string
  schedule_human: string | null
  estimated_minutes: number | null
  tags: string[]
}

async function getTask(id: string): Promise<Task | null> {
  try {
    const result = await query<Task>(
      `SELECT id, title, description, instructions, task_type, category, priority, schedule_human, estimated_minutes, tags
       FROM ${TABLE_NAMES.TASKS}
       WHERE id = $1 AND is_archived = false`,
      [id]
    )
    return result.rows[0] || null
  } catch {
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
            <h1 className="text-2xl font-bold text-gray-900">Aufgabe bearbeiten</h1>
            <p className="text-gray-600">{task.title}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <TaskEditFormClient task={task} />
    </div>
  )
}
