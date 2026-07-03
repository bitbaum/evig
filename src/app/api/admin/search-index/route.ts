import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { TABLE_NAMES } from '@/config/database'
import { getAdminSections, isSectionId } from '@/config/sections'
import { canAccessSection, toStaffUser } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export const GET = withAdmin(async (_request: NextRequest, session) => {
  try {
    // Scope everything by the CALLER's permissions — the ⌘K index otherwise
    // leaks user PII and sensitive section names to permission-limited staff.
    const staffUser = toStaffUser(session.user)
    const canSeeUsers = canAccessSection(staffUser, 'users')
    const canSeeDecisions = canAccessSection(staffUser, 'decisions')
    const canSeeListings = canAccessSection(staffUser, 'marketplace')

    const [usersResult, decisionsResult, listingsResult] = await Promise.allSettled([
      canSeeUsers
        ? db.execute(sql`
            SELECT id, name, email
            FROM ${sql.raw(TABLE_NAMES.USERS)}
            ORDER BY "createdAt" DESC
            LIMIT 20
          `)
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
      canSeeDecisions
        ? db.execute(sql`
            SELECT id, title, status
            FROM ${sql.raw(TABLE_NAMES.DECISIONS)}
            ORDER BY created_at DESC
            LIMIT 10
          `)
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
      canSeeListings
        ? db.execute(sql`
            SELECT id, title, status
            FROM ${sql.raw(TABLE_NAMES.LISTINGS)}
            ORDER BY created_at DESC
            LIMIT 10
          `)
        : Promise.resolve({ rows: [] as Record<string, unknown>[] }),
    ])

    const sections = getAdminSections()
      .filter(s => isSectionId(s.id) && canAccessSection(staffUser, s.id))
      .map(s => ({
        id: s.id,
        label: s.ui.label,
        path: s.path,
        description: s.ui.description,
      }))

    type Row = Record<string, unknown>

    const recentUsers = usersResult.status === 'fulfilled'
      ? (usersResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          name: r.name ? String(r.name) : '',
          email: String(r.email ?? ''),
        }))
      : []

    const recentDecisions = decisionsResult.status === 'fulfilled'
      ? (decisionsResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          status: String(r.status ?? ''),
        }))
      : []

    const recentListings = listingsResult.status === 'fulfilled'
      ? (listingsResult.value.rows as Row[]).map(r => ({
          id: String(r.id ?? ''),
          title: String(r.title ?? ''),
          status: String(r.status ?? ''),
        }))
      : []

    if (usersResult.status === 'rejected') {
      logger.warn('search-index: users query failed', { error: usersResult.reason })
    }
    if (decisionsResult.status === 'rejected') {
      logger.warn('search-index: decisions query failed', { error: decisionsResult.reason })
    }
    if (listingsResult.status === 'rejected') {
      logger.warn('search-index: listings query failed', { error: listingsResult.reason })
    }

    return apiSuccess({ sections, recentUsers, recentDecisions, recentListings })
  } catch (error) {
    logger.error('search-index GET failed', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
