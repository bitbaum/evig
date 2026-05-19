'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, Save, Loader2 } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/config/tasks'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

export default function NewTaskProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: PROJECT_STATUSES.PLANNING,
    target_date: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/task-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          status: form.status,
          target_date: form.target_date || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fehler beim Erstellen')
      router.push(ROUTES.admin.taskProjects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageWrapper
      title="Neues Projekt"
      description="Aufgaben in einem Projekt gruppieren"
      icon={FolderKanban}
      iconColor="blue"
      backButton={{ href: ROUTES.admin.taskProjects, label: 'Projekte' }}
    >
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className={cn(designPrimitive.surface.card, 'p-6 space-y-5')}>
          {error && (
            <div className="rounded-md bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 px-4 py-3 text-sm text-error-800 dark:text-error-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className={designPrimitive.form.label}>
              Titel *
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="z.B. Shop-Redesign Q3"
              className={designPrimitive.form.input}
            />
          </div>

          <div>
            <label htmlFor="description" className={designPrimitive.form.label}>
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Kurze Beschreibung des Projekts (optional)"
              className={designPrimitive.form.textarea}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className={designPrimitive.form.label}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={designPrimitive.form.select}
              >
                {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target_date" className={designPrimitive.form.label}>
                Zieldatum
              </label>
              <input
                id="target_date"
                name="target_date"
                type="date"
                value={form.target_date}
                onChange={handleChange}
                className={designPrimitive.form.input}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={ROUTES.admin.taskProjects}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.default,
                designPrimitive.button.outline
              )}
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className={cn(
                designPrimitive.buttonBase,
                designPrimitive.buttonSize.default,
                designPrimitive.button.primary
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Projekt erstellen
            </button>
          </div>
        </form>
      </div>
    </AdminPageWrapper>
  )
}
