'use client'

/**
 * TeamLeavePeriodsCard — list + add UI for a team profile's leave periods.
 *
 * Rendered inside the profile detail page (Phase 4.5). Replaces the
 * audit's "availability is a free-text field, no calendar, no roster
 * filtering" gap. Each row is a kind chip + date range + notes; HR
 * can add a new period via the inline form (a popover would feel
 * heavier here — the form is small enough to live inline) and remove
 * existing ones with one click.
 *
 * Date-range UX: two side-by-side date inputs. We considered a single
 * combined picker but native <input type=date> coverage on mobile is
 * the path of least friction, and HR almost never enters arbitrary
 * date ranges from a phone — desktop is the realistic target.
 */

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, X, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateShort } from '@/lib/date-formats'
import { leavePeriodKindOptions, type LeavePeriodKind } from '@/lib/schemas/team'
import {
  LEAVE_PERIOD_KIND_LABELS,
  LEAVE_PERIOD_KIND_COLORS,
  getLeavePeriodKindLabel,
  getLeavePeriodKindColor,
} from '@/config/team'

interface LeaveRow {
  id: string
  starts_on: string
  ends_on: string
  kind: string
  notes: string | null
}

interface Props {
  profileId: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function isActiveToday(row: LeaveRow): boolean {
  const today = todayISO()
  return row.starts_on <= today && row.ends_on >= today
}

function isPast(row: LeaveRow): boolean {
  return row.ends_on < todayISO()
}

export function TeamLeavePeriodsCard({ profileId }: Props) {
  const [rows, setRows] = useState<LeaveRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formStartsOn, setFormStartsOn] = useState('')
  const [formEndsOn, setFormEndsOn] = useState('')
  const [formKind, setFormKind] = useState<LeavePeriodKind>('vacation')
  const [formNotes, setFormNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await apiFetch<{ items: LeaveRow[] }>(
      `/api/admin/team/profiles/${profileId}/leave`,
    )
    if (result.success && result.data) {
      setRows(result.data.items)
    } else {
      setError(result.error || 'Urlaubsdaten konnten nicht geladen werden.')
    }
    setIsLoading(false)
  }, [profileId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const resetForm = () => {
    setFormStartsOn('')
    setFormEndsOn('')
    setFormKind('vacation')
    setFormNotes('')
    setShowForm(false)
  }

  const submit = async () => {
    if (!formStartsOn || !formEndsOn) {
      setError('Start- und Enddatum sind erforderlich.')
      return
    }
    if (formEndsOn < formStartsOn) {
      setError('Enddatum darf nicht vor dem Startdatum liegen.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await apiFetch(`/api/admin/team/profiles/${profileId}/leave`, {
      method: 'POST',
      body: {
        starts_on: formStartsOn,
        ends_on: formEndsOn,
        kind: formKind,
        notes: formNotes.trim() || null,
      },
    })
    setSubmitting(false)
    if (!result.success) {
      setError(result.error || 'Urlaub konnte nicht erfasst werden.')
      return
    }
    resetForm()
    await load()
  }

  const remove = async (id: string) => {
    setError(null)
    const result = await apiFetch(`/api/admin/team/leave/${id}`, { method: 'DELETE' })
    if (!result.success) {
      setError(result.error || 'Eintrag konnte nicht gelöscht werden.')
      return
    }
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="rounded-xl border border bg-surface-base overflow-hidden">
      <div className="px-5 py-3.5 border-b border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-tertiary" />
          <h2 className="text-sm font-semibold text-text-primary">Urlaub & Abwesenheit</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            disabled={isLoading}
            className="w-11 h-11 text-text-tertiary hover:text-text-primary hover:bg-surface-raised dark:hover:bg-surface-base/4"
            aria-label="Aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {!showForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3 min-h-11 text-xs font-semibold h-auto"
            >
              <Plus className="w-4 h-4" />
              Urlaub erfassen
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-5 py-2.5 bg-error-50 dark:bg-error-500/10 border-b border-error-200 dark:border-error-500/30 text-sm text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="px-5 py-4 border-b border bg-surface-raised">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-text-secondary mb-1 block">Von</span>
              <Input type="date" value={formStartsOn} onChange={e => setFormStartsOn(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-secondary mb-1 block">Bis</span>
              <Input type="date" value={formEndsOn} onChange={e => setFormEndsOn(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-secondary mb-1 block">Art</span>
              <Select value={formKind} onChange={e => setFormKind(e.target.value as LeavePeriodKind)}>
                {leavePeriodKindOptions.map(k => (
                  <option key={k} value={k}>{LEAVE_PERIOD_KIND_LABELS[k]}</option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block mt-3">
            <span className="text-xs font-medium text-text-secondary mb-1 block">Notiz (optional)</span>
            <Textarea
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="z. B. Sommerurlaub gemeinsam mit Andreas"
              rows={2}
              maxLength={1000}
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              disabled={submitting}
              className="inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Abbrechen
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Speichern
            </Button>
          </div>
        </div>
      )}

      {rows.length === 0 && !isLoading && !showForm ? (
        <div className="px-5 py-6 text-center text-sm text-text-tertiary">
          Keine Urlaubs- oder Abwesenheitsdaten erfasst.
        </div>
      ) : (
        <ul className="divide-y divide-subtle">
          {rows.map(row => {
            const kind = row.kind as LeavePeriodKind
            const active = isActiveToday(row)
            const past = isPast(row)
            return (
              <li
                key={row.id}
                className={`px-5 py-3 ${active ? 'bg-action-muted/40/5' : ''} ${past ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getLeavePeriodKindColor(kind)}`}>
                        {getLeavePeriodKindLabel(kind)}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {formatDateShort(row.starts_on)} – {formatDateShort(row.ends_on)}
                      </span>
                      {active && (
                        <span className="text-[10px] font-semibold text-action uppercase tracking-wide">
                          aktuell
                        </span>
                      )}
                    </div>
                    {row.notes && (
                      <p className="mt-1 text-xs text-text-secondary">{row.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive-ghost"
                    size="icon"
                    onClick={() => remove(row.id)}
                    className="w-11 h-11 text-text-muted hover:text-error-600 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
                    aria-label="Eintrag löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
