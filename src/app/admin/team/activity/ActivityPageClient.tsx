'use client'

/**
 * Activity Page Client Component
 *
 * Client-side rendering for the activity feed with filters
 */

import { ActivityFeed } from '@/components/admin/team/activity'

export function ActivityPageClient() {
  return (
    <div className="max-w-4xl">
      <ActivityFeed
        showAddButton={true}
        showFilters={true}
        compact={false}
      />
    </div>
  )
}
