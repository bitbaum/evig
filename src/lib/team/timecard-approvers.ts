/**
 * Staff who can approve timecards and time-off requests.
 * SSOT for approver fan-out — matches `canAccessSection(..., 'timecards')`.
 */

import { db } from '@/db'
import { users } from '@/db/schema'
import { and, eq, ne, or, sql } from 'drizzle-orm'

const APPROVER_PERMISSIONS = ['timecards', 'timecard-approvals', '*'] as const

export async function getTimecardApproverIds(excludeUserId?: string): Promise<string[]> {
  const permissionMatch = or(
    ...APPROVER_PERMISSIONS.map(
      perm => sql`${users.staffPermissions} @> ARRAY[${perm}]::text[]`,
    ),
    eq(users.isSuperAdmin, true),
  )

  const conditions = [eq(users.isStaff, true), permissionMatch]
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId))
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conditions))

  return rows.map(r => r.id)
}
