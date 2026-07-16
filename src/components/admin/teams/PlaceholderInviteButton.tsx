'use client'

import { useState } from 'react'
import { Mail, Loader2, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'

interface Props {
  userId: string
}

/**
 * Super-admin action on a placeholder member: mint a one-time claim link the
 * person uses to take over their account. With an address entered, the link is
 * emailed directly; either way it is shown and copied for manual delivery.
 */
export default function PlaceholderInviteButton({ userId }: Props) {
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function invite() {
    setBusy(true)
    setError(null)
    const res = await apiFetch<{ token: string; emailed: boolean }>('/api/admin/teams/invite', {
      method: 'POST',
      body: { user_id: userId, email: email.trim() || undefined },
    })
    setBusy(false)
    if (!res.success || !res.data?.token) {
      setError(res.error || 'Einladung fehlgeschlagen')
      return
    }
    const url = `${window.location.origin}/einladung/${res.data.token}`
    setLink(url)
    if (res.data.emailed) {
      setSentTo(email.trim())
    } else if (email.trim()) {
      setError('E-Mail-Versand fehlgeschlagen — Link manuell weitergeben.')
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard blocked — the link is shown for manual copy.
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setError('Kopieren nicht möglich — Link manuell markieren.')
    }
  }

  if (link) {
    return (
      <div className="flex flex-col items-start gap-1 w-full sm:w-auto">
        <div className="flex items-center gap-1.5 w-full">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 sm:w-64 text-xs px-2 py-1 rounded border bg-surface-raised text-text-secondary"
            aria-label="Einladungslink"
          />
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopiert' : 'Kopieren'}
          </Button>
        </div>
        {sentTo && (
          <span className="text-xs text-success-600 dark:text-success-400">
            Einladung an {sentTo} gesendet.
          </span>
        )}
        {error && <span className="text-xs text-error-600 dark:text-error-400">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-1.5">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-Mail (optional)"
          maxLength={200}
          className="w-44 h-8 text-xs"
          aria-label="E-Mail für Einladungsversand (optional)"
        />
        <Button type="button" variant="secondary" size="sm" onClick={invite} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Einladen
        </Button>
      </div>
      {error && <span className="text-xs text-error-600 dark:text-error-400">{error}</span>}
    </div>
  )
}
