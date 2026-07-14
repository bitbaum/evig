'use client'

import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { TEAM_ROLES } from '@/config/teams'

interface Props {
  teamId: string
  viewerUserId: string
  /** The viewer's live membership id in THIS team, or null when not a member. */
  viewerMembershipId: string | null
}

/** Self-service join / leave for the staff member viewing the team page. */
export default function TeamJoinButton({ teamId, viewerUserId, viewerMembershipId }: Props) {
  const { busy, error, run } = useAsyncAction()
  const isMember = !!viewerMembershipId

  const toggle = () =>
    run('toggle', () =>
      isMember
        ? apiFetch(`/api/admin/teams/${teamId}/members/${viewerMembershipId}`, { method: 'DELETE' })
        : apiFetch(`/api/admin/teams/${teamId}/members`, {
            method: 'POST',
            body: { user_id: viewerUserId, role: TEAM_ROLES.MEMBER },
          }),
    )

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={isMember ? 'secondary' : 'primary'}
        size="sm"
        onClick={toggle}
        disabled={!!busy}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isMember ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {isMember ? 'Team verlassen' : 'Team beitreten'}
      </Button>
      {error && <p className="text-xs text-error-600 dark:text-error-400">{error}</p>}
    </div>
  )
}
