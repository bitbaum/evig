'use client'

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
import { Loader2, Save } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useTaskForm } from '@/hooks/useTaskForm'

interface Props {
  task?: TaskEditItem
}

export default function TaskFormClient({ task }: Props) {
  const router = useRouter()
  const {
    isEdit,
    loading,
    error,
    teamMembers,
    formData,
    handleChange,
    handleAIFieldsFilled,
    handleSubmit,
  } = useTaskForm(task)

  const errorId = isEdit ? 'task-edit-error' : 'task-form-error'

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div id={errorId} className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {!isEdit && (
          <AIFormAssist
            formType="task"
            placeholder="Beschreibe die Aufgabe in 1-2 Sätzen..."
            defaultExpanded={true}
            onFieldsFilled={handleAIFieldsFilled}
            currentData={formData as unknown as Record<string, unknown>}
          />
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
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
            aria-describedby={error ? errorId : undefined}
            maxLength={200}
            placeholder="z.B. Kaffeemaschine reinigen"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
        </div>

        {/* Task Type */}
        <div>
          <label htmlFor="task_type" className="block text-sm font-medium text-neutral-700 mb-1">
            Aufgabentyp <span className="text-error-500">*</span>
          </label>
          <select
            id="task_type"
            name="task_type"
            value={formData.task_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
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
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
            Kategorie <span className="text-error-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
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
          <label htmlFor="priority" className="block text-sm font-medium text-neutral-700 mb-1">
            Priorität
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
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
            <label htmlFor="assigned_to" className="block text-sm font-medium text-neutral-700 mb-1">
              Zuweisen an
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
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
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
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
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-neutral-700 mb-1">
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
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
        </div>

        {/* Schedule (for recurring) */}
        {formData.task_type === 'recurring_scheduled' && (
          <div>
            <label htmlFor="schedule_human" className="block text-sm font-medium text-neutral-700 mb-1">
              Zeitplan
            </label>
            <input
              type="text"
              id="schedule_human"
              name="schedule_human"
              value={formData.schedule_human}
              onChange={handleChange}
              placeholder="z.B. Jeden Montag, Täglich um 9 Uhr"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
            />
          </div>
        )}

        {/* Estimated Duration */}
        <div>
          <label htmlFor="estimated_minutes" className="block text-sm font-medium text-neutral-700 mb-1">
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
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-neutral-700 mb-1">
            Fälligkeitsdatum (optional)
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-neutral-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Komma-getrennt, z.B. küche, hygiene, täglich"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
          />
          <p className="mt-1 text-sm text-neutral-500">Mehrere Tags mit Komma trennen</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-info-600 text-white rounded-lg hover:bg-info-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Speichern' : 'Aufgabe erstellen'}
          </button>
        </div>
      </div>
    </form>
  )
}
