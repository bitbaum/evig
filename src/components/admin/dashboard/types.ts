import type { Package } from 'lucide-react'

export interface MissionStats {
  devicesProcessedThisMonth: number
  devicesSoldThisMonth: number
  itHilfeCompletedThisMonth: number
  workshopAttendeesThisMonth: number
}

export interface DashboardStats {
  // Action items with age of oldest unresolved item
  pendingApprovals: number
  pendingApprovalsOldest: string | null
  pendingPermissionRequests: number
  pendingAppointments: number
  pendingAppointmentsOldest: string | null
  unverifiedListings: number
  unverifiedListingsOldest: string | null
  pendingBlogSubmissions: number
  pendingBlogSubmissionsOldest: string | null
  urgentItHilfe: number
  urgentItHilfeOldest: string | null
  pendingRepairerApplications: number
  pendingRepairerApplicationsOldest: string | null
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
}

export type ActionItem = {
  type: 'urgent' | 'warning' | 'success'
  label: string
  count?: number
  href: string
  actionLabel: string
  /** ISO timestamp of the oldest unresolved item — shown as age hint */
  oldestAt?: string | null
}

export type QuickAction = {
  label: string
  href: string
  icon: typeof Package
  color: string
}

export type FulfillAction = {
  label: string
  href: string
  icon: typeof Package
  count: number
}
