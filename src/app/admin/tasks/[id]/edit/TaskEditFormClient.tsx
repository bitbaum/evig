'use client'

/**
 * Task Edit Form Client Component
 *
 * Form for editing existing tasks.
 * Created: 2026-02-05
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from '@/config/tasks'
import type { TaskEditItem } from '@/lib/schemas/tasks'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { Loader2, Save } from 'lucide-react'

interface TeamMember {
  user_id: string
  name: string
  position: string | null
}

interface TaskEditFormClientProps {
  task: TaskEditItem
}

interface TaskFormData {
  title: string
  description: string
  instructions: string
  task_type: string
  category: string
  priority: string
  schedule_human: string
  estimated_minutes: string
  due_date: string
  tags: string
  assigned_to: string
}

export default function TaskEditFormClient({ task }: TaskEditFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [formData, setFormData] = useState<TaskFormData>({
    title: task.title,
    description: task.description || '',
    instructions: task.instructions || '',
    task_type: task.task_type,
    category: task.category,
    priority: task.priority,
    schedule_human: task.schedule_human || '',
    estimated_minutes: task.estimated_minutes?.toString() || '',
    due_date: task.due_date || '',
    tags: task.tags?.join(', ') || '',
    assigned_to: task.assigned_to || '',
  })

  useEffect(() => {
    apiFetch<Array<{ user_id: string; user_name?: string | null; position?: string | null; is_active?: boolean }>>(
      '/api/admin/team/profiles',
    ).then(result => {
      if (result.success && result.data) {
        setTeamMembers(
          result.data
            .filter(p => p.is_active !== false)
            .map(p => ({
              user_id: p.user_id,
              name: p.user_name || 'Unbekannt',
              position: p.position || null,
            }))
        )
      }
      // team members optional on failure
    })
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        task_type: formData.task_type,
        category: formData.category,
        priority: formData.priority,
        schedule_human: formData.schedule_human || null,
        estimated_minutes: formData.estimated_minutes
          ? parseInt(formData.estimated_minutes, 10)
          : null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      }

      const result = await apiFetch<unknown>(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: payload,
      })

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Speichern')
      }

      router.push(`/admin/tasks/${task.id}`)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div id="task-edit-error" className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Titel <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'task-edit-error' : undefined}
            maxLength={200}
            placeholder="z.B. Kaffeemaschine reinigen"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Task Type */}
        <div>
          <label
            htmlFor="task_type"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Aufgabentyp <span className="text-error-500">*</span>
          </label>
          <select
            id="task_type"
            name="task_type"
            value={formData.task_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TASK_TYPES).map(([key, value]) => (
              <option key={value} value={value}>
                {TASK_TYPE_LABELS[value as keyof typeof TASK_TYPE_LABELS]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-neutral-500">
            {formData.task_type === 'one_time' && 'Wird nach Erledigung als abgeschlossen markiert'}
            {formData.task_type === 'recurring_scheduled' && 'Wiederholt sich nach einem festen Zeitplan'}
            {formData.task_type === 'recurring_as_needed' && 'Wird bei Bedarf erledigt, kein fester Zeitplan'}
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Kategorie <span className="text-error-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TASK_CATEGORIES).map(([key, value]) => (
              <option key={value} value={value}>
                {TASK_CATEGORY_LABELS[value as keyof typeof TASK_CATEGORY_LABELS]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Priorität
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(TASK_PRIORITIES).map(([key, value]) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value as keyof typeof TASK_PRIORITY_LABELS]}
              </option>
            ))}
          </select>
        </div>

        {/* Assign To */}
        {teamMembers.length > 0 && (
          <div>
            <label
              htmlFor="assigned_to"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Zuweisen an
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nicht zugewiesen</option>
              {teamMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.name}{member.position ? ` (${member.position})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Beschreibung
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={2000}
            placeholder="Was ist diese Aufgabe?"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label
            htmlFor="instructions"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Anleitung
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows={5}
            maxLength={5000}
            placeholder="Schritt-für-Schritt Anleitung zur Erledigung..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Schedule (for recurring) */}
        {formData.task_type === 'recurring_scheduled' && (
          <div>
            <label
              htmlFor="schedule_human"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Zeitplan
            </label>
            <input
              type="text"
              id="schedule_human"
              name="schedule_human"
              value={formData.schedule_human}
              onChange={handleChange}
              placeholder="z.B. Jeden Montag, Täglich um 9 Uhr"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Estimated Duration */}
        <div>
          <label
            htmlFor="estimated_minutes"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Geschätzte Dauer (Minuten)
          </label>
          <input
            type="number"
            id="estimated_minutes"
            name="estimated_minutes"
            value={formData.estimated_minutes}
            onChange={handleChange}
            min={1}
            max={480}
            placeholder="z.B. 30"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Due Date */}
        <div>
          <label
            htmlFor="due_date"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Fälligkeitsdatum (optional)
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Komma-getrennt, z.B. küche, hygiene, täglich"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-neutral-500">
            Mehrere Tags mit Komma trennen
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-900"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Speichern
          </button>
        </div>
      </div>
    </form>
  )
}
