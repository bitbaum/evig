/**
 * API: User Search for Donations
 *
 * GET /api/admin/donations/users?search=... - Search users for linking to donations
 *
 * Access: Staff with 'donations' permission
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { or, ilike, asc } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import {
  apiSuccess,
  apiError,
} from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export const GET = withAdmin('donations', async (request: NextRequest, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()

    if (!search || search.length < 2) {
      return apiSuccess({ users: [] })
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
      ))
      .orderBy(asc(users.name), asc(users.email))
      .limit(10)

    logger.info('User search for donations', {
      search,
      resultCount: rows.length,
      adminEmail: session.user.email,
    })

    return apiSuccess({ users: rows })
  } catch (error) {
    logger.error('User search for donations failed', { error })
    return apiError(error, 'Benutzersuche fehlgeschlagen')
  }
})
