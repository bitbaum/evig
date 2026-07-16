'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MailPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { TEAM_ROLES, TEAM_ROLE_OPTIONS, TEAM_ROLE_LABELS, type TeamRole } from '@/config/teams'

interface Props {
  teamId: string
}

type InviteResponse = { outcome: 'added_existing' | 'invited'; emailed?: boolean }

/**
 * Super-admin: invite a person into the team by name + email. Registered staff
 * are added directly (and notified); everyone else gets a claim link by email
 * and appears as a placeholder member right away.
 */
export default function InviteByEmailForm({ teamId }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>(TEAM_ROLES.MEMBER)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    const res = await apiFetch<InviteResponse>(`/api/admin/teams/${teamId}/invitations`, {
      method: 'POST',
      body: { name, email, role },
    })
    setBusy(false)
    if (!res.success || !res.data) {
      setError(res.error || 'Einladung fehlgeschlagen')
      return
    }
    if (res.data.outcome === 'added_existing') {
      setNotice('Bereits registriert — direkt zum Team hinzugefügt und benachrichtigt.')
    } else if (res.data.emailed) {
      setNotice(`Einladung an ${email} gesendet.`)
    } else {
      setNotice('Mitglied angelegt, aber der E-Mail-Versand schlug fehl — Einladungslink über «Einladen» beim Mitglied erneut senden.')
    }
    setName('')
    setEmail('')
    setRole(TEAM_ROLES.MEMBER)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-surface-base rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor="invite-name" className="block text-xs font-medium text-text-secondary mb-1">
            Per E-Mail einladen
          </label>
          <Input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            maxLength={120}
            required
          />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="invite-email" className="sr-only">
            E-Mail-Adresse
          </label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@revamp-it.ch"
            maxLength={200}
            required
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="invite-role" className="sr-only">
            Rolle
          </label>
          <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
            {TEAM_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {TEAM_ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={busy || !name || !email}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailPlus className="w-4 h-4" />}
          Einladen
        </Button>
      </div>
      <p className="text-xs text-text-tertiary mt-2">
        Registrierte Mitarbeitende werden direkt hinzugefügt; alle anderen erhalten einen
        Einladungslink per E-Mail und erscheinen sofort als Mitglied.
      </p>
      {notice && <p className="text-xs text-success-600 dark:text-success-400 mt-1">{notice}</p>}
      {error && <p className="text-xs text-error-600 dark:text-error-400 mt-1">{error}</p>}
    </form>
  )
}
