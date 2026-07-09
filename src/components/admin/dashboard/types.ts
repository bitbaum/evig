import type { Package } from 'lucide-react'

export interface MissionStats {
  devicesProcessedThisMonth: number
  devicesSoldThisMonth: number
  itHilfeCompletedThisMonth: number
  workshopAttendeesThisMonth: number
}

export interface MissionDelta {
  devicesProcessed: number  // this month - last month
  devicesSold: number
  itHilfeCompleted: number
  workshopAttendees: number
}

export interface DashboardStats {
  // NOTE: approval-type counts (blog, workshop proposals, locations, timecards,
  // absences, permission requests) are NOT here — they come from the SSOT
  // `getApprovalCounts()` engine (src/lib/approvals/counts.ts), the same one the
  // /admin/approvals hub reads, so the two surfaces can't drift. Only
  // non-approval action items live in DashboardStats.

  // Action items with age of oldest unresolved item
  pendingAppointments: number
  pendingAppointmentsOldest: string | null
  unverifiedListings: number
  unverifiedListingsOldest: string | null
  urgentItHilfe: number
  urgentItHilfeOldest: string | null
  pendingRepairerApplications: number
  pendingRepairerApplicationsOldest: string | null
  pendingJobApplications: number
  pendingJobApplicationsOldest: string | null
  overdueTasks: number
  overdueTasksOldest: string | null
  openDecisions: number

  // Activity (this week)
  newUsersThisWeek: number
  postsPublishedThisWeek: number

  // Reference stats
  totalUsers: number
  totalStaff: number
  totalTechnicians: number

  // Marketplace
  totalListings: number
  activeListings: number

  // Mission / impact (this month)
  mission: MissionStats
  // Delta vs last month (positive = improvement)
  delta: MissionDelta
  // Top pending items for inline actions in UnifiedQueue
  topUnverifiedListing: { id: string; label: string } | null
  topPendingRepairerApp: { id: string; label: string } | null
}

export type ActionItem = {
  type: 'urgent' | 'warning' | 'success'
  label: string
  count?: number
  href: string
  actionLabel: string
  /** ISO timestamp of the oldest unresolved item — shown as age hint */
  oldestAt?: string | null
  /** If set, renders an inline approve button in the queue row */
  inlineAction?: {
    itemId: string
    itemLabel: string
    actionType: 'approve_blog' | 'verify_listing' | 'approve_repairer'
  }
}

export type QuickAction = {
  label: string
  href: string
  icon: typeof Package
  color: string
}

// UnifiedQueueItem is an ActionItem — same shape, used in the merged queue
// that replaced the separate ActionItems + FulfillActions sections.
export type UnifiedQueueItem = ActionItem
