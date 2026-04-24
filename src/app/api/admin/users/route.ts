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
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, or, ilike, isNull, isNotNull, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin } from '@/lib/permissions'
import {
  apiSuccess,
  apiError,
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

export const GET = withAdmin('users', async (request, session) => {
  try {
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

    // Build dynamic filters
    const conditions: SQL[] = []

    if (filters.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`)
        )!
      )
    }

    if (filters.type === 'staff') {
      conditions.push(eq(users.isStaff, true))
    } else if (filters.type === 'regular') {
      conditions.push(or(eq(users.isStaff, false), isNull(users.isStaff))!)
    }

    if (filters.verified === 'yes') {
      conditions.push(isNotNull(users.emailVerified))
    } else if (filters.verified === 'no') {
      conditions.push(isNull(users.emailVerified))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: users.id,
        name: users.name,
        email: users.email,
        is_staff: users.isStaff,
        is_super_admin: users.isSuperAdmin,
        staff_permissions: users.staffPermissions,
        created_at: users.createdAt,
        email_verified: users.emailVerified,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.isStaff), desc(users.createdAt))
      .limit(filters.limit)
      .offset(offset)

    const total = Number(rows[0]?._total ?? 0)

    // Add computed fields
    const usersWithDetails = rows.map(({ _total, ...user }) => ({
      ...user,
      is_super_admin_computed: isSuperAdmin(user.email, user.is_super_admin ?? undefined),
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
})
