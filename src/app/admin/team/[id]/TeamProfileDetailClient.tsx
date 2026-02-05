'use client'

/**
 * Team Profile Detail Client Component
 *
 * Wraps TeamProfileView with navigation handlers.
 */

import { useRouter } from 'next/navigation'
import { TeamProfileView } from '@/components/admin/team'
import type { TeamProfileWithUser } from '@/lib/schemas/team'

interface Props {
  profile: TeamProfileWithUser
  isSuperAdmin: boolean
}

export function TeamProfileDetailClient({ profile, isSuperAdmin }: Props) {
  const router = useRouter()

  return (
    <TeamProfileView
      profile={profile}
      isSuperAdmin={isSuperAdmin}
      onEdit={() => router.push(`/admin/team/${profile.id}/edit`)}
      onBack={() => router.push('/admin/team')}
    />
  )
}
