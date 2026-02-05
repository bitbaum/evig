/**
 * API: Users List with Search, Filter, and Pagination
 *
 * GET /api/admin/users - List users with filtering
 *
 * Query params:
 * - search: Filter by name or email (ILIKE)
 * - type: 'all', 'staff', 'regular'
 * - verified: 'all', 'yes', 'no'
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 100)
 *
 * Access: Staff with 'users' permission
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/api/helpers'
import { z } from 'zod'

// Query params validation schema
const usersFilterSchema = z.object({
  search: z.string().max(100).optional(),
  type: z.enum(['all', 'staff', 'regular']).optional().default('all'),
  verified: z.enum(['all', 'yes', 'no']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
})

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

    if (!canAccessSection(user, 'users')) {
      return apiForbidden('Kein Zugriff auf Benutzer-Bereich')
    }

    // Parse and validate query params
    const { searchParams } = new URL(request.url)
    const filterResult = usersFilterSchema.safeParse({
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || 'all',
      verified: searchParams.get('verified') || 'all',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 25,
    })

    if (!filterResult.success) {
      return apiSuccess({ items: [], pagination: { total: 0, page: 1, limit: 25, pages: 0 } })
    }

    const filters = filterResult.data
    const offset = (filters.page - 1) * filters.limit

    // Build query with filters
    const conditions: string[] = []
    const values: (string | boolean)[] = []
    let paramIndex = 1

    if (filters.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      values.push(`%${filters.search}%`)
      paramIndex++
    }

    if (filters.type === 'staff') {
      conditions.push(`is_staff = true`)
    } else if (filters.type === 'regular') {
      conditions.push(`(is_staff = false OR is_staff IS NULL)`)
    }

    if (filters.verified === 'yes') {
      conditions.push(`email_verified IS NOT NULL`)
    } else if (filters.verified === 'no') {
      conditions.push(`email_verified IS NULL`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} ${whereClause}`,
      values
    )
    const total = parseInt(countResult.rows[0]?.count || '0')

    // Get paginated users
    const usersResult = await query<{
      id: string
      name: string | null
      email: string
      is_staff: boolean
      is_super_admin: boolean
      staff_permissions: string[] | null
      created_at: string
      email_verified: string | null
    }>(
      `SELECT
        id,
        name,
        email,
        is_staff,
        is_super_admin,
        staff_permissions,
        "createdAt" as created_at,
        email_verified
       FROM ${TABLE_NAMES.USERS}
       ${whereClause}
       ORDER BY is_staff DESC, "createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, filters.limit, offset]
    )

    // Add computed fields
    const usersWithDetails = usersResult.rows.map(user => ({
      ...user,
      is_super_admin_computed: isSuperAdmin(user.email, user.is_super_admin),
    }))

    return apiSuccess({
      items: usersWithDetails,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    return apiError(error, 'Benutzer konnten nicht geladen werden')
  }
}
