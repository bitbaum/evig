'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Mail, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Status {
  provider: 'listmonk' | 'smtp'
  connectionTest: { success: boolean; error?: string }
  smtp: { host: string; port: number; secure: boolean; from: string; userSet: boolean; passSet: boolean }
  listmonk: { enabled: boolean; url: string; fromEmail: string; userSet: boolean; passSet: boolean }
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-success-600" />
      ) : (
        <XCircle className="h-4 w-4 text-error-500" />
      )}
      <span className="text-text-secondary">{label}</span>
    </span>
  )
}

export function EmailDiagnostics() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)
  const [testResult, setTestResult] = useState<{ accepted: boolean; error: string | null } | null>(null)

  useEffect(() => {
    apiFetch<Status>('/api/admin/email/diagnostics').then(r => {
      if (r.success && r.data) setStatus(r.data)
      else setLoadError(r.error || 'Konnte Status nicht laden')
    })
  }, [])

  const sendTest = async () => {
    setSending(true)
    setTestResult(null)
    const r = await apiFetch<{ accepted: boolean; error: string | null }>('/api/admin/email/diagnostics', {
      method: 'POST',
      body: { to },
    })
    setSending(false)
    if (r.success && r.data) setTestResult(r.data)
    else setTestResult({ accepted: false, error: r.error || 'Fehler' })
  }

  if (loadError) return <p className="text-sm text-error-600">{loadError}</p>
  if (!status) return <p className="text-sm text-text-tertiary">Lädt…</p>

  const active = status.provider === 'listmonk' ? status.listmonk : null

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-subtle bg-surface-base p-5">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">
            Aktiver Anbieter: <span className="uppercase">{status.provider}</span>
          </h3>
        </div>
        <div className="mb-4">
          <Flag
            ok={status.connectionTest.success}
            label={
              status.connectionTest.success
                ? 'Verbindungstest bestanden'
                : `Verbindungstest fehlgeschlagen: ${status.connectionTest.error ?? 'unbekannt'}`
            }
          />
        </div>

        {status.provider === 'smtp' ? (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-text-tertiary">Host</dt><dd className="font-mono text-text-primary">{status.smtp.host}:{status.smtp.port}</dd></div>
            <div><dt className="text-text-tertiary">Absender</dt><dd className="font-mono text-text-primary">{status.smtp.from}</dd></div>
            <div className="pt-1"><Flag ok={status.smtp.userSet} label="Benutzer gesetzt" /></div>
            <div className="pt-1"><Flag ok={status.smtp.passSet} label="Passwort gesetzt" /></div>
          </dl>
        ) : (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="text-text-tertiary">URL</dt><dd className="font-mono text-text-primary">{active?.url}</dd></div>
            <div><dt className="text-text-tertiary">Absender</dt><dd className="font-mono text-text-primary">{active?.fromEmail}</dd></div>
            <div className="pt-1"><Flag ok={!!active?.userSet} label="Benutzer gesetzt" /></div>
            <div className="pt-1"><Flag ok={!!active?.passSet} label="Passwort gesetzt" /></div>
          </dl>
        )}
      </div>

      <div className="rounded-xl border border-subtle bg-surface-base p-5">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Test-E-Mail senden</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="empfaenger@example.com"
            className="w-64"
          />
          <Button variant="primary" size="sm" onClick={sendTest} disabled={sending || !to} className="inline-flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" /> {sending ? 'Sendet…' : 'Senden'}
          </Button>
        </div>
        {testResult && (
          <div className="mt-3 text-sm">
            {testResult.accepted ? (
              <p className="text-success-700 dark:text-success-400">
                Vom Anbieter angenommen. Hinweis: Angenommen ≠ zugestellt — prüfe den Posteingang (auch Spam).
                Bleibt sie aus, liegt es an SPF/DKIM/Reputation der Absenderdomain.
              </p>
            ) : (
              <p className="text-error-600 dark:text-error-400">Fehlgeschlagen: {testResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
