/**
 * API: User Management
 *
 * GET    /api/admin/users/[id] - Get user details
 * PATCH  /api/admin/users/[id] - Update user profile
 * DELETE /api/admin/users/[id] - Delete user
 *
 * Only super admins can access these endpoints.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { isSuperAdmin, SUPER_ADMIN_EMAILS } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, AdminUpdateUserSchema } from '@/lib/schemas'

interface RequestContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export async function GET(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzerdetails einsehen')
    }

    const { id } = await context.params

    const result = await query<{
      id: string
      name: string | null
      email: string
      is_staff: boolean
      is_super_admin: boolean
      staff_permissions: string[] | null
      created_at: string
      email_verified: string | null
      phone: string | null
      address: string | null
    }>(
      `SELECT
        id, name, email, is_staff, is_super_admin,
        staff_permissions, "createdAt" as created_at,
        "emailVerified" as email_verified, phone, address
       FROM ${TABLE_NAMES.USERS}
       WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return apiNotFound('Benutzer')
    }

    return apiSuccess({ user: result.rows[0] })
  } catch (error) {
    return apiError(error, 'Benutzer konnte nicht geladen werden')
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user profile (name, email, phone, address, staff status)
 */
export async function PATCH(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzer bearbeiten')
    }

    const { id } = await context.params
    const body = await request.json()
    const validation = validateBody(AdminUpdateUserSchema, body)
    if (!validation.success) return validation.error
    const { name, email, phone, address, is_staff } = validation.data

    // Check if user exists
    const existingUser = await query<{ id: string; email: string }>(
      `SELECT id, email FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [id]
    )

    if (existingUser.rows.length === 0) {
      return apiNotFound('Benutzer')
    }

    // If changing email, check if new email already exists
    if (email && email !== existingUser.rows[0].email) {
      const emailCheck = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1 AND id != $2`,
        [email, id]
      )
      if (emailCheck.rows.length > 0) {
        return apiBadRequest('E-Mail wird bereits von einem anderen Benutzer verwendet')
      }
    }

    // Build dynamic update query
    const updates: string[] = []
    const values: (string | boolean | null)[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(name)
      paramIndex++
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`)
      values.push(email)
      paramIndex++
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`)
      values.push(phone)
      paramIndex++
    }

    if (address !== undefined) {
      updates.push(`address = $${paramIndex}`)
      values.push(address)
      paramIndex++
    }

    if (is_staff !== undefined) {
      updates.push(`is_staff = $${paramIndex}`)
      values.push(is_staff)
      paramIndex++
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Felder zum Aktualisieren')
    }

    values.push(id)

    await query(
      `UPDATE ${TABLE_NAMES.USERS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    )

    logger.info('User updated by admin', {
      adminId: session.user.id,
      targetUserId: id,
      fields: Object.keys(body),
    })

    return apiSuccess({ message: 'Benutzer erfolgreich aktualisiert' })
  } catch (error) {
    return apiError(error, 'Benutzer konnte nicht aktualisiert werden')
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all associated data
 */
export async function DELETE(request: NextRequest, context: RequestContext) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzer löschen')
    }

    const { id } = await context.params

    // Get user to check if they exist and for logging
    const userResult = await query<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [id]
    )

    if (userResult.rows.length === 0) {
      return apiNotFound('Benutzer')
    }

    const targetUser = userResult.rows[0]

    // Prevent deleting super admins from the hardcoded list
    if (SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])) {
      return apiForbidden('Kern-Super-Admins können nicht gelöscht werden')
    }

    // Prevent self-deletion
    if (targetUser.id === session.user.id) {
      return apiBadRequest('Sie können sich nicht selbst löschen')
    }

    // Delete related data first (foreign key constraints)
    // Sessions
    await query(
      `DELETE FROM ${TABLE_NAMES.SESSIONS} WHERE "userId" = $1`,
      [id]
    )

    // Accounts (OAuth links)
    await query(
      `DELETE FROM ${TABLE_NAMES.ACCOUNTS} WHERE "userId" = $1`,
      [id]
    )

    // Finally delete the user
    await query(
      `DELETE FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [id]
    )

    logger.info('User deleted by admin', {
      adminId: session.user.id,
      adminEmail: session.user.email,
      deletedUserId: id,
      deletedUserEmail: targetUser.email,
      deletedUserName: targetUser.name,
    })

    return apiSuccess({ message: `Benutzer ${targetUser.email} wurde gelöscht` })
  } catch (error) {
    return apiError(error, 'Benutzer konnte nicht gelöscht werden')
  }
}
