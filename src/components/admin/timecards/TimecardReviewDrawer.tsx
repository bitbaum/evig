'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { X, Check, Ban, Pencil, Save, RotateCcw, Send, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { apiFetch } from '@/lib/api/client'
import { TIMECARD_ENTRY_CATEGORY_OPTIONS } from '@/config/timecards'
import { useTimecardIntl } from '@/hooks/useTimecardIntl'
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
 * Approver view of a single timecard. Lets an approver SEE the day entries
 * before deciding, EDIT them (saved to the card's owner via the admin PUT,
 * status preserved), and approve / reject (reason optional). Approved cards
 * stay editable — a payroll-locked card is the real edit boundary (server
 * enforced) — and can be reopened back to draft. Reuses the overlay focus
 * SSOT (useFocusTrap).
 */
export function TimecardReviewDrawer({
  cardId,
  currentUserId,
  allowSelfReview = false,
  onClose,
  onChanged,
}: {
  cardId: string
  /** Reviewer's own user id — own cards are view-only (four-eyes principle). */
  currentUserId?: string
  /** Super-admins may review their own card (they're often the sole approver). */
  allowSelfReview?: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const t = useTranslations('admin.timecards')
  const { statusLabel, categoryLabel, duration, period } = useTimecardIntl()
  const panelRef = useFocusTrap<HTMLDivElement>(true, onClose)
  const [mounted, setMounted] = useState(false)
  const [card, setCard] = useState<ReviewCard | null>(null)
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Positive acknowledgement after an action — the drawer stays open showing
  // this + the next step (the report), so the approver never has to hunt for
  // the card they just acted on.
  const [flash, setFlash] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal mount guard (SSR-safe)
  useEffect(() => { setMounted(true) }, [])

  const load = useCallback(async () => {
    const r = await apiFetch<ReviewCard>(`/api/admin/timecards/${cardId}`)
    if (r.success && r.data) { setCard(r.data); setEntries(r.data.entries ?? []) }
    else setError(r.error || t('draftLoadError'))
  }, [cardId, t])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch → setState resolves off-render
  useEffect(() => { void load() }, [load])

  const total = entries.reduce((s, e) => s + (Number(e.duration_minutes) || 0), 0)
  const isApproved = card?.status === 'approved'
  const isDraft = card?.status === 'draft' || card?.status === 'rejected'
  // The server rejects self-review anyway (400) — surface that BEFORE the
  // click instead of after it.
  const isOwnCard = !!card && !!currentUserId && card.user_id === currentUserId && !allowSelfReview

  const patchEntry = (i: number, patch: Partial<ReviewEntry>) =>
    setEntries(prev => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))

  const save = async () => {
    if (!card) return
    setBusy('save'); setError(null); setFlash(null)
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
    if (!r.success) { setError(r.error || t('saveFailed')); return }
    setEditing(false)
    await load()
    setFlash(t('reviewDoneSaved'))
    onChanged()
  }

  const review = async (status: 'approved' | 'rejected') => {
    setBusy(status); setError(null); setFlash(null)
    const r = await apiFetch(`/api/admin/timecards/${cardId}`, {
      method: 'PATCH',
      body: { status, review_notes: note.trim() || null },
    })
    setBusy(null)
    if (!r.success) { setError(r.error || t('actionFailed')); return }
    setNote('')
    await load()
    setFlash(status === 'approved' ? t('reviewDoneApproved') : t('reviewDoneRejected'))
    onChanged()
  }

  // Proxy path: submit a draft on the owner's behalf (audited, owner notified).
  const submitOnBehalf = async () => {
    setBusy('submit'); setError(null); setFlash(null)
    const r = await apiFetch(`/api/admin/timecards/${cardId}/submit`, { method: 'POST' })
    setBusy(null)
    if (!r.success) { setError(r.error || t('actionFailed')); return }
    await load()
    setFlash(t('reviewDoneSubmitted'))
    onChanged()
  }

  // Un-approve: back to draft so the owner (or approver) can rework it.
  const reopen = async () => {
    setBusy('reopen'); setError(null); setFlash(null)
    const r = await apiFetch(`/api/admin/timecards/${cardId}/reopen`, { method: 'POST' })
    setBusy(null)
    if (!r.success) { setError(r.error || t('actionFailed')); return }
    await load()
    setFlash(t('reviewDoneReopened'))
    onChanged()
  }

  // Monatsrapport for this card's owner + month (the sheet the approver sends
  // to the social worker) — the concrete next step after approving.
  const reportHref = card ? `/admin/team/report/${card.user_id}/${card.period_start.slice(0, 7)}` : null

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <Button
        variant="ghost"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute inset-0 h-full w-full rounded-none bg-black/40 p-0 backdrop-blur-xs hover:bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('drawerAria')}
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-subtle bg-surface-base"
      >
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {card?.user_name || card?.user_email || t('drawerFallbackTitle')}
            </p>
            <p className="text-xs text-text-tertiary">
              {card
                ? `${period(card.period_type, card.period_start, card.period_end)} · ${duration(total)}`
                : t('loading')}
              {isApproved && ` · ${statusLabel('approved')}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('close')}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="mb-3 text-sm text-error-600 dark:text-error-400">{error}</p>}
          {flash && (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-success-600/30 bg-success-600/10 px-3 py-2 text-sm text-success-700 dark:text-success-400">
              <span className="inline-flex items-center gap-1.5 font-medium"><Check className="h-4 w-4" /> {flash}</span>
              {isApproved && reportHref && (
                <Link href={reportHref} target="_blank" className="inline-flex items-center gap-1 font-medium text-action hover:underline">
                  <FileText className="h-3.5 w-3.5" /> {t('openReport')}
                </Link>
              )}
            </div>
          )}
          {!card ? (
            <p className="text-sm text-text-tertiary">{t('loading')}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t('drawerNoEntries')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-text-tertiary">
                  <th className="py-1 font-medium">{t('colDay')}</th>
                  <th className="py-1 font-medium">{t('fieldCategory')}</th>
                  <th className="py-1 text-right font-medium">{t('colHours')}</th>
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
                            <option key={c} value={c}>{categoryLabel(c)}</option>
                          ))}
                        </Select>
                      ) : (
                        categoryLabel(e.category)
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
                        duration(Number(e.duration_minutes) || 0)
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
              {t('drawerOwnNotice')}
            </p>
          )}
          {!editing && !isOwnCard && !isApproved && (
            <Input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('drawerNotePlaceholder')}
              maxLength={1000}
            />
          )}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <Button variant="primary" size="sm" onClick={save} disabled={busy !== null} className="inline-flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" /> {t('save')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEntries(card?.entries ?? []) }} disabled={busy !== null}>
                  {t('cancel')}
                </Button>
              </>
            ) : (
              <>
                {isDraft ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={submitOnBehalf}
                    disabled={busy !== null || entries.length === 0}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> {t('submit')}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => review('approved')}
                    disabled={busy !== null || isApproved || isOwnCard}
                    className="inline-flex items-center gap-1.5 bg-success-600 text-white hover:bg-success-700"
                  >
                    <Check className="h-3.5 w-3.5" /> {t('approve')}
                  </Button>
                )}
                {!isApproved && !isDraft && (
                  <Button variant="destructive-outline" size="sm" onClick={() => review('rejected')} disabled={busy !== null || isOwnCard} className="inline-flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5" /> {t('reject')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={busy !== null || isOwnCard} className="inline-flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> {t('edit')}
                </Button>
                {isApproved && (
                  <Button variant="outline" size="sm" onClick={reopen} disabled={busy !== null} className="inline-flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> {t('reopen')}
                  </Button>
                )}
              </>
            )}
          </div>
          {!editing && reportHref && (
            <Link
              href={reportHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> {t('openReport')}
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
