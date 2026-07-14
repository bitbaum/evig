'use client'

import { useState } from 'react'
import { Target, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import {
  GOAL_STATUS,
  GOAL_STATUS_OPTIONS,
  GOAL_STATUS_LABELS,
  getGoalStatusColor,
  type GoalStatus,
} from '@/config/teams'
import type { TeamGoalRow } from '@/lib/schemas/teams'

interface Props {
  teamId: string
  goals: TeamGoalRow[]
}

interface Draft {
  title: string
  detail: string
  status: string
  target_label: string
}

const emptyDraft: Draft = { title: '', detail: '', status: GOAL_STATUS.OPEN, target_label: '' }

const toDraft = (g: TeamGoalRow): Draft => ({
  title: g.title,
  detail: g.detail ?? '',
  status: g.status,
  target_label: g.target_label ?? '',
})

const toBody = (d: Draft) => ({
  title: d.title.trim(),
  detail: d.detail.trim() || null,
  status: d.status,
  target_label: d.target_label.trim() || null,
})

/** Add/edit form — hoisted (not created during render) so it never remounts. */
function GoalDraftForm({
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
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        maxLength={200}
        autoFocus
        placeholder="Ziel (z.B. Werkstatt-Durchsatz erhöhen)"
      />
      <Input
        value={draft.detail}
        onChange={(e) => setDraft({ ...draft, detail: e.target.value })}
        maxLength={1000}
        placeholder="Detail (optional)"
      />
      <div className="flex items-center gap-2">
        <Select
          aria-label="Status"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          className="flex-1"
        >
          {GOAL_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{GOAL_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Input
          value={draft.target_label}
          onChange={(e) => setDraft({ ...draft, target_label: e.target.value })}
          maxLength={40}
          placeholder="Horizont (z.B. Q3)"
          className="flex-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={!draft.title.trim() || saving}>
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

/** Structured goal list for a team — a mini-roadmap, editable by any staff. */
export default function TeamGoalsSection({ teamId, goals }: Props) {
  const { busy, error, run } = useAsyncAction()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  async function create() {
    if (!draft.title.trim()) return
    const ok = await run('create', () =>
      apiFetch(`/api/admin/teams/${teamId}/goals`, { method: 'POST', body: toBody(draft) }),
    )
    if (ok) { setAdding(false); setDraft(emptyDraft) }
  }

  async function saveEdit(goalId: string) {
    if (!draft.title.trim()) return
    const ok = await run(`edit-${goalId}`, () =>
      apiFetch(`/api/admin/teams/${teamId}/goals/${goalId}`, { method: 'PATCH', body: toBody(draft) }),
    )
    if (ok) setEditingId(null)
  }

  const remove = (goalId: string) =>
    run(`del-${goalId}`, () => apiFetch(`/api/admin/teams/${teamId}/goals/${goalId}`, { method: 'DELETE' }))

  return (
    <div className="bg-surface-base rounded-lg border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Target className="w-4 h-4 text-text-secondary" />
          Ziele <span className="text-text-tertiary font-normal">({goals.length})</span>
        </h2>
        {!adding && (
          <Button size="sm" variant="ghost" onClick={() => { setDraft(emptyDraft); setAdding(true) }}>
            <Plus className="w-3.5 h-3.5" />
            Ziel
          </Button>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-error-600 dark:text-error-400">{error}</p>}

      {goals.length === 0 && !adding && (
        <p className="text-sm text-text-tertiary">Noch keine Ziele definiert.</p>
      )}

      <ul className="space-y-2">
        {goals.map((g) => (
          <li key={g.id}>
            {editingId === g.id ? (
              <GoalDraftForm draft={draft} setDraft={setDraft} onSave={() => saveEdit(g.id)} onCancel={() => setEditingId(null)} saving={busy === `edit-${g.id}`} />
            ) : (
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium ${getGoalStatusColor(g.status)}`}>
                  {GOAL_STATUS_LABELS[g.status as GoalStatus] ?? g.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm text-text-primary ${g.status === GOAL_STATUS.DONE ? 'line-through text-text-tertiary' : ''}`}>
                    {g.title}
                    {g.target_label && (
                      <span className="ml-2 text-xs text-text-tertiary">· {g.target_label}</span>
                    )}
                  </p>
                  {g.detail && <p className="text-xs text-text-secondary mt-0.5">{g.detail}</p>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => { setDraft(toDraft(g)); setEditingId(g.id) }} aria-label="Ziel bearbeiten">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive-ghost" onClick={() => remove(g.id)} disabled={busy === `del-${g.id}`} aria-label="Ziel löschen">
                    {busy === `del-${g.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <div className="mt-2">
          <GoalDraftForm draft={draft} setDraft={setDraft} onSave={create} onCancel={() => { setAdding(false); setDraft(emptyDraft) }} saving={busy === 'create'} />
        </div>
      )}
    </div>
  )
}
