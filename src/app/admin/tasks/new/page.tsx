/**
 * Admin New Task Page
 *
 * Form to create a new task.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import TaskFormClient from './TaskFormClient'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Neue Aufgabe',
  description: 'Neue Aufgabe erstellen.',
}

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.admin.tasks}
          className="flex items-center gap-2 text-text-secondary hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-neutral-300" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-action dark:text-primary-300" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-text-primary">Neue Aufgabe</Heading>
            <p className="text-text-secondary">Erstelle eine neue Teamaufgabe</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <TaskFormClient />
    </div>
  )
}
