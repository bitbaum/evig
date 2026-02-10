'use client'

/**
 * Activity Page Client Component
 *
 * Client-side rendering for the activity feed with filters.
 * Fetches team members for per-person filtering.
 */

import { useState, useEffect } from 'react'
import { ActivityFeed } from '@/components/admin/team/activity'

interface TeamMemberOption {
  id: string
  name: string | null
  email: string
}

export function ActivityPageClient() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([])

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const res = await fetch('/api/admin/team/profiles')
        const data = await res.json()
        if (data.success && data.data) {
          const members = data.data.map((m: { user_id: string; user_name: string | null; user_email: string }) => ({
            id: m.user_id,
            name: m.user_name,
            email: m.user_email,
          }))
          setTeamMembers(members)
        }
      } catch {
        // Team members are optional — filter just won't appear
      }
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
