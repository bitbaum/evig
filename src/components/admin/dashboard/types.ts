import type { Package } from 'lucide-react'

export interface DashboardStats {
  // Action items
  pendingApprovals: number
  pendingPermissionRequests: number
  pendingAppointments: number

  // Alert counts
  pendingBlogSubmissions: number
  urgentItHilfe: number
  pendingRepairerApplications: number
  overdueTasks: number
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
  unverifiedListings: number
}

export type ActionItem = {
  type: 'urgent' | 'warning' | 'success'
  label: string
  count?: number
  href: string
  actionLabel: string
}

export type QuickAction = {
  label: string
  href: string
  icon: typeof Package
  color: string
}
