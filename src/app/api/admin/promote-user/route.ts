/**
 * Promote User to Admin API
 * POST /api/admin/promote-user
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { withAdmin } from '@/lib/api/middleware'
import { ROLES } from '@/lib/constants'

export const POST = withAdmin('users', async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { userId, email } = body

    if (!userId && !email) {
      return apiBadRequest('User ID or email required')
    }

    // Find user by ID or email
    let userIdToPromote = userId
    if (email && !userId) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))

      if (!user) {
        return apiNotFound('User')
      }
      userIdToPromote = user.id
    }

    // Update user role to admin
    const [updated] = await db
      .update(users)
      .set({
        role: ROLES.REVAMPIT_ADMIN,
        updatedAt: sql`NOW()`,
      })
      .where(eq(users.id, userIdToPromote))
      .returning({ id: users.id })

    if (!updated) {
      return apiNotFound('User')
    }

    return apiSuccess({
      message: 'User promoted to admin successfully',
      userId: userIdToPromote,
    })
  } catch (error) {
    return apiError(error, 'Failed to promote user')
  }
})
