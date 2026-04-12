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
import { db } from '@/db'
import { users, sessions, accounts, userProfiles } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin, SUPER_ADMIN_EMAILS } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiForbidden, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { validateBody, AdminUpdateUserSchema } from '@/lib/schemas'

/**
 * GET /api/admin/users/[id]
 * Get detailed user information
 */
export const GET = withAdmin<{ id: string }>('users', async (request, session, context) => {
  try {
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzerdetails einsehen')
    }

    const { id } = context!.params!

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        is_staff: users.isStaff,
        is_super_admin: users.isSuperAdmin,
        staff_permissions: users.staffPermissions,
        created_at: users.createdAt,
        email_verified: users.emailVerified,
        phone: userProfiles.phone,
        address: userProfiles.addressLine1,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, id))

    if (rows.length === 0) {
      return apiNotFound('Benutzer')
    }

    return apiSuccess({ user: rows[0] })
  } catch (error) {
    return apiError(error, 'Benutzer konnte nicht geladen werden')
  }
})

/**
 * PATCH /api/admin/users/[id]
 * Update user profile (name, email, phone, address, staff status)
 */
export const PATCH = withAdmin<{ id: string }>('users', async (request, session, context) => {
  try {
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzer bearbeiten')
    }

    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminUpdateUserSchema, body)
    if (!validation.success) return validation.error
    const { name, email, phone, address, is_staff } = validation.data

    // Check if user exists
    const existingRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))

    if (existingRows.length === 0) {
      return apiNotFound('Benutzer')
    }

    // If changing email, check if new email already exists
    if (email && email !== existingRows[0].email) {
      const emailConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, id)))

      if (emailConflict.length > 0) {
        return apiBadRequest('E-Mail wird bereits von einem anderen Benutzer verwendet')
      }
    }

    // Build user table update
    const userUpdate: Record<string, unknown> = {}
    if (name !== undefined) userUpdate.name = name
    if (email !== undefined) userUpdate.email = email
    if (is_staff !== undefined) userUpdate.isStaff = is_staff

    // Build profile table update (phone and address live on user_profiles)
    const profileUpdate: Record<string, unknown> = {}
    if (phone !== undefined) profileUpdate.phone = phone
    if (address !== undefined) profileUpdate.addressLine1 = address

    const hasUserUpdate = Object.keys(userUpdate).length > 0
    const hasProfileUpdate = Object.keys(profileUpdate).length > 0

    if (!hasUserUpdate && !hasProfileUpdate) {
      return apiBadRequest('Keine Felder zum Aktualisieren')
    }

    if (hasUserUpdate) {
      await db.update(users).set(userUpdate).where(eq(users.id, id))
    }

    if (hasProfileUpdate) {
      // Upsert: create profile if it doesn't exist, update if it does
      await db
        .insert(userProfiles)
        .values({ userId: id, ...profileUpdate })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: profileUpdate,
        })
    }

    logger.info('User updated by admin', {
      adminId: session.user.id,
      targetUserId: id,
      fields: Object.keys(body),
    })

    return apiSuccess({ message: 'Benutzer erfolgreich aktualisiert' })
  } catch (error) {
    return apiError(error, 'Benutzer konnte nicht aktualisiert werden')
  }
})

/**
 * DELETE /api/admin/users/[id]
 * Delete a user and all associated data
 */
export const DELETE = withAdmin<{ id: string }>('users', async (request, session, context) => {
  try {
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Benutzer löschen')
    }

    const { id } = context!.params!

    // Get user to check if they exist and for logging
    const userRows = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, id))

    if (userRows.length === 0) {
      return apiNotFound('Benutzer')
    }

    const targetUser = userRows[0]

    // Prevent deleting super admins from the hardcoded list
    if (SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])) {
      return apiForbidden('Kern-Super-Admins können nicht gelöscht werden')
    }

    // Prevent self-deletion
    if (targetUser.id === session.user.id) {
      return apiBadRequest('Du kannst dich nicht selbst löschen')
    }

    // Delete related data first (foreign key constraints)
    await db.delete(sessions).where(eq(sessions.userId, id))
    await db.delete(accounts).where(eq(accounts.userId, id))
    await db.delete(users).where(eq(users.id, id))

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
})
