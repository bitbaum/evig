'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import { TEAM_ROLES } from '@/config/teams'

interface Props {
  teamId: string
  viewerUserId: string
  /** The viewer's live membership id in THIS team, or null when not a member. */
  viewerMembershipId: string | null
}

/** Self-service join / leave for the staff member viewing the team page. */
export default function TeamJoinButton({ teamId, viewerUserId, viewerMembershipId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMember = !!viewerMembershipId

  async function toggle() {
    setBusy(true)
    setError(null)
    const res = isMember
      ? await apiFetch(`/api/admin/teams/${teamId}/members/${viewerMembershipId}`, { method: 'DELETE' })
      : await apiFetch(`/api/admin/teams/${teamId}/members`, {
          method: 'POST',
          body: { user_id: viewerUserId, role: TEAM_ROLES.MEMBER },
        })
    setBusy(false)
    if (!res.success) {
      setError(res.error || 'Aktion fehlgeschlagen')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={isMember ? 'secondary' : 'primary'}
        size="sm"
        onClick={toggle}
        disabled={busy}
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
