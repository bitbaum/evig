'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { ROUTES } from '@/config/routes'
import {
  DELIVERABLE_TYPES,
  DELIVERABLE_TYPE_LABELS,
  DELIVERABLE_STATUSES,
  DELIVERABLE_STATUS_LABELS,
  DELIVERABLE_VISIBILITY,
  DELIVERABLE_VISIBILITY_LABELS,
} from '@/config/deliverables'

export default function DeliverableFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    type: DELIVERABLE_TYPES.DOCUMENT as string,
    description: '',
    url: '',
    source_path: '',
    visibility: DELIVERABLE_VISIBILITY.TEAM as string,
    status: DELIVERABLE_STATUSES.DRAFT as string,
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await apiFetch<{ id: string }>('/api/deliverables', {
      method: 'POST',
      body: {
        title: form.title,
        type: form.type,
        description: form.description || null,
        url: form.url || null,
        source_path: form.source_path || null,
        visibility: form.visibility,
        status: form.status,
      },
    })

    if (!res.success || !res.data) {
      setError(res.error || 'Fehler beim Erstellen')
      setLoading(false)
      return
    }

    router.push(ROUTES.admin.deliverable(res.data.id))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="bg-surface-base rounded-lg border p-6 space-y-6">
        <FormField label="Titel" required htmlFor="title">
          <Input
            id="title"
            name="title"
            value={form.title}
            onChange={set('title')}
            required
            maxLength={200}
            placeholder="z.B. Kivitendo Auftragserfassung — schöneres UI"
          />
        </FormField>

        <FormField label="Typ" required htmlFor="type">
          <Select id="type" name="type" value={form.type} onChange={set('type')}>
            {Object.values(DELIVERABLE_TYPES).map((value) => (
              <option key={value} value={value}>
                {DELIVERABLE_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Beschreibung" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={set('description')}
            rows={3}
            maxLength={2000}
            placeholder="Was ist das, für wen, wie anzuwenden?"
          />
        </FormField>

        <FormField
          label="Link / Vorschau-URL"
          htmlFor="url"
          hint="Was beim Öffnen angezeigt wird: z.B. /presentations/kivitendo-intake, eine Datei-URL oder ein externer Link."
        >
          <Input
            id="url"
            name="url"
            value={form.url}
            onChange={set('url')}
            maxLength={1000}
            placeholder="/presentations/…"
          />
        </FormField>

        <FormField
          label="Quell-Ordner (Git)"
          htmlFor="source_path"
          hint="Der bearbeitbare deliverables/<slug>/-Ordner. Wird fürs Agent-Briefing genutzt."
        >
          <Input
            id="source_path"
            name="source_path"
            value={form.source_path}
            onChange={set('source_path')}
            maxLength={500}
            placeholder="deliverables/2026-07-13-…/"
          />
        </FormField>

        <div className="grid sm:grid-cols-2 gap-6">
          <FormField label="Sichtbarkeit" htmlFor="visibility">
            <Select id="visibility" name="visibility" value={form.visibility} onChange={set('visibility')}>
              {Object.values(DELIVERABLE_VISIBILITY).map((value) => (
                <option key={value} value={value}>
                  {DELIVERABLE_VISIBILITY_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Status" htmlFor="status">
            <Select id="status" name="status" value={form.status} onChange={set('status')}>
              {Object.values(DELIVERABLE_STATUSES).map((value) => (
                <option key={value} value={value}>
                  {DELIVERABLE_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={loading || !form.title.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Erstellen
        </Button>
      </div>
    </form>
  )
}
