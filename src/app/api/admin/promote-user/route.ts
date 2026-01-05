/**
 * Promote User to Admin API
 * POST /api/admin/promote-user
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiSuccess, apiError, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { withAdmin } from '@/lib/api/middleware'

export const POST = withAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { userId, email } = body

    if (!userId && !email) {
      return apiBadRequest('User ID or email required')
    }

    // Find user by ID or email
    let userIdToPromote = userId
    if (email && !userId) {
      const userResult = await query(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
        [email]
      )
      if (userResult.rows.length === 0) {
        return apiNotFound('User')
      }
      userIdToPromote = userResult.rows[0].id
    }

    // Update user role to admin
    const updateResult = await query(
      `UPDATE ${TABLE_NAMES.USERS} SET role = $1, "updatedAt" = NOW() WHERE id = $2`,
      ['admin', userIdToPromote]
    )

    if (updateResult.rowCount === 0) {
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






