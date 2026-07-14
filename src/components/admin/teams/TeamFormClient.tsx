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
import { TEAM_ACCENT_OPTIONS } from '@/config/teams'
import type { TeamDetail } from '@/lib/schemas/teams'

/** Split a comma/newline list into a clean string[] (mail folders). */
function parseFolders(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const ACCENT_LABELS: Record<string, string> = {
  primary: 'Grün (primär)',
  secondary: 'Orange (sekundär)',
  info: 'Blau',
  warning: 'Gelb',
  success: 'Grün (Erfolg)',
  error: 'Rot',
  neutral: 'Neutral',
}

export default function TeamFormClient({ team }: { team?: TeamDetail }) {
  const router = useRouter()
  const isEdit = !!team
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: team?.name ?? '',
    purpose: team?.purpose ?? '',
    mail_folders: (team?.mail_folders ?? []).join('\n'),
    accent: team?.accent ?? 'info',
    meeting_cadence: team?.meeting_cadence ?? '',
    sort_order: String(team?.sort_order ?? 0),
    is_active: team?.is_active ?? true,
  })

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const body = {
      name: form.name,
      purpose: form.purpose || null,
      mail_folders: parseFolders(form.mail_folders),
      accent: form.accent,
      meeting_cadence: form.meeting_cadence || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }

    const res = isEdit
      ? await apiFetch<TeamDetail>(`/api/admin/teams/${team!.id}`, { method: 'PUT', body })
      : await apiFetch<TeamDetail>('/api/admin/teams', { method: 'POST', body })

    if (!res.success || !res.data) {
      setError(res.error || 'Speichern fehlgeschlagen')
      setLoading(false)
      return
    }
    router.push(ROUTES.admin.teamBySlug(res.data.slug))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {error && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="bg-surface-base rounded-lg border p-6 space-y-6">
        <FormField label="Name" required htmlFor="name">
          <Input
            id="name"
            value={form.name}
            onChange={set('name')}
            required
            maxLength={120}
            placeholder="z.B. Orga-Team"
          />
        </FormField>

        <FormField label="Zweck / Zuständigkeit" htmlFor="purpose">
          <Textarea
            id="purpose"
            value={form.purpose}
            onChange={set('purpose')}
            rows={2}
            maxLength={1000}
            placeholder="Wofür ist dieses Team zuständig?"
          />
        </FormField>

        <FormField
          label="Betreute Mailordner"
          htmlFor="mail_folders"
          hint="Ein Eintrag pro Zeile (oder mit Komma getrennt), z.B. finanz@revamp-it.ch"
        >
          <Textarea
            id="mail_folders"
            value={form.mail_folders}
            onChange={set('mail_folders')}
            rows={4}
            placeholder={'finanz@revamp-it.ch\nintern@revamp-it.ch'}
          />
        </FormField>

        <div className="grid sm:grid-cols-2 gap-6">
          <FormField label="Farbe" htmlFor="accent">
            <Select id="accent" value={form.accent} onChange={set('accent')}>
              {TEAM_ACCENT_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACCENT_LABELS[a] ?? a}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Reihenfolge" htmlFor="sort_order" hint="Kleiner = weiter oben">
            <Input id="sort_order" type="number" min={0} value={form.sort_order} onChange={set('sort_order')} />
          </FormField>
        </div>

        <FormField label="Sitzungsrhythmus" htmlFor="meeting_cadence" hint="Optional, z.B. wöchentlich">
          <Input
            id="meeting_cadence"
            value={form.meeting_cadence}
            onChange={set('meeting_cadence')}
            maxLength={120}
            placeholder="wöchentlich"
          />
        </FormField>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-neutral-300"
            />
            Team aktiv
          </label>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button type="submit" disabled={loading || !form.name.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Speichern' : 'Team anlegen'}
        </Button>
      </div>
    </form>
  )
}
