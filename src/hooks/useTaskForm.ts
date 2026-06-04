'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TASK_PRIORITIES, TASK_TYPES, TASK_CATEGORIES } from '@/config/tasks'
import type { TaskEditItem } from '@/lib/schemas/tasks'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'

interface TeamMember {
  user_id: string
  name: string
  position: string | null
}

export interface TaskFormData {
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

export function useTaskForm(task?: TaskEditItem, prefill?: Partial<TaskFormData>) {
  const router = useRouter()
  const isEdit = !!task
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title ?? prefill?.title ?? '',
    description: task?.description ?? prefill?.description ?? '',
    instructions: task?.instructions ?? prefill?.instructions ?? '',
    task_type: task?.task_type ?? TASK_TYPES.RECURRING_AS_NEEDED,
    category: task?.category ?? TASK_CATEGORIES.OTHER,
    priority: task?.priority ?? prefill?.priority ?? TASK_PRIORITIES.NORMAL,
    schedule_human: task?.schedule_human ?? '',
    estimated_minutes: task?.estimated_minutes?.toString() ?? '',
    due_date: task?.due_date ?? '',
    tags: task?.tags?.join(', ') ?? '',
    assigned_to: task?.assigned_to ?? '',
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
    })
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setFormData(prev => {
      const updated = { ...prev }
      if (data.title) updated.title = String(data.title)
      if (data.description) updated.description = String(data.description)
      if (data.instructions) updated.instructions = String(data.instructions)
      if (data.category) updated.category = String(data.category)
      if (data.priority) updated.priority = String(data.priority)
      if (data.estimated_minutes !== undefined) updated.estimated_minutes = String(data.estimated_minutes)
      if (data.tags) {
        updated.tags = Array.isArray(data.tags)
          ? data.tags.map(String).join(', ')
          : String(data.tags)
      }
      return updated
    })
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
        estimated_minutes: formData.estimated_minutes ? parseInt(formData.estimated_minutes, 10) : null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (isEdit) {
        const result = await apiFetch<unknown>(`/api/tasks/${task.id}`, { method: 'PATCH', body: payload })
        if (!result.success) throw new Error(result.error || 'Fehler beim Speichern')
        router.push(`/admin/tasks/${task.id}`)
        router.refresh()
      } else {
        const result = await apiFetch<{ id: string }>('/api/tasks', { method: 'POST', body: payload })
        if (!result.success || !result.data) throw new Error(result.error || 'Fehler beim Erstellen')
        router.push(`/admin/tasks/${result.data.id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return {
    isEdit,
    loading,
    error,
    teamMembers,
    formData,
    handleChange,
    handleAIFieldsFilled,
    handleSubmit,
  }
}
