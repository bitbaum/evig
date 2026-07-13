'use client'

import { useState } from 'react'
import {
  ExternalLink, Link2, Copy, Check, Bot, Loader2, Send, MessageSquare,
} from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import DeliverableFiles from '@/components/deliverables/DeliverableFiles'
import DeliverableChat from '@/components/deliverables/DeliverableChat'
import { formatDateTimeNumeric } from '@/lib/date-formats'
import type { DeliverableDetail, FeedbackItem } from '@/lib/schemas/deliverables'
import {
  DELIVERABLE_TYPE_LABELS,
  DELIVERABLE_STATUSES,
  DELIVERABLE_STATUS_LABELS,
  FEEDBACK_KINDS,
  FEEDBACK_KIND_LABELS,
  FEEDBACK_KIND_COLORS,
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_COLORS,
  type DeliverableType,
  type FeedbackKind,
  type FeedbackStatus,
} from '@/config/deliverables'

interface Props {
  deliverable: DeliverableDetail
  initialFeedback: FeedbackItem[]
}

export default function DeliverableReviewClient({ deliverable, initialFeedback }: Props) {
  const [status, setStatus] = useState<string>(deliverable.status)
  const [shareToken, setShareToken] = useState<string | null>(deliverable.share_token)
  const [feedback, setFeedback] = useState<FeedbackItem[]>(initialFeedback)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Feedback form
  const [kind, setKind] = useState<string>(FEEDBACK_KINDS.COMMENT)
  const [target, setTarget] = useState('')
  const [body, setBody] = useState('')

  const shareUrl = shareToken && typeof window !== 'undefined'
    ? `${window.location.origin}/d/${shareToken}`
    : null

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  async function changeStatus(next: string) {
    setStatus(next)
    setBusy('status')
    await apiFetch(`/api/deliverables/${deliverable.id}`, {
      method: 'PATCH',
      body: { status: next },
    })
    setBusy(null)
  }

  async function createShareLink() {
    setBusy('share')
    const res = await apiFetch<{ share_token: string }>(`/api/deliverables/${deliverable.id}/share`, {
      method: 'POST',
    })
    if (res.success && res.data) setShareToken(res.data.share_token)
    setBusy(null)
  }

  async function copyAgentBrief() {
    setBusy('brief')
    const res = await apiFetch<{ prompt: string }>(`/api/deliverables/${deliverable.id}/agent-brief`)
    if (res.success && res.data) await copy(res.data.prompt, 'brief')
    setBusy(null)
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy('feedback')
    const res = await apiFetch<FeedbackItem>(`/api/deliverables/${deliverable.id}/feedback`, {
      method: 'POST',
      body: { kind, body, target: target || null },
    })
    if (res.success && res.data) {
      setFeedback((prev) => [res.data as FeedbackItem, ...prev])
      setBody('')
      setTarget('')
      setKind(FEEDBACK_KINDS.COMMENT)
    }
    setBusy(null)
  }

  async function resolve(feedbackId: string, next: string) {
    setBusy(feedbackId)
    const res = await apiFetch(`/api/deliverables/${deliverable.id}/feedback`, {
      method: 'PATCH',
      body: { feedback_id: feedbackId, status: next },
    })
    if (res.success) {
      setFeedback((prev) => prev.map((f) => (f.id === feedbackId ? { ...f, status: next as FeedbackStatus } : f)))
    }
    setBusy(null)
  }

  const isInternalPreview = deliverable.url?.startsWith('/')

  return (
    <div className="grid lg:grid-cols-3 gap-6 items-start">
      {/* Left: meta + preview + feedback */}
      <div className="lg:col-span-2 space-y-6">
        {deliverable.description && (
          <div className="bg-surface-base rounded-lg border p-5">
            <p className="text-text-primary whitespace-pre-wrap">{deliverable.description}</p>
          </div>
        )}

        {deliverable.url && (
          <div className="bg-surface-base rounded-lg border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <span className="text-sm font-medium text-text-secondary">Vorschau</span>
              <a
                href={deliverable.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-action hover:underline"
              >
                In neuem Tab öffnen <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {isInternalPreview && (
              <iframe
                src={deliverable.url}
                title={deliverable.title}
                className="w-full h-[520px] bg-surface-base"
              />
            )}
          </div>
        )}

        <DeliverableFiles files={deliverable.files} />

        <DeliverableChat
          endpoint={`/api/deliverables/${deliverable.id}/ask`}
          suggestions={['Was macht dieser Code?', 'Wie binde ich das ein?', 'Was gehört zu diesem Liefergegenstand?']}
        />

        {/* Feedback thread */}
        <div className="bg-surface-base rounded-lg border p-5">
          <h2 className="flex items-center gap-2 font-semibold text-text-primary mb-4">
            <MessageSquare className="w-4 h-4" />
            Feedback ({feedback.length})
          </h2>

          <form onSubmit={submitFeedback} className="space-y-3 mb-6">
            <div className="grid sm:grid-cols-2 gap-3">
              <FormField label="Art" htmlFor="fb-kind">
                <Select id="fb-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                  {Object.values(FEEDBACK_KINDS).map((k) => (
                    <option key={k} value={k}>{FEEDBACK_KIND_LABELS[k]}</option>
                  ))}
                </Select>
              </FormField>
              {kind === FEEDBACK_KINDS.CHANGE_REQUEST && (
                <FormField label="Betrifft (optional)" htmlFor="fb-target">
                  <Input
                    id="fb-target"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    maxLength={200}
                    placeholder="z.B. Positions-Tabelle"
                  />
                </FormField>
              )}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Dein Feedback…"
            />
            <Button type="submit" size="sm" disabled={busy === 'feedback' || !body.trim()}>
              {busy === 'feedback' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Feedback senden
            </Button>
          </form>

          {feedback.length === 0 ? (
            <p className="text-sm text-text-secondary">Noch kein Feedback.</p>
          ) : (
            <ul className="space-y-4">
              {feedback.map((f) => (
                <li key={f.id} className="border-l-2 border-neutral-200 pl-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FEEDBACK_KIND_COLORS[f.kind as FeedbackKind] ?? ''}`}>
                      {FEEDBACK_KIND_LABELS[f.kind as FeedbackKind] ?? f.kind}
                    </span>
                    {f.kind === FEEDBACK_KINDS.CHANGE_REQUEST && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FEEDBACK_STATUS_COLORS[f.status as FeedbackStatus] ?? ''}`}>
                        {FEEDBACK_STATUS_LABELS[f.status as FeedbackStatus] ?? f.status}
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {f.author_name ?? 'Extern'} · {formatDateTimeNumeric(f.created_at)}
                    </span>
                  </div>
                  {f.target && <p className="text-xs text-text-secondary mb-0.5">Betrifft: {f.target}</p>}
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{f.body}</p>
                  {f.kind === FEEDBACK_KINDS.CHANGE_REQUEST && f.status === FEEDBACK_STATUSES.OPEN && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy === f.id}
                        onClick={() => resolve(f.id, FEEDBACK_STATUSES.ADDRESSED)}
                      >
                        Erledigt
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy === f.id}
                        onClick={() => resolve(f.id, FEEDBACK_STATUSES.WONTFIX)}
                      >
                        Verworfen
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right: controls */}
      <div className="space-y-4">
        <div className="bg-surface-base rounded-lg border p-5 space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
            <Select id="status" value={status} onChange={(e) => changeStatus(e.target.value)} disabled={busy === 'status'}>
              {Object.values(DELIVERABLE_STATUSES).map((s) => (
                <option key={s} value={s}>{DELIVERABLE_STATUS_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">Typ</dt>
              <dd className="text-text-primary text-right">{DELIVERABLE_TYPE_LABELS[deliverable.type as DeliverableType] ?? deliverable.type}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">Version</dt>
              <dd className="text-text-primary text-right">v{deliverable.current_version}</dd>
            </div>
            {deliverable.source_path && (
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Quelle</dt>
                <dd className="text-text-primary text-right break-all">{deliverable.source_path}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Share link */}
        <div className="bg-surface-base rounded-lg border p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Link2 className="w-4 h-4" />
            Freigabe-Link (ohne Login)
          </h3>
          {shareUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 min-w-0 text-xs bg-surface-raised border rounded-md px-2 py-1.5 text-text-secondary"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => copy(shareUrl, 'share')}>
                {copied === 'share' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={createShareLink} disabled={busy === 'share'}>
              {busy === 'share' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Freigabe-Link erstellen
            </Button>
          )}
          <p className="text-xs text-text-secondary">
            Zum Teilen mit Externen: Lesen + Kommentieren, kein Login. Feedback landet direkt hier.
          </p>
        </div>

        {/* Agent brief */}
        <div className="bg-surface-base rounded-lg border p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Bot className="w-4 h-4" />
            Überarbeitung durch Agent
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={copyAgentBrief} disabled={busy === 'brief'}>
            {busy === 'brief' ? <Loader2 className="w-4 h-4 animate-spin" /> : copied === 'brief' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'brief' ? 'Kopiert' : 'Agent-Briefing kopieren'}
          </Button>
          <p className="text-xs text-text-secondary">
            Fasst die offenen Änderungswünsche + den Quell-Ordner zu einem fertigen Prompt zusammen — in Claude Code einfügen, überarbeiten lassen.
          </p>
        </div>
      </div>
    </div>
  )
}
