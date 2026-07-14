'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'

interface Props {
  token: string
  suggestedName: string | null
}

/** Turns a placeholder into a real account: real name, email, password. */
export default function ClaimForm({ token, suggestedName }: Props) {
  const [name, setName] = useState(suggestedName ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await apiFetch('/api/public/claim', {
      method: 'POST',
      body: { token, name, email, password },
    })
    setBusy(false)
    if (!res.success) {
      setError(res.error || 'Übernahme fehlgeschlagen')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto" />
        <h2 className="text-lg font-semibold text-text-primary">Konto übernommen</h2>
        <p className="text-sm text-text-secondary">
          Du kannst dich jetzt mit deiner E-Mail-Adresse und deinem Passwort anmelden.
        </p>
        <Link href="/auth/login" className="inline-block">
          <Button>Zur Anmeldung</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="claim-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
        <Input id="claim-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus />
      </div>
      <div>
        <label htmlFor="claim-email" className="block text-sm font-medium text-text-secondary mb-1">E-Mail</label>
        <Input id="claim-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} required placeholder="du@revamp-it.ch" />
      </div>
      <div>
        <label htmlFor="claim-password" className="block text-sm font-medium text-text-secondary mb-1">Passwort</label>
        <Input id="claim-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Konto übernehmen
      </Button>
    </form>
  )
}
