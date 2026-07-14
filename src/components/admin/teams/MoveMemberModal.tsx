'use client'

import { useMemo, useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import {
  TEAM_ROLES,
  TEAM_ROLE_OPTIONS,
  TEAM_ROLE_LABELS,
  getAccentClasses,
  type TeamRole,
} from '@/config/teams'

export interface MoveTeamRef {
  id: string
  name: string
  accent: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  person: { userId: string; name: string | null; avatarUrl?: string | null }
  /** All active teams (move/join targets). */
  teams: MoveTeamRef[]
  /** Teams the person is already a live member of (marked in the picker). */
  currentTeamIds?: string[]
  /** Source team when moving FROM a specific team; omit for a pure join. */
  fromTeamId?: string | null
  fromTeamName?: string | null
  /** Called after a successful move/join (usually router.refresh). */
  onMoved: () => void
}

/**
 * One modal powers join / move / role-change. A move (fromTeamId set) closes the
 * old live membership and opens a new one via the members POST (transfer path);
 * a join just adds. History is preserved server-side (left_at).
 */
export default function MoveMemberModal({
  isOpen,
  onClose,
  person,
  teams,
  currentTeamIds = [],
  fromTeamId,
  fromTeamName,
  onMoved,
}: Props) {
  const isMove = !!fromTeamId
  const [toTeamId, setToTeamId] = useState('')
  const [role, setRole] = useState<TeamRole>(TEAM_ROLES.MEMBER)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSet = useMemo(() => new Set(currentTeamIds), [currentTeamIds])
  // Targets: every active team except the source. Teams the person is already in
  // are shown but flagged — picking one just changes their role there.
  const targets = useMemo(
    () => teams.filter((t) => t.id !== fromTeamId),
    [teams, fromTeamId],
  )
  const selected = targets.find((t) => t.id === toTeamId)

  async function submit() {
    if (!toTeamId) return
    setBusy(true)
    setError(null)
    const res = await apiFetch(`/api/admin/teams/${toTeamId}/members`, {
      method: 'POST',
      body: {
        user_id: person.userId,
        role,
        ...(fromTeamId ? { from_team_id: fromTeamId } : {}),
      },
    })
    setBusy(false)
    if (!res.success) {
      setError(res.error || 'Verschieben fehlgeschlagen')
      return
    }
    // Reset for next use, then let the parent refresh + close.
    setToTeamId('')
    setRole(TEAM_ROLES.MEMBER)
    onMoved()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isMove ? `${person.name ?? 'Mitglied'} verschieben` : `${person.name ?? 'Mitglied'} zuordnen`}
    >
      <div className="space-y-5">
        {/* Person */}
        <div className="flex items-center gap-3">
          <Avatar src={person.avatarUrl} name={person.name} size="md" />
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">{person.name ?? '—'}</p>
            {isMove && fromTeamName && (
              <p className="text-xs text-text-tertiary truncate">Aktuell in {fromTeamName}</p>
            )}
          </div>
        </div>

        {/* From → To */}
        <div className="flex items-center gap-3">
          {isMove && (
            <>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getAccentClasses(teams.find((t) => t.id === fromTeamId)?.accent)}`}>
                {fromTeamName ?? 'Aktuelles Team'}
              </span>
              <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0" aria-hidden />
            </>
          )}
          <div className="flex-1 min-w-0">
            <label htmlFor="move-to" className="sr-only">Zielteam</label>
            <Select id="move-to" value={toTeamId} onChange={(e) => setToTeamId(e.target.value)}>
              <option value="">{isMove ? 'Nach Team…' : 'Team wählen…'}</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{currentSet.has(t.id) ? ' (bereits Mitglied)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {selected && (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${getAccentClasses(selected.accent)}`} aria-hidden />
            <span className="text-sm text-text-secondary">Zielteam: {selected.name}</span>
          </div>
        )}

        {/* Role */}
        <div>
          <label htmlFor="move-role" className="block text-xs font-medium text-text-secondary mb-1">Rolle</label>
          <Select id="move-role" value={role} onChange={(e) => setRole(e.target.value as TeamRole)}>
            {TEAM_ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{TEAM_ROLE_LABELS[r]}</option>
            ))}
          </Select>
        </div>

        {error && (
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button onClick={submit} disabled={!toTeamId || busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isMove ? 'Verschieben' : 'Hinzufügen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
