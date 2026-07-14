'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gauge, Plus, Pencil, Trash2, Check, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { metricProgress } from '@/lib/services/team-coordination'
import type { TeamMetricRow } from '@/lib/schemas/teams'

interface Props {
  teamId: string
  metrics: TeamMetricRow[]
}

interface Draft {
  label: string
  current_value: string
  target_value: string
  unit: string
  higher_is_better: boolean
}

const emptyDraft: Draft = { label: '', current_value: '', target_value: '', unit: '', higher_is_better: true }

const toDraft = (m: TeamMetricRow): Draft => ({
  label: m.label,
  current_value: m.current_value ?? '',
  target_value: m.target_value ?? '',
  unit: m.unit ?? '',
  higher_is_better: m.higher_is_better,
})

// Empty numeric field → null (a metric may set only one side).
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

const toBody = (d: Draft) => ({
  label: d.label.trim(),
  current_value: numOrNull(d.current_value),
  target_value: numOrNull(d.target_value),
  unit: d.unit.trim() || null,
  higher_is_better: d.higher_is_better,
})

// Reached target? Progress 100 means on/over target in the "good" direction.
const barColor = (pct: number | null) => {
  if (pct == null) return 'bg-neutral-300 dark:bg-neutral-600'
  if (pct >= 100) return 'bg-success-500'
  if (pct >= 60) return 'bg-info-500'
  return 'bg-warning-500'
}

const fmt = (v: string | null) => (v == null ? '—' : String(Number(v)))

/** Add/edit form — hoisted (not created during render) so it never remounts. */
function MetricDraftForm({
  draft, setDraft, onSave, onCancel, saving,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
      <Input
        value={draft.label}
        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        maxLength={120}
        autoFocus
        placeholder="Kennzahl (z.B. Reparaturen / Monat)"
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={draft.current_value}
          onChange={(e) => setDraft({ ...draft, current_value: e.target.value })}
          placeholder="Aktuell"
          className="flex-1"
        />
        <span className="text-text-tertiary text-sm">/</span>
        <Input
          type="number"
          value={draft.target_value}
          onChange={(e) => setDraft({ ...draft, target_value: e.target.value })}
          placeholder="Ziel"
          className="flex-1"
        />
        <Input
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          maxLength={20}
          placeholder="Einheit"
          className="w-24"
        />
      </div>
      <Select
        aria-label="Richtung"
        value={draft.higher_is_better ? 'higher' : 'lower'}
        onChange={(e) => setDraft({ ...draft, higher_is_better: e.target.value === 'higher' })}
      >
        <option value="higher">Höher = besser</option>
        <option value="lower">Tiefer = besser</option>
      </Select>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={!draft.label.trim() || saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Speichern
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="w-4 h-4" />
          Abbrechen
        </Button>
      </div>
    </div>
  )
}

/** Manual KPI cards for a team, with a progress bar toward target. */
export default function TeamMetricsSection({ teamId, metrics }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setBusy(key)
    setError(null)
    const res = await fn()
    setBusy(null)
    if (!res.success) {
      setError(res.error || 'Aktion fehlgeschlagen')
      return false
    }
    router.refresh()
    return true
  }

  async function create() {
    if (!draft.label.trim()) return
    const ok = await run('create', () =>
      apiFetch(`/api/admin/teams/${teamId}/metrics`, { method: 'POST', body: toBody(draft) }),
    )
    if (ok) { setAdding(false); setDraft(emptyDraft) }
  }

  async function saveEdit(id: string) {
    if (!draft.label.trim()) return
    const ok = await run(`edit-${id}`, () =>
      apiFetch(`/api/admin/teams/${teamId}/metrics/${id}`, { method: 'PATCH', body: toBody(draft) }),
    )
    if (ok) setEditingId(null)
  }

  const remove = (id: string) =>
    run(`del-${id}`, () => apiFetch(`/api/admin/teams/${teamId}/metrics/${id}`, { method: 'DELETE' }))

  return (
    <div className="bg-surface-base rounded-lg border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Gauge className="w-4 h-4 text-text-secondary" />
          Kennzahlen <span className="text-text-tertiary font-normal">({metrics.length})</span>
        </h2>
        {!adding && (
          <Button size="sm" variant="ghost" onClick={() => { setDraft(emptyDraft); setAdding(true) }}>
            <Plus className="w-3.5 h-3.5" />
            Kennzahl
          </Button>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-error-600 dark:text-error-400">{error}</p>}

      {metrics.length === 0 && !adding && (
        <p className="text-sm text-text-tertiary">Noch keine Kennzahlen erfasst.</p>
      )}

      <ul className="space-y-3">
        {metrics.map((m) => {
          const pct = metricProgress(m.current_value, m.target_value, m.higher_is_better)
          if (editingId === m.id) {
            return (
              <li key={m.id}>
                <MetricDraftForm draft={draft} setDraft={setDraft} onSave={() => saveEdit(m.id)} onCancel={() => setEditingId(null)} saving={busy === `edit-${m.id}`} />
              </li>
            )
          }
          return (
            <li key={m.id}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-text-primary flex items-center gap-1 min-w-0 flex-1 truncate">
                  {m.higher_is_better
                    ? <ArrowUp className="w-3 h-3 text-text-tertiary shrink-0" aria-label="Höher = besser" />
                    : <ArrowDown className="w-3 h-3 text-text-tertiary shrink-0" aria-label="Tiefer = besser" />}
                  {m.label}
                </span>
                <span className="text-sm font-semibold text-text-primary tabular-nums shrink-0">
                  {fmt(m.current_value)}
                  <span className="text-text-tertiary font-normal"> / {fmt(m.target_value)}{m.unit ? ` ${m.unit}` : ''}</span>
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setDraft(toDraft(m)); setEditingId(m.id) }} aria-label="Kennzahl bearbeiten">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive-ghost" onClick={() => remove(m.id)} disabled={busy === `del-${m.id}`} aria-label="Kennzahl löschen">
                    {busy === `del-${m.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
                <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct ?? 0}%` }} />
              </div>
            </li>
          )
        })}
      </ul>

      {adding && (
        <div className="mt-3">
          <MetricDraftForm draft={draft} setDraft={setDraft} onSave={create} onCancel={() => { setAdding(false); setDraft(emptyDraft) }} saving={busy === 'create'} />
        </div>
      )}
    </div>
  )
}
