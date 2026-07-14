'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, ArrowRightLeft, Loader2, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import MoveMemberModal, { type MoveTeamRef } from '@/components/admin/teams/MoveMemberModal'
import { apiFetch } from '@/lib/api/client'
import { getAccentClasses, getTeamRoleColor, TEAM_ROLE_LABELS, type TeamRole } from '@/config/teams'
import { WORK_STATE_LABELS, WORK_STATE_COLORS, type WorkState } from '@/config/team'
import type { TeamMemberRow } from '@/lib/schemas/teams'

export interface BoardColumn {
  /** null = the "Ohne Team" column. */
  teamId: string | null
  teamName: string
  accent: string
  members: TeamMemberRow[]
}

interface Props {
  columns: BoardColumn[]
  /** All active teams (with accent) for the Move modal + drop targets. */
  allTeams: MoveTeamRef[]
}

interface DragPayload {
  userId: string
  fromTeamId: string | null
  membershipId: string | null
  role: string | null
}

/**
 * The team-assignment board. Renders from props (server is the source of truth):
 * every move calls the API then `router.refresh()`. Desktop = drag a person card
 * between columns (native HTML5 DnD); phone/tablet = the per-card Move button →
 * MoveMemberModal. The Move button is always present, so DnD is pure enhancement.
 */
export default function AssignmentBoard({ columns, allTeams }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [moving, setMoving] = useState<{ card: TeamMemberRow; fromTeamId: string | null } | null>(null)

  // Which teams each person is currently in (a person can be in several columns).
  const teamsByUser = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const col of columns) {
      if (!col.teamId) continue
      for (const m of col.members) {
        const arr = map.get(m.user_id) ?? []
        arr.push(col.teamId)
        map.set(m.user_id, arr)
      }
    }
    return map
  }, [columns])

  async function call(key: string, req: () => Promise<{ success: boolean; error?: string }>) {
    setPending(key)
    setError(null)
    const res = await req()
    if (!res.success) {
      setError(res.error || 'Aktion fehlgeschlagen')
      setPending(null)
      return
    }
    setPending(null)
    router.refresh()
  }

  /** Move to a team (drag or drop). Dropping onto "Ohne Team" = leave. */
  function drop(target: BoardColumn, raw: string) {
    let p: DragPayload
    try { p = JSON.parse(raw) } catch { return }
    if (p.fromTeamId === target.teamId) return

    if (target.teamId === null) {
      // Into "Ohne Team" → leave the source team (only meaningful from a team).
      if (!p.fromTeamId || !p.membershipId) return
      call(p.userId, () =>
        apiFetch(`/api/admin/teams/${p.fromTeamId}/members/${p.membershipId}`, { method: 'DELETE' }),
      )
      return
    }
    call(p.userId, () =>
      apiFetch(`/api/admin/teams/${target.teamId}/members`, {
        method: 'POST',
        body: { user_id: p.userId, role: p.role || 'member', ...(p.fromTeamId ? { from_team_id: p.fromTeamId } : {}) },
      }),
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-4 md:overflow-x-auto md:pb-2 gap-4">
        {columns.map((col) => {
          const colKey = col.teamId ?? 'ohne'
          const isOhne = col.teamId === null
          return (
            <section
              key={colKey}
              onDragOver={(e) => { e.preventDefault(); setDragOver(colKey) }}
              onDragLeave={() => setDragOver((c) => (c === colKey ? null : c))}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); drop(col, e.dataTransfer.getData('application/json')) }}
              className={`w-full md:w-72 md:shrink-0 rounded-lg border bg-surface-raised/40 p-3 transition-colors ${
                dragOver === colKey ? 'border-action ring-1 ring-action/40' : 'border'
              }`}
            >
              <header className="flex items-center justify-between gap-2 mb-3 px-1">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isOhne ? 'bg-surface-raised text-text-tertiary' : getAccentClasses(col.accent)
                }`}>
                  {isOhne && <UserRound className="w-3 h-3" />}
                  {col.teamName}
                </span>
                <span className="text-xs text-text-tertiary tabular-nums">{col.members.length}</span>
              </header>

              {col.members.length === 0 ? (
                <p className="text-xs text-text-tertiary px-1 py-4 text-center">
                  {isOhne ? 'Alle zugeteilt' : 'Zum Zuweisen hierher ziehen'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {col.members.map((m) => {
                    const payload: DragPayload = { userId: m.user_id, fromTeamId: col.teamId, membershipId: m.membership_id, role: m.role }
                    const busy = pending === m.user_id
                    return (
                      <li
                        key={`${colKey}-${m.user_id}`}
                        draggable={!busy}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(payload))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        className={`group bg-surface-base rounded-lg border p-2.5 flex items-center gap-2 ${
                          busy ? 'opacity-50' : 'md:cursor-grab active:md:cursor-grabbing hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <GripVertical className="hidden md:block w-4 h-4 text-text-tertiary shrink-0" aria-hidden />
                        <Avatar src={m.avatar_url} name={m.name || m.email} size="xs" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">{m.name || m.email || '—'}</p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {!isOhne && m.role && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTeamRoleColor(m.role)}`}>
                                {TEAM_ROLE_LABELS[m.role as TeamRole] ?? m.role}
                              </span>
                            )}
                            {m.work_state && m.work_state !== 'active' && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${WORK_STATE_COLORS[m.work_state as WorkState] ?? ''}`}>
                                {WORK_STATE_LABELS[m.work_state as WorkState] ?? m.work_state}
                              </span>
                            )}
                          </div>
                        </div>
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-text-tertiary shrink-0" />
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setMoving({ card: m, fromTeamId: col.teamId })}
                            aria-label={`${m.name || m.email} verschieben`}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <p className="text-xs text-text-tertiary flex items-center gap-1.5 px-1">
        <ArrowRightLeft className="w-3 h-3" />
        Am Desktop Karten zwischen Teams ziehen — auf dem Handy tippen und «Verschieben». Ziehen auf «Ohne
        Team» entfernt die Person aus dem Team.
      </p>

      {moving && (
        <MoveMemberModal
          isOpen
          onClose={() => setMoving(null)}
          person={{ userId: moving.card.user_id, name: moving.card.name || moving.card.email, avatarUrl: moving.card.avatar_url }}
          teams={allTeams}
          currentTeamIds={teamsByUser.get(moving.card.user_id) ?? []}
          fromTeamId={moving.fromTeamId}
          fromTeamName={moving.fromTeamId ? columns.find((c) => c.teamId === moving.fromTeamId)?.teamName : null}
          onMoved={() => router.refresh()}
        />
      )}
    </div>
  )
}
