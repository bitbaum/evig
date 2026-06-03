/**
 * API: Manage User Permissions
 *
 * PATCH /api/admin/users/[id]/permissions
 * Super admins can update staff permissions and super admin status.
 * All changes are logged to the audit log.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { isSuperAdmin, ADMIN_SECTIONS, SUPER_ADMIN_EMAILS, type AdminSection } from '@/lib/permissions'
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
    const [targetUser] = await db
      .select({
        id: users.id,
        email: users.email,
        is_super_admin: users.isSuperAdmin,
        staff_permissions: sql<string[]>`COALESCE(${users.staffPermissions}, '{}')`,
      })
      .from(users)
      .where(eq(users.id, id))

    if (!targetUser) {
      return apiNotFound('Benutzer')
    }

    const auditContext = getAuditContext(request, session.user.id)

    // Prevent demoting users who are in the hardcoded super admin list
    if (newSuperAdminStatus === false && SUPER_ADMIN_EMAILS.includes(targetUser.email.toLowerCase() as typeof SUPER_ADMIN_EMAILS[number])) {
      return apiBadRequest('Benutzer aus der Kern-Super-Admin-Liste können nicht herabgestuft werden')
    }

    // Prevent self-demotion
    if (newSuperAdminStatus === false && targetUser.id === session.user.id) {
      return apiBadRequest('Du kannst dich nicht selbst herabstufen')
    }

    // Build the update object
    const update: Record<string, unknown> = {}

    if (permissions !== undefined) {
      update.staffPermissions = permissions
      // Also set is_staff = true if granting permissions
      if (permissions.length > 0) update.isStaff = true
    }

    if (newSuperAdminStatus !== undefined) {
      update.isSuperAdmin = newSuperAdminStatus
    }

    if (Object.keys(update).length === 0) {
      return apiBadRequest('Keine Aktualisierungen angegeben')
    }

    // Bump tokenVersion so the Auth.js jwt callback re-fetches permissions
    // on the user's next token refresh — see commit 3/3 of the
    // JWT-stale-permissions sequence for the callback enforcement side.
    update.tokenVersion = sql`${users.tokenVersion} + 1`

    // ATOMICITY: write the permission change FIRST, then write the audit
    // log entries with awaited synchronous inserts. If the permission
    // update fails the route returns 500 before any audit log is written
    // (no false positives in the audit table). If the audit log write
    // fails after the update succeeds, logAuditEventSync's internal
    // catch surfaces it via logger.error so ops can reconcile manually
    // — but the permission state in DB is real. Full multi-statement
    // atomicity would need either logAudit*-as-transaction-handle or a
    // single-statement write+log, both larger refactors than warranted
    // for this rare flow.
    await db.update(users).set(update).where(eq(users.id, id))

    if (permissions !== undefined) {
      await logPermissionsChange(
        auditContext,
        targetUser.id,
        targetUser.email,
        targetUser.staff_permissions || [],
        permissions,
      )
      logger.info('User permissions updated', {
        adminEmail: session.user.email,
        targetEmail: targetUser.email,
        oldPermissions: targetUser.staff_permissions,
        newPermissions: permissions,
      })
    }

    if (newSuperAdminStatus !== undefined) {
      await logSuperAdminChange(
        auditContext,
        targetUser.id,
        targetUser.email,
        newSuperAdminStatus,
      )
      logger.info('User super admin status changed', {
        adminEmail: session.user.email,
        targetEmail: targetUser.email,
        oldStatus: targetUser.is_super_admin,
        newStatus: newSuperAdminStatus,
      })
    }

    return apiSuccess({ message: 'Benutzerberechtigungen erfolgreich aktualisiert' })
  } catch (error) {
    return apiError(error, 'Benutzerberechtigungen konnten nicht aktualisiert werden')
  }
})
