/**
 * API: User Search for Donations
 *
 * GET /api/admin/donations/users?search=... - Search users for linking to donations
 *
 * Access: Staff with 'donations' permission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { canAccessSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'donations')) {
      return apiForbidden('Kein Zugriff auf Spenden-Bereich')
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()

    if (!search || search.length < 2) {
      return apiSuccess({ users: [] })
    }

    // Search users by name or email
    const result = await query<{
      id: string
      name: string | null
      email: string
    }>(
      `SELECT id, name, email
       FROM ${TABLE_NAMES.USERS}
       WHERE name ILIKE $1 OR email ILIKE $1
       ORDER BY name ASC, email ASC
       LIMIT 10`,
      [`%${search}%`]
    )

    logger.info('User search for donations', {
      search,
      resultCount: result.rows.length,
      adminEmail: session.user.email,
    })

    return apiSuccess({ users: result.rows })
  } catch (error) {
    logger.error('User search for donations failed', { error })
    return apiError(error, 'Benutzersuche fehlgeschlagen')
  }
}
