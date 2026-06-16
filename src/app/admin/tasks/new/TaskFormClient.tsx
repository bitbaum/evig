'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from '@/config/tasks'
import type { TaskEditItem } from '@/lib/schemas/tasks'
import { Loader2, Save, Info, ChevronRight } from 'lucide-react'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { useTaskForm } from '@/hooks/useTaskForm'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  task?: TaskEditItem
}

export default function TaskFormClient({ task }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const source = searchParams.get('source')
  const prefill = task ? undefined : {
    title: searchParams.get('title') ?? undefined,
    description: searchParams.get('description') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
  }

  const {
    isEdit,
    loading,
    error,
    teamMembers,
    formData,
    handleChange,
    handleAIFieldsFilled,
    handleSubmit,
  } = useTaskForm(task, prefill)

  const errorId = isEdit ? 'task-edit-error' : 'task-form-error'

  const hasAdvancedValues = useMemo(() => Boolean(
    formData.assigned_to ||
    formData.instructions ||
    formData.estimated_minutes ||
    formData.due_date ||
    formData.tags.trim(),
  ), [formData])

  const [advancedOpen, setAdvancedOpen] = useState(isEdit && hasAdvancedValues)

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {source === 'it_hilfe' && (
        <div className="mb-4 p-3 bg-action-muted border border-strong rounded-lg flex items-center gap-2 text-sm text-action">
          <Info className="w-4 h-4 shrink-0" />
          Aus IT-Hilfe-Anfrage erstellt — Felder wurden vorausgefüllt.
        </div>
      )}
      {error && (
        <div id={errorId} className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="bg-surface-base rounded-lg border p-6 space-y-6">
        {!isEdit && (
          <AIFormAssist
            formType="task"
            placeholder="Beschreibe die Aufgabe in 1-2 Sätzen..."
            defaultExpanded={true}
            onFieldsFilled={handleAIFieldsFilled}
            currentData={formData as unknown as Record<string, unknown>}
          />
        )}

        <FormField
          label="Titel"
          required
          htmlFor="title"
        >
          <Input
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
          />
        </FormField>

        <FormField
          label="Aufgabentyp"
          required
          htmlFor="task_type"
          hint={
            formData.task_type === TASK_TYPES.ONE_TIME ? 'Wird nach Erledigung als abgeschlossen markiert'
            : formData.task_type === TASK_TYPES.RECURRING_SCHEDULED ? 'Wiederholt sich nach einem festen Zeitplan'
            : formData.task_type === TASK_TYPES.RECURRING_AS_NEEDED ? 'Wird bei Bedarf erledigt, kein fester Zeitplan'
            : undefined
          }
        >
          <Select id="task_type" name="task_type" value={formData.task_type} onChange={handleChange}>
            {Object.entries(TASK_TYPES).map(([, value]) => (
              <option key={value} value={value}>
                {TASK_TYPE_LABELS[value as keyof typeof TASK_TYPE_LABELS]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Kategorie" required htmlFor="category">
          <Select id="category" name="category" value={formData.category} onChange={handleChange}>
            {Object.entries(TASK_CATEGORIES).map(([, value]) => (
              <option key={value} value={value}>
                {TASK_CATEGORY_LABELS[value as keyof typeof TASK_CATEGORY_LABELS]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Beschreibung" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={2000}
            placeholder="Was ist diese Aufgabe?"
          />
        </FormField>

        <FormField label="Priorität" htmlFor="priority">
          <Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
            {Object.entries(TASK_PRIORITIES).map(([, value]) => (
              <option key={value} value={value}>
                {TASK_PRIORITY_LABELS[value as keyof typeof TASK_PRIORITY_LABELS]}
              </option>
            ))}
          </Select>
        </FormField>

        {formData.task_type === TASK_TYPES.RECURRING_SCHEDULED && (
          <FormField label="Zeitplan" htmlFor="schedule_human">
            <Input
              type="text"
              id="schedule_human"
              name="schedule_human"
              value={formData.schedule_human}
              onChange={handleChange}
              placeholder="z.B. Jeden Montag, Täglich um 9 Uhr"
            />
          </FormField>
        )}

        <div className="border-t border-subtle pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAdvancedOpen(o => !o)}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary h-auto px-0"
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-90')}
              aria-hidden="true"
            />
            Erweitert
            {!advancedOpen && hasAdvancedValues && (
              <span className="text-xs font-normal text-text-tertiary">(ausgefüllt)</span>
            )}
          </Button>

          {advancedOpen && (
            <div className="mt-4 space-y-6">
              {teamMembers.length > 0 && (
                <FormField label="Zuweisen an" htmlFor="assigned_to">
                  <Select id="assigned_to" name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                    <option value="">Nicht zugewiesen</option>
                    {teamMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name}{member.position ? ` (${member.position})` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}

              <FormField label="Anleitung" htmlFor="instructions">
                <Textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={5}
                  maxLength={5000}
                  placeholder="Schritt-für-Schritt Anleitung zur Erledigung..."
                />
              </FormField>

              <FormField label="Geschätzte Dauer (Minuten)" htmlFor="estimated_minutes">
                <Input
                  type="number"
                  id="estimated_minutes"
                  name="estimated_minutes"
                  value={formData.estimated_minutes}
                  onChange={handleChange}
                  min={1}
                  max={480}
                  placeholder="z.B. 30"
                />
              </FormField>

              <FormField label="Fälligkeitsdatum (optional)" htmlFor="due_date">
                <Input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                />
              </FormField>

              <FormField
                label="Tags"
                htmlFor="tags"
                hint="Mehrere Tags mit Komma trennen"
              >
                <Input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Komma-getrennt, z.B. küche, hygiene, täglich"
                />
              </FormField>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.title}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Speichern' : 'Aufgabe erstellen'}
          </Button>
        </div>
      </div>
    </form>
  )
}
