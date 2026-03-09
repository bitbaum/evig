/**
 * API: Manage User Permissions
 *
 * PATCH /api/admin/users/[id]/permissions
 * Super admins can update staff permissions and super admin status.
 * All changes are logged to the audit log.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { isSuperAdmin, ADMIN_SECTIONS, SUPER_ADMIN_EMAILS, type AdminSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { logPermissionsChange, logSuperAdminChange } from '@/lib/auth/audit'
import { apiSuccess, apiError, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody, AdminPermissionsSchema } from '@/lib/schemas'

/**
 * Get request context for audit logging
 */
function getAuditContext(request: NextRequest, userId: string | null) {
  return {
    userId,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}

export const PATCH = withAdmin<{ id: string }>('users', async (request, session, context) => {
  try {
    // Only super admins can manage permissions
    if (!isSuperAdmin(session.user.email, session.user.isSuperAdmin)) {
      return apiForbidden('Nur Super-Admins können Berechtigungen verwalten')
    }

    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminPermissionsSchema, body)
    if (!validation.success) return validation.error
    const { permissions, isSuperAdmin: newSuperAdminStatus } = validation.data

    // Validate each permission against ADMIN_SECTIONS
    if (permissions !== undefined) {
      const validSections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
      const invalidPermissions = permissions.filter(
        (p: string) => p !== '*' && !validSections.includes(p as AdminSection)
      )
      if (invalidPermissions.length > 0) {
        return apiBadRequest(`Ungültige Berechtigungen: ${invalidPermissions.join(', ')}`)
      }
    }

    // Get current user info including current permissions
    const userResult = await query<{
      id: string
      email: string
      is_super_admin: boolean
      staff_permissions: string[]
    }>(
      `SELECT id, email, is_super_admin, COALESCE(staff_permissions, '{}') as staff_permissions
       FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [id]
    )

    if (userResult.rows.length === 0) {
      return apiNotFound('Benutzer')
    }

    const targetUser = userResult.rows[0]
    const auditContext = getAuditContext(request, session.user.id)

    // Prevent demoting users who are in the hardcoded super admin list
    if (newSuperAdminStatus === false && SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])) {
      return apiBadRequest('Benutzer aus der Kern-Super-Admin-Liste können nicht herabgestuft werden')
    }

    // Prevent self-demotion
    if (newSuperAdminStatus === false && targetUser.id === session.user.id) {
      return apiBadRequest('Sie können sich nicht selbst herabstufen')
    }

    // Build the update query
    const updates: string[] = []
    const values: (string | string[] | boolean)[] = []
    let paramIndex = 1

    if (permissions !== undefined) {
      updates.push(`staff_permissions = $${paramIndex}`)
      values.push(permissions)
      paramIndex++

      // Also set is_staff = true if granting permissions
      if (permissions.length > 0) {
        updates.push(`is_staff = true`)
      }

      // Log permissions change
      logPermissionsChange(
        auditContext,
        targetUser.id,
        targetUser.email,
        targetUser.staff_permissions || [],
        permissions
      )

      logger.info('User permissions updated', {
        adminEmail: session.user.email,
        targetEmail: targetUser.email,
        oldPermissions: targetUser.staff_permissions,
        newPermissions: permissions,
      })
    }

    if (newSuperAdminStatus !== undefined) {
      updates.push(`is_super_admin = $${paramIndex}`)
      values.push(newSuperAdminStatus)
      paramIndex++

      // Log super admin status change
      logSuperAdminChange(
        auditContext,
        targetUser.id,
        targetUser.email,
        newSuperAdminStatus
      )

      logger.info('User super admin status changed', {
        adminEmail: session.user.email,
        targetEmail: targetUser.email,
        oldStatus: targetUser.is_super_admin,
        newStatus: newSuperAdminStatus,
      })
    }

    if (updates.length === 0) {
      return apiBadRequest('Keine Aktualisierungen angegeben')
    }

    values.push(id)

    await query(
      `UPDATE ${TABLE_NAMES.USERS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    )

    return apiSuccess({ message: 'Benutzerberechtigungen erfolgreich aktualisiert' })
  } catch (error) {
    return apiError(error, 'Benutzerberechtigungen konnten nicht aktualisiert werden')
  }
})
