'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, X, Loader2, ArrowRightLeft } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import MoveMemberModal, { type MoveTeamRef } from '@/components/admin/teams/MoveMemberModal'
import { apiFetch } from '@/lib/api/client'
import { ROUTES } from '@/config/routes'
import { TEAM_ROLES, TEAM_ROLE_LABELS, getTeamRoleColor, getAccentClasses, type TeamRole } from '@/config/teams'
import type { MembershipForUser } from '@/lib/schemas/teams'

interface Props {
  person: { userId: string; name: string | null; avatarUrl?: string | null }
  memberships: MembershipForUser[]
  /** All active teams (with accent) for join + move. */
  allTeams: (MoveTeamRef & { slug: string })[]
}

/** A person's team memberships, shown on their profile — the teammate view. */
export default function MemberTeamsCard({ person, memberships, allTeams }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addTeam, setAddTeam] = useState('')
  const [moving, setMoving] = useState<MembershipForUser | null>(null)

  const memberTeamIds = useMemo(() => new Set(memberships.map((m) => m.team_id)), [memberships])
  const joinable = useMemo(() => allTeams.filter((t) => !memberTeamIds.has(t.id)), [allTeams, memberTeamIds])
  const canMove = allTeams.length > 1

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setBusy(key)
    setError(null)
    const res = await fn()
    setBusy(null)
    if (!res.success) {
      setError(res.error || 'Aktion fehlgeschlagen')
      return
    }
    router.refresh()
  }

  const join = () =>
    run('join', () =>
      apiFetch(`/api/admin/teams/${addTeam}/members`, {
        method: 'POST',
        body: { user_id: person.userId, role: TEAM_ROLES.MEMBER },
      }).then((r) => {
        if (r.success) setAddTeam('')
        return r
      }),
    )

  const leave = (teamId: string, membershipId: string) =>
    run(`leave-${membershipId}`, () =>
      apiFetch(`/api/admin/teams/${teamId}/members/${membershipId}`, { method: 'DELETE' }),
    )

  return (
    <div className="bg-surface-base rounded-lg border p-5">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-text-secondary" />
        Teams
      </h3>

      {error && (
        <div className="mb-3 p-2 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      {memberships.length === 0 ? (
        <p className="text-sm text-text-secondary mb-3">In keinem Team.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {memberships.map((m) => (
            <li key={m.membership_id} className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full shrink-0 ${getAccentClasses(m.accent)}`} aria-hidden />
              <Link href={ROUTES.admin.teamBySlug(m.slug)} className="text-sm text-text-primary hover:text-action truncate">
                {m.team_name}
              </Link>
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${getTeamRoleColor(m.role)}`}>
                {TEAM_ROLE_LABELS[m.role as TeamRole] ?? m.role}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {canMove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMoving(m)}
                    aria-label={`Aus ${m.team_name} verschieben`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Verschieben
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive-ghost"
                  size="icon"
                  onClick={() => leave(m.team_id, m.membership_id)}
                  disabled={busy === `leave-${m.membership_id}`}
                  aria-label={`Aus ${m.team_name} entfernen`}
                >
                  {busy === `leave-${m.membership_id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {joinable.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <Select aria-label="Team hinzufügen" value={addTeam} onChange={(e) => setAddTeam(e.target.value)}>
              <option value="">Zu Team hinzufügen…</option>
              {joinable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <Button size="sm" onClick={join} disabled={!addTeam || busy === 'join'}>
            {busy === 'join' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {moving && (
        <MoveMemberModal
          isOpen
          onClose={() => setMoving(null)}
          person={person}
          teams={allTeams}
          currentTeamIds={Array.from(memberTeamIds)}
          fromTeamId={moving.team_id}
          fromTeamName={moving.team_name}
          onMoved={() => router.refresh()}
        />
      )}
    </div>
  )
}
