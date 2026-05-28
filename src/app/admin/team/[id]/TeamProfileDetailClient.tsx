'use client'

/**
 * Team Profile Detail Client Component
 *
 * Phase 3 of the team + timecards rebuild: wraps the existing
 * TeamProfileView in a tab shell so HR can see Überblick / Zeiterfassung /
 * Aktivität for one person in one place — no jumping to
 * /admin/timecards or /admin/team/activity. Tab state is in the URL
 * (?tab=zeiterfassung) so deep-links work.
 */

import { TeamProfileTabs } from '@/components/admin/team/TeamProfileTabs'
import type { TeamProfileWithUser } from '@/lib/schemas/team'

interface Props {
  profile: TeamProfileWithUser
  isSuperAdmin: boolean
}

export function TeamProfileDetailClient({ profile, isSuperAdmin }: Props) {
  return <TeamProfileTabs profile={profile} isSuperAdmin={isSuperAdmin} />
}
