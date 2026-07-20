'use client'

/**
 * "Freigabe-Link" card on the Monatsrapport — mints an unguessable public link
 * an approver hands to the referring social worker (who can't log in, and whom
 * the app can't reliably email). Mirrors the deliverables share card. German
 * chrome to match the rest of this (official-document) page.
 */

import { useState } from 'react'
import { Link2, Copy, Check, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api/client'

export function ReportShareCard({
  userId,
  month,
  initialToken,
}: {
  userId: string
  month: string
  initialToken: string | null
}) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const base = `/api/team/report/${userId}/${month}/share`
  const url = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${token}` : ''

  const create = async () => {
    setBusy(true); setError(null)
    const r = await apiFetch<{ token: string }>(base, { method: 'POST' })
    setBusy(false)
    if (r.success && r.data) setToken(r.data.token)
    else setError(r.error || 'Konnte keinen Link erstellen.')
  }

  const revoke = async () => {
    setBusy(true); setError(null)
    const r = await apiFetch(base, { method: 'DELETE' })
    setBusy(false)
    if (r.success) { setToken(null); setCopied(false) }
    else setError(r.error || 'Konnte den Link nicht deaktivieren.')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Kopieren fehlgeschlagen — Link manuell markieren.')
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-surface-raised p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
        <Link2 className="h-4 w-4" aria-hidden="true" /> Freigabe-Link für Begleitung / Sozialarbeit
      </p>
      <p className="mt-0.5 text-xs text-text-tertiary">
        Öffnet den Rapport ohne Login — zum Weitergeben an die Begleitperson. Jederzeit deaktivierbar.
      </p>

      {token ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input readOnly value={url} onFocus={e => e.currentTarget.select()} className="min-w-0 flex-1 font-mono text-xs" />
            <Button type="button" variant="primary" size="sm" onClick={copy} className="inline-flex items-center gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Kopiert!' : 'Kopieren'}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={revoke} disabled={busy} className="inline-flex items-center gap-1.5 px-0 text-text-tertiary hover:text-error-600">
            <XCircle className="h-3.5 w-3.5" /> Link deaktivieren
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={create} disabled={busy} className="mt-3 inline-flex items-center gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          Freigabe-Link erstellen
        </Button>
      )}

      {error && <p className="mt-2 text-xs text-error-600 dark:text-error-400">{error}</p>}
    </div>
  )
}
