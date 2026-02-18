import type { Package } from 'lucide-react'

export interface DashboardStats {
  // Action items
  pendingApprovals: number
  pendingPermissionRequests: number
  pendingAppointments: number

  // Activity (this week)
  newUsersThisWeek: number
  postsPublishedThisWeek: number

  // Reference stats
  totalUsers: number
  totalStaff: number
  totalTechnicians: number
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
