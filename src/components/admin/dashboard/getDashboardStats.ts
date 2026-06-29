import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import {
  users, userContentSubmissions, staffPermissionRequests,
  serviceAppointments, repairerProfiles, listings,
  tasks, decisions, itHilfeRequests, repairerApplications,
  inventoryItems, workshopRegistrations,
} from '@/db/schema'
import { jobApplications } from '@/db/schema/hr-vacancies'
import { timecards } from '@/db/schema/timecards'
import { blogPosts, blogSubmissions } from '@/db/schema/content'
import { APPROVAL_STATUS, SUBMISSION_CONTENT_TYPE } from '@/config/approval-status'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'
import { LISTING_STATUS } from '@/config/marketplace'
import { REQUEST_STATUS, URGENCY } from '@/config/it-hilfe'
import { REPAIRER_APPLICATION_STATUS, REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { APPLICATION_STATUS } from '@/config/hr-application-status'
import { TIMECARD_STATUSES } from '@/config/timecards'
import { DECISION_STATUS } from '@/config/decisions'
import { INVENTORY_ITEM_STATUS } from '@/config/marketplace-status'
import { logger } from '@/lib/logger'
import type { DashboardStats } from './types'

// Table name refs
const usersTable = getTableName(users)
const ucsTable = getTableName(userContentSubmissions)
const sprTable = getTableName(staffPermissionRequests)
const saTable = getTableName(serviceAppointments)
const rpTable = getTableName(repairerProfiles)
const blogTable = getTableName(blogPosts)
const listingsTable = getTableName(listings)
const blogSubTable = getTableName(blogSubmissions)
const itHilfeTable = getTableName(itHilfeRequests)
const repairerAppTable = getTableName(repairerApplications)
const jobApplicationsTable = getTableName(jobApplications)
const timecardsTable = getTableName(timecards)
const tasksTable = getTableName(tasks)
const decisionsTable = getTableName(decisions)
const inventoryTable = getTableName(inventoryItems)
const workshopRegTable = getTableName(workshopRegistrations)

// ---- helpers ----------------------------------------------------------------

type Row = Record<string, unknown>

function rowCount(result: PromiseSettledResult<{ rows: unknown[] }>, label: string): number {
  if (result.status === 'rejected') {
    logger.warn(`Dashboard stat query failed: ${label}`, { error: result.reason })
    return 0
  }
  return parseInt(String((result.value.rows as Row[])[0]?.count ?? '0'), 10)
}

function rowCountAndOldest(
  result: PromiseSettledResult<{ rows: unknown[] }>,
  label: string,
): { count: number; oldest: string | null } {
  if (result.status === 'rejected') {
    logger.warn(`Dashboard stat query failed: ${label}`, { error: result.reason })
    return { count: 0, oldest: null }
  }
  const row = (result.value.rows as Row[])[0] ?? {}
  return {
    count: parseInt(String(row.count ?? '0'), 10),
    oldest: (row.oldest as string | null) ?? null,
  }
}

// ---- main -------------------------------------------------------------------

export async function getDashboardStats(isSuper: boolean): Promise<DashboardStats> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoISO = weekAgo.toISOString()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStartISO = monthStart.toISOString()

  const prevMonthEnd = new Date(monthStart)
  const prevMonthStart = new Date(monthStart)
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
  const prevMonthStartISO = prevMonthStart.toISOString()
  const prevMonthEndISO = prevMonthEnd.toISOString()

  // Fire all queries in parallel — wall time = max latency, not sum
  const [
    usersRes,
    staffRes,
    techRes,
    approvalsRes,
    permissionsRes,
    appointmentsRes,
    blogSubRes,
    itHilfeRes,
    repairerRes,
    jobApplicationsRes,
    timecardsRes,
    tasksRes,
    decisionsRes,
    listingsRes,
    newUsersRes,
    postsRes,
    devicesProcessedRes,
    devicesSoldRes,
    itHilfeCompletedRes,
    workshopAttendeesRes,
    prevDevicesProcessedRes,
    prevDevicesSoldRes,
    prevItHilfeCompletedRes,
    prevWorkshopAttendeesRes,
    topApprovalRes,
    topListingRes,
    topRepairerRes,
  ] = await Promise.allSettled([
    // Reference counts
    db.execute(sql`SELECT COUNT(*) AS count FROM ${sql.raw(usersTable)}`),
    db.execute(sql`SELECT COUNT(*) AS count FROM ${sql.raw(usersTable)} WHERE is_staff = true`),
    db.execute(sql`SELECT COUNT(*) AS count FROM ${sql.raw(rpTable)} WHERE is_active = true AND profile_tier = ${REPAIRER_PROFILE_TIER.COMMUNITY}`),

    // Action items — count + oldest unresolved
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(ucsTable)}
      WHERE status = ${APPROVAL_STATUS.PENDING}
        AND content_type IN (${SUBMISSION_CONTENT_TYPE.WORKSHOP}, ${SUBMISSION_CONTENT_TYPE.BLOG_POST})
    `),
    isSuper
      ? db.execute(sql`
          SELECT COUNT(*) AS count
          FROM ${sql.raw(sprTable)}
          WHERE status = ${PERMISSION_REQUEST_STATUS.PENDING}
        `)
      : Promise.resolve({ rows: [{ count: '0' }] }),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(saTable)}
      WHERE status = ${APPROVAL_STATUS.PENDING}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(blogSubTable)}
      WHERE status = ${APPROVAL_STATUS.PENDING}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(itHilfeTable)}
      WHERE status = ${REQUEST_STATUS.OPEN} AND urgency = ${URGENCY.URGENT}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(repairerAppTable)}
      WHERE status = ${APPROVAL_STATUS.PENDING}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(created_at) AS oldest
      FROM ${sql.raw(jobApplicationsTable)}
      WHERE status = ${APPLICATION_STATUS.NEW}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(submitted_at) AS oldest
      FROM ${sql.raw(timecardsTable)}
      WHERE status = ${TIMECARD_STATUSES.SUBMITTED}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count, MIN(due_date) AS oldest
      FROM ${sql.raw(tasksTable)}
      WHERE due_date < CURRENT_DATE AND is_completed = false AND is_archived = false
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(decisionsTable)}
      WHERE status = ${DECISION_STATUS.VOTING}
    `),
    db.execute(sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE}) AS active,
        COUNT(*) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE} AND verified_at IS NULL) AS unverified,
        MIN(created_at) FILTER (WHERE status = ${LISTING_STATUS.ACTIVE} AND verified_at IS NULL) AS unverified_oldest
      FROM ${sql.raw(listingsTable)}
    `),

    // Weekly activity
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(usersTable)}
      WHERE "createdAt" >= ${weekAgoISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(blogTable)}
      WHERE is_published = true AND published_at >= ${weekAgoISO}
    `),

    // Mission metrics — this month's impact
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(inventoryTable)}
      WHERE created_at >= ${monthStartISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(inventoryTable)}
      WHERE status = ${INVENTORY_ITEM_STATUS.SOLD} AND updated_at >= ${monthStartISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(itHilfeTable)}
      WHERE status = ${REQUEST_STATUS.COMPLETED} AND completed_at >= ${monthStartISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(workshopRegTable)}
      WHERE attended = true AND created_at >= ${monthStartISO}
    `),

    // Prev-month mission metrics for delta calculation
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(inventoryTable)}
      WHERE created_at >= ${prevMonthStartISO} AND created_at < ${prevMonthEndISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(inventoryTable)}
      WHERE status = ${INVENTORY_ITEM_STATUS.SOLD} AND updated_at >= ${prevMonthStartISO} AND updated_at < ${prevMonthEndISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(itHilfeTable)}
      WHERE status = ${REQUEST_STATUS.COMPLETED} AND completed_at >= ${prevMonthStartISO} AND completed_at < ${prevMonthEndISO}
    `),
    db.execute(sql`
      SELECT COUNT(*) AS count
      FROM ${sql.raw(workshopRegTable)}
      WHERE attended = true AND created_at >= ${prevMonthStartISO} AND created_at < ${prevMonthEndISO}
    `),

    // Top pending items for inline actions in the dashboard queue
    db.execute(sql`
      SELECT id, COALESCE(title, content_type, 'Einreichung') AS label
      FROM ${sql.raw(ucsTable)}
      WHERE status = ${APPROVAL_STATUS.PENDING}
        AND content_type IN (${SUBMISSION_CONTENT_TYPE.WORKSHOP}, ${SUBMISSION_CONTENT_TYPE.BLOG_POST})
      ORDER BY created_at ASC
      LIMIT 1
    `),
    db.execute(sql`
      SELECT id, COALESCE(title, 'Inserat') AS label
      FROM ${sql.raw(listingsTable)}
      WHERE status = ${LISTING_STATUS.ACTIVE} AND verified_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    `),
    db.execute(sql`
      SELECT ra.id, COALESCE(ra.business_name, u.name, 'Bewerbung') AS label
      FROM ${sql.raw(repairerAppTable)} ra
      LEFT JOIN ${sql.raw(usersTable)} u ON u.id = ra.user_id
      WHERE ra.status = ${REPAIRER_APPLICATION_STATUS.PENDING}
      ORDER BY ra.created_at ASC
      LIMIT 1
    `),
  ])

  // Extract approvals
  const approvals = rowCountAndOldest(approvalsRes, 'pendingApprovals')
  const appointments = rowCountAndOldest(appointmentsRes, 'pendingAppointments')
  const blogSubs = rowCountAndOldest(blogSubRes, 'pendingBlogSubmissions')
  const itHilfe = rowCountAndOldest(itHilfeRes, 'urgentItHilfe')
  const repairer = rowCountAndOldest(repairerRes, 'pendingRepairerApplications')
  const jobApps = rowCountAndOldest(jobApplicationsRes, 'pendingJobApplications')
  const timecardApprovals = rowCountAndOldest(timecardsRes, 'pendingTimecardApprovals')
  const overdueTasksData = rowCountAndOldest(tasksRes, 'overdueTasks')

  // Listings (special shape)
  let unverifiedListings = 0
  let unverifiedListingsOldest: string | null = null
  let totalListings = 0
  let activeListings = 0
  if (listingsRes.status === 'rejected') {
    logger.warn('Dashboard stat query failed: listings', { error: listingsRes.reason })
  } else {
    const lr = (listingsRes.value.rows as Row[])[0] ?? {}
    totalListings = parseInt(String(lr.total ?? '0'), 10)
    activeListings = parseInt(String(lr.active ?? '0'), 10)
    unverifiedListings = parseInt(String(lr.unverified ?? '0'), 10)
    unverifiedListingsOldest = (lr.unverified_oldest as string | null) ?? null
  }

  return {
    pendingApprovals: approvals.count,
    pendingApprovalsOldest: approvals.oldest,
    pendingPermissionRequests: rowCount(permissionsRes, 'pendingPermissionRequests'),
    pendingAppointments: appointments.count,
    pendingAppointmentsOldest: appointments.oldest,
    unverifiedListings,
    unverifiedListingsOldest,
    pendingBlogSubmissions: blogSubs.count,
    pendingBlogSubmissionsOldest: blogSubs.oldest,
    urgentItHilfe: itHilfe.count,
    urgentItHilfeOldest: itHilfe.oldest,
    pendingRepairerApplications: repairer.count,
    pendingRepairerApplicationsOldest: repairer.oldest,
    pendingJobApplications: jobApps.count,
    pendingJobApplicationsOldest: jobApps.oldest,
    pendingTimecardApprovals: timecardApprovals.count,
    pendingTimecardApprovalsOldest: timecardApprovals.oldest,
    overdueTasks: overdueTasksData.count,
    overdueTasksOldest: overdueTasksData.oldest,
    openDecisions: rowCount(decisionsRes, 'openDecisions'),
    newUsersThisWeek: rowCount(newUsersRes, 'newUsersThisWeek'),
    postsPublishedThisWeek: rowCount(postsRes, 'postsPublishedThisWeek'),
    totalUsers: rowCount(usersRes, 'totalUsers'),
    totalStaff: rowCount(staffRes, 'totalStaff'),
    totalTechnicians: rowCount(techRes, 'totalTechnicians'),
    totalListings,
    activeListings,
    mission: {
      devicesProcessedThisMonth: rowCount(devicesProcessedRes, 'devicesProcessedThisMonth'),
      devicesSoldThisMonth: rowCount(devicesSoldRes, 'devicesSoldThisMonth'),
      itHilfeCompletedThisMonth: rowCount(itHilfeCompletedRes, 'itHilfeCompletedThisMonth'),
      workshopAttendeesThisMonth: rowCount(workshopAttendeesRes, 'workshopAttendeesThisMonth'),
    },
    delta: {
      devicesProcessed:
        rowCount(devicesProcessedRes, 'devicesProcessedThisMonth') -
        rowCount(prevDevicesProcessedRes, 'prevDevicesProcessed'),
      devicesSold:
        rowCount(devicesSoldRes, 'devicesSoldThisMonth') -
        rowCount(prevDevicesSoldRes, 'prevDevicesSold'),
      itHilfeCompleted:
        rowCount(itHilfeCompletedRes, 'itHilfeCompletedThisMonth') -
        rowCount(prevItHilfeCompletedRes, 'prevItHilfeCompleted'),
      workshopAttendees:
        rowCount(workshopAttendeesRes, 'workshopAttendeesThisMonth') -
        rowCount(prevWorkshopAttendeesRes, 'prevWorkshopAttendees'),
    },
    topPendingApproval: (() => {
      if (topApprovalRes.status !== 'fulfilled') return null
      const r = (topApprovalRes.value.rows as Row[])[0]
      return r ? { id: String(r.id), label: String(r.label) } : null
    })(),
    topUnverifiedListing: (() => {
      if (topListingRes.status !== 'fulfilled') return null
      const r = (topListingRes.value.rows as Row[])[0]
      return r ? { id: String(r.id), label: String(r.label) } : null
    })(),
    topPendingRepairerApp: (() => {
      if (topRepairerRes.status !== 'fulfilled') return null
      const r = (topRepairerRes.value.rows as Row[])[0]
      return r ? { id: String(r.id), label: String(r.label) } : null
    })(),
  }
}
