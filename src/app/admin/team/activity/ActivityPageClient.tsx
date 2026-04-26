'use client'

/**
 * Activity Page Client Component
 *
 * Client-side rendering for the activity feed with filters.
 * Fetches team members for per-person filtering.
 */

import { useState, useEffect } from 'react'
import { ActivityFeed } from '@/components/admin/team/activity'
import { apiFetch } from '@/lib/api/client'

interface TeamMemberOption {
  id: string
  name: string | null
  email: string
}

export function ActivityPageClient() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([])

  useEffect(() => {
    async function fetchTeamMembers() {
      const result = await apiFetch<Array<{ user_id: string; user_name: string | null; user_email: string }>>(
        '/api/admin/team/profiles',
      )
      if (result.success && result.data) {
        setTeamMembers(result.data.map(m => ({
          id: m.user_id,
          name: m.user_name,
          email: m.user_email,
        })))
      }
      // Team members are optional — filter just won't appear on failure
    }
    fetchTeamMembers()
  }, [])

  return (
    <div className="max-w-4xl">
      <ActivityFeed
        showAddButton={true}
        showFilters={true}
        compact={false}
        teamMembers={teamMembers}
      />
    </div>
  )
}
