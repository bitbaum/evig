import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import type { DashboardStats } from './types'

export async function getDashboardStats(isSuper: boolean): Promise<DashboardStats> {
  const stats: DashboardStats = {
    pendingApprovals: 0,
    pendingPermissionRequests: 0,
    pendingAppointments: 0,
    newUsersThisWeek: 0,
    postsPublishedThisWeek: 0,
    totalUsers: 0,
    totalStaff: 0,
    totalTechnicians: 0,
    totalListings: 0,
    activeListings: 0,
    unverifiedListings: 0,
  }

  try {
    // Get total user count
    const usersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    stats.totalUsers = parseInt(usersResult.rows[0]?.count || '0')

    // Get staff count
    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    stats.totalStaff = parseInt(staffResult.rows[0]?.count || '0')

    // Get pending content approvals (workshops and blog posts only)
    try {
      const approvalsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
         WHERE status = 'pending' AND content_type = ANY($1)`,
        [['workshop', 'blog_post']]
      )
      stats.pendingApprovals = parseInt(approvalsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get pending permission requests (super admin only)
    if (isSuper) {
      try {
        const permissionsResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS} WHERE status = 'pending'`
        )
        stats.pendingPermissionRequests = parseInt(permissionsResult.rows[0]?.count || '0')
      } catch {
        // Table might not exist yet
      }
    }

    // Get pending service appointments
    try {
      const appointmentsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} WHERE status = 'pending'`
      )
      stats.pendingAppointments = parseInt(appointmentsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get technician count
    try {
      const techResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true`
      )
      stats.totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get new users this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const newUsersResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}
         WHERE created_at >= $1`,
        [weekAgo.toISOString()]
      )
      stats.newUsersThisWeek = parseInt(newUsersResult.rows[0]?.count || '0')
    } catch {
      // Column might not exist
    }

    // Get posts published this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const postsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS}
         WHERE status = 'published' AND published_at >= $1`,
        [weekAgo.toISOString()]
      )
      stats.postsPublishedThisWeek = parseInt(postsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    // Get marketplace listing stats
    try {
      const listingsResult = await query<{ total: string; active: string; unverified: string }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'active') as active,
           COUNT(*) FILTER (WHERE status = 'active' AND verified_at IS NULL) as unverified
         FROM ${TABLE_NAMES.LISTINGS}`
      )
      const lr = listingsResult.rows[0]
      stats.totalListings = parseInt(lr?.total || '0')
      stats.activeListings = parseInt(lr?.active || '0')
      stats.unverifiedListings = parseInt(lr?.unverified || '0')
    } catch {
      // Table might not exist
    }

    return stats
  } catch {
    return stats
  }
}
