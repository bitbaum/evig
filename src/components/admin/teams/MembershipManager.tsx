'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, X, ArrowRightLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import MoveMemberModal, { type MoveTeamRef } from '@/components/admin/teams/MoveMemberModal'
import PlaceholderInviteButton from '@/components/admin/teams/PlaceholderInviteButton'
import InviteByEmailForm from '@/components/admin/teams/InviteByEmailForm'
import { apiFetch } from '@/lib/api/client'
import {
  TEAM_ROLES,
  TEAM_ROLE_OPTIONS,
  TEAM_ROLE_LABELS,
  getTeamRoleColor,
  isPlaceholderEmail,
  type TeamRole,
} from '@/config/teams'
import { WORK_STATE_LABELS, WORK_STATE_COLORS, type WorkState } from '@/config/team'
import type { TeamMemberRow } from '@/lib/schemas/teams'

interface StaffCandidate {
  user_id: string
  name: string | null
  email: string | null
  avatar_url: string | null
}

interface Props {
  teamId: string
  teamName: string
  teamAccent: string
  members: TeamMemberRow[]
  candidates: StaffCandidate[]
  /** All active teams (incl. this one), for the Move modal. */
  allTeams: MoveTeamRef[]
  /** Super admins can invite a placeholder member to claim their account. */
  isSuperAdmin?: boolean
}

export default function MembershipManager({ teamId, teamName, teamAccent, members, candidates, allTeams, isSuperAdmin }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addUser, setAddUser] = useState('')
  const [addRole, setAddRole] = useState<TeamRole>(TEAM_ROLES.MEMBER)
  const [showInvite, setShowInvite] = useState(false)
  const [moving, setMoving] = useState<TeamMemberRow | null>(null)
  const canMove = allTeams.length > 1

  const memberUserIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members])
  const available = useMemo(
    () => candidates.filter((c) => !memberUserIds.has(c.user_id)),
    [candidates, memberUserIds],
  )

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

  const addMember = () =>
    run('add', () =>
      apiFetch(`/api/admin/teams/${teamId}/members`, {
        method: 'POST',
        body: { user_id: addUser, role: addRole },
      }).then((r) => {
        if (r.success) setAddUser('')
        return r
      }),
    )

  const changeRole = (membershipId: string, role: string) =>
    run(`role-${membershipId}`, () =>
      apiFetch(`/api/admin/teams/${teamId}/members/${membershipId}`, {
        method: 'PATCH',
        body: { role },
      }),
    )

  const removeMember = (membershipId: string) =>
    run(`remove-${membershipId}`, () =>
      apiFetch(`/api/admin/teams/${teamId}/members/${membershipId}`, { method: 'DELETE' }),
    )

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <p className="text-sm text-text-secondary px-1">Noch keine Mitglieder in diesem Team.</p>
      ) : (
        <ul className="bg-surface-base rounded-lg border divide-y">
          {members.map((m) => (
            <li key={m.membership_id} className="p-3 flex flex-wrap items-center gap-3">
              <Avatar src={m.avatar_url} name={m.name || m.email} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  href={m.profile_id ? `/admin/team/${m.profile_id}` : `/admin/team/new?user_id=${m.user_id}`}
                  title={m.profile_id ? 'Team-Profil öffnen' : 'Noch kein Team-Profil — jetzt anlegen'}
                  className="block font-medium text-text-primary truncate hover:text-action hover:underline"
                >
                  {m.name || m.email || '—'}
                </Link>
                <p className="text-xs text-text-tertiary truncate">
                  {m.position || m.email || ''}
                  {m.work_state && m.work_state !== 'active' && (
                    <span className={`ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${WORK_STATE_COLORS[m.work_state as WorkState] ?? ''}`}>
                      {WORK_STATE_LABELS[m.work_state as WorkState] ?? m.work_state}
                    </span>
                  )}
                </p>
              </div>

              {/* Role */}
              <div className="w-44">
                <Select
                  aria-label={`Rolle von ${m.name || m.email}`}
                  value={m.role}
                  disabled={busy === `role-${m.membership_id}`}
                  onChange={(e) => changeRole(m.membership_id, e.target.value)}
                >
                  {TEAM_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {TEAM_ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <span className={`hidden md:inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTeamRoleColor(m.role)}`}>
                {TEAM_ROLE_LABELS[m.role as TeamRole] ?? m.role}
              </span>

              {/* Invite a placeholder to claim their account (super admin) */}
              {isSuperAdmin && isPlaceholderEmail(m.email) && (
                <PlaceholderInviteButton userId={m.user_id} />
              )}

              {/* Move to another team */}
              {canMove && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setMoving(m)}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Verschieben
                </Button>
              )}

              {/* Remove */}
              <Button
                type="button"
                variant="destructive-ghost"
                size="icon"
                onClick={() => removeMember(m.membership_id)}
                disabled={busy === `remove-${m.membership_id}`}
                aria-label={`${m.name || m.email} entfernen`}
              >
                {busy === `remove-${m.membership_id}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* One place to bring people in: pick existing staff, or (super admin)
          unfold the e-mail invite for people who aren't registered yet. */}
      <div className="bg-surface-base rounded-lg border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="add-member" className="block text-xs font-medium text-text-secondary mb-1">
              Mitglied hinzufügen
            </label>
            <Select id="add-member" value={addUser} onChange={(e) => setAddUser(e.target.value)}>
              <option value="">Mitarbeitende/n wählen…</option>
              {available.map((c) => (
                <option key={c.user_id} value={c.user_id}>
                  {c.name || c.email || c.user_id}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-52">
            <label htmlFor="add-role" className="block text-xs font-medium text-text-secondary mb-1">
              Rolle
            </label>
            <Select id="add-role" value={addRole} onChange={(e) => setAddRole(e.target.value as TeamRole)}>
              {TEAM_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {TEAM_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={addMember} disabled={!addUser || busy === 'add'}>
            {busy === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Hinzufügen
          </Button>
        </div>
        {available.length === 0 && (
          <p className="text-xs text-text-tertiary">Alle Mitarbeitenden sind bereits in diesem Team.</p>
        )}

        {isSuperAdmin && (
          <div className="border-t border-subtle pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowInvite((v) => !v)}
              className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary h-auto px-0"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showInvite ? 'rotate-90' : ''}`} aria-hidden />
              Noch nicht registriert? Per E-Mail einladen
            </Button>
            {showInvite && (
              <div className="mt-3">
                <InviteByEmailForm teamId={teamId} />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-text-tertiary flex items-center gap-1.5 px-1">
        <ArrowRightLeft className="w-3 h-3" />
        Verschieben schliesst die Mitgliedschaft hier und eröffnet sie im Zielteam — der Verlauf bleibt erhalten.
      </p>

      {moving && (
        <MoveMemberModal
          isOpen
          onClose={() => setMoving(null)}
          person={{ userId: moving.user_id, name: moving.name || moving.email, avatarUrl: moving.avatar_url }}
          teams={allTeams}
          currentTeamIds={[teamId]}
          fromTeamId={teamId}
          fromTeamName={teamName}
          onMoved={() => router.refresh()}
        />
      )}
    </div>
  )
}
