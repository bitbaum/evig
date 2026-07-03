'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Ban, Pencil, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { apiFetch } from '@/lib/api/client'
import {
  TIMECARD_ENTRY_CATEGORY_OPTIONS,
  getTimecardEntryCategoryLabel,
  formatTimecardDuration,
} from '@/config/timecards'
import { formatTimecardPeriod } from '@/lib/team/timecard-display'
import { getDisplayDate } from '@/lib/team/timecard-utils'

interface ReviewEntry {
  id?: string
  work_date: string
  duration_minutes: number
  category: string
  description?: string | null
  start_time?: string | null
  end_time?: string | null
  break_minutes?: number | null
  source?: string | null
}
interface ReviewCard {
  id: string
  user_id: string
  user_name?: string | null
  user_email?: string | null
  period_type: string
  period_start: string
  period_end: string
  status: string
  entries: ReviewEntry[]
}

/**
 * Approver view of a single submitted timecard. Lets an approver SEE the day
 * entries before deciding, EDIT them (saved to the card's owner via the admin
 * PUT, status preserved), and approve / reject (reason optional). Reuses the
 * overlay focus SSOT (useFocusTrap).
 */
export function TimecardReviewDrawer({
  cardId,
  currentUserId,
  onClose,
  onChanged,
}: {
  cardId: string
  /** Reviewer's own user id — own cards are view-only (four-eyes principle). */
  currentUserId?: string
  onClose: () => void
  onChanged: () => void
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose)
  const [mounted, setMounted] = useState(false)
  const [card, setCard] = useState<ReviewCard | null>(null)
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal mount guard (SSR-safe)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let active = true
    apiFetch<ReviewCard>(`/api/admin/timecards/${cardId}`).then(r => {
      if (!active) return
      if (r.success && r.data) { setCard(r.data); setEntries(r.data.entries ?? []) }
      else setError(r.error || 'Zeitkarte konnte nicht geladen werden.')
    })
    return () => { active = false }
  }, [cardId])

  const total = entries.reduce((s, e) => s + (Number(e.duration_minutes) || 0), 0)
  const isApproved = card?.status === 'approved'
  // The server rejects self-review anyway (400) — surface that BEFORE the
  // click instead of after it.
  const isOwnCard = !!card && !!currentUserId && card.user_id === currentUserId

  const patchEntry = (i: number, patch: Partial<ReviewEntry>) =>
    setEntries(prev => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))

  const save = async () => {
    if (!card) return
    setBusy('save'); setError(null)
    const r = await apiFetch(`/api/admin/timecards/${cardId}`, {
      method: 'PUT',
      body: {
        period_type: card.period_type,
        period_start: card.period_start,
        period_end: card.period_end,
        entries,
      },
    })
    setBusy(null)
    if (!r.success) { setError(r.error || 'Speichern fehlgeschlagen.'); return }
    setEditing(false)
    onChanged()
  }

  const review = async (status: 'approved' | 'rejected') => {
    setBusy(status); setError(null)
    const r = await apiFetch(`/api/admin/timecards/${cardId}`, {
      method: 'PATCH',
      body: { status, review_notes: note.trim() || null },
    })
    setBusy(null)
    if (!r.success) { setError(r.error || 'Aktion fehlgeschlagen.'); return }
    onChanged()
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <Button
        variant="ghost"
        onClick={onClose}
        aria-label="Schliessen"
        className="absolute inset-0 h-full w-full rounded-none bg-black/40 p-0 backdrop-blur-xs hover:bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Zeitkarte prüfen"
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-subtle bg-surface-base"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {card?.user_name || card?.user_email || 'Zeitkarte'}
            </p>
            <p className="text-xs text-text-tertiary">
              {card
                ? `${formatTimecardPeriod(card.period_type, card.period_start, card.period_end)} · ${formatTimecardDuration(total)}`
                : 'Lädt…'}
              {isApproved && ' · genehmigt'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Schliessen">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="mb-3 text-sm text-error-600 dark:text-error-400">{error}</p>}
          {!card ? (
            <p className="text-sm text-text-tertiary">Lädt…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-text-tertiary">Keine Einträge.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-text-tertiary">
                  <th className="py-1 font-medium">Tag</th>
                  <th className="py-1 font-medium">Kategorie</th>
                  <th className="py-1 text-right font-medium">Std.</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={e.id ?? `${e.work_date}-${i}`} className="border-t border-subtle">
                    <td className="py-1.5 pr-2 font-mono tabular-nums text-text-secondary whitespace-nowrap">{getDisplayDate(e.work_date)}</td>
                    <td className="py-1.5 pr-2">
                      {editing ? (
                        <Select
                          value={e.category}
                          onChange={ev => patchEntry(i, { category: ev.target.value })}
                          className="w-full text-sm"
                        >
                          {TIMECARD_ENTRY_CATEGORY_OPTIONS.map(c => (
                            <option key={c} value={c}>{getTimecardEntryCategoryLabel(c)}</option>
                          ))}
                        </Select>
                      ) : (
                        getTimecardEntryCategoryLabel(e.category)
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {editing ? (
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="16"
                          value={(Number(e.duration_minutes) / 60).toString()}
                          onChange={ev =>
                            patchEntry(i, { duration_minutes: Math.round((parseFloat(ev.target.value) || 0) * 60) })
                          }
                          className="ml-auto w-20 text-right"
                        />
                      ) : (
                        formatTimecardDuration(Number(e.duration_minutes) || 0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 border-t border-subtle px-5 py-4">
          {isOwnCard && (
            <p className="text-sm text-warning-700 dark:text-warning-400">
              Eigene Zeitkarte — die Freigabe übernimmt ein anderes Teammitglied.
            </p>
          )}
          {!editing && !isOwnCard && (
            <Input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Notiz (optional) — bei Rückweisung erklärt sie, was anzupassen ist"
              maxLength={1000}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button variant="primary" size="sm" onClick={save} disabled={busy !== null} className="inline-flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Speichern
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEntries(card?.entries ?? []) }} disabled={busy !== null}>
                  Abbrechen
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => review('approved')}
                  disabled={busy !== null || isApproved || isOwnCard}
                  className="inline-flex items-center gap-1.5 bg-success-600 text-white hover:bg-success-700"
                >
                  <Check className="h-3.5 w-3.5" /> Genehmigen
                </Button>
                <Button variant="destructive-outline" size="sm" onClick={() => review('rejected')} disabled={busy !== null || isOwnCard} className="inline-flex items-center gap-1.5">
                  <Ban className="h-3.5 w-3.5" /> Zurückweisen
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={busy !== null || isApproved || isOwnCard} className="inline-flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
