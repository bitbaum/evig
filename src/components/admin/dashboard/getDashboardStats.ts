import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import {
  users, userContentSubmissions, staffPermissionRequests,
  serviceAppointments, helperProfiles, listings,
} from '@/db/schema'
import { blogPosts } from '@/db/schema/content'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'
import { LISTING_STATUS } from '@/config/marketplace'
import type { DashboardStats } from './types'

// Table name refs for raw SQL
const usersTable = getTableName(users)
const ucsTable = getTableName(userContentSubmissions)
const sprTable = getTableName(staffPermissionRequests)
const saTable = getTableName(serviceAppointments)
const hpTable = getTableName(helperProfiles)
const blogTable = getTableName(blogPosts)
const listingsTable = getTableName(listings)

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
    const usersResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(usersTable)}
    `)
    stats.totalUsers = parseInt((usersResult.rows as unknown as { count: string }[])[0]?.count || '0')

    // Get staff count
    const staffResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.raw(usersTable)} WHERE is_staff = true
    `)
    stats.totalStaff = parseInt((staffResult.rows as unknown as { count: string }[])[0]?.count || '0')

    // Get pending content approvals (workshops and blog posts only)
    try {
      const approvalsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(ucsTable)}
        WHERE status = ${APPROVAL_STATUS.PENDING} AND content_type = ANY(${['workshop', 'blog_post']})
      `)
      stats.pendingApprovals = parseInt((approvalsResult.rows as unknown as { count: string }[])[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get pending permission requests (super admin only)
    if (isSuper) {
      try {
        const permissionsResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM ${sql.raw(sprTable)} WHERE status = ${PERMISSION_REQUEST_STATUS.PENDING}
        `)
        stats.pendingPermissionRequests = parseInt((permissionsResult.rows as unknown as { count: string }[])[0]?.count || '0')
      } catch {
        // Table might not exist yet
      }
    }

    // Get pending service appointments
    try {
      const appointmentsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(saTable)} WHERE status = 'pending'
      `)
      stats.pendingAppointments = parseInt((appointmentsResult.rows as unknown as { count: string }[])[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get technician count
    try {
      const techResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(hpTable)} WHERE is_active = true
      `)
      stats.totalTechnicians = parseInt((techResult.rows as unknown as { count: string }[])[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get new users this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const newUsersResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(usersTable)}
        WHERE "createdAt" >= ${weekAgo.toISOString()}
      `)
      stats.newUsersThisWeek = parseInt((newUsersResult.rows as unknown as { count: string }[])[0]?.count || '0')
    } catch {
      // Column might not exist
    }

    // Get posts published this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const postsResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.raw(blogTable)}
        WHERE status = ${APPROVAL_STATUS.PUBLISHED} AND published_at >= ${weekAgo.toISOString()}
      `)
      stats.postsPublishedThisWeek = parseInt((postsResult.rows as unknown as { count: string }[])[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    // Get marketplace listing stats
    try {
      const listingsResult = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE}) as active,
          COUNT(*) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE} AND verified_at IS NULL) as unverified
        FROM ${sql.raw(listingsTable)}
      `)
      const lr = (listingsResult.rows as unknown as { total: string; active: string; unverified: string }[])[0]
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
