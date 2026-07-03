/**
 * API: Staff Permission Request
 *
 * POST /api/admin/permissions/request
 * Allows staff to request access to admin sections they don't have.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { staffPermissionRequests, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { PERMISSION_REQUEST_STATUS } from '@/config/permission-request-status'
import { ADMIN_SECTIONS, SUPER_ADMIN_EMAILS, type AdminSection } from '@/lib/permissions'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { notifyUsers } from '@/lib/services/notifications'
import { logger } from '@/lib/logger'

export const POST = withAdmin(async (request, session) => {
  try {
    const body = await request.json()
    const { sections, reason } = body

    // Validate sections
    if (!Array.isArray(sections) || sections.length === 0) {
      return apiBadRequest('Mindestens ein Bereich ist erforderlich')
    }

    // Validate that all sections are valid
    const validSections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
    const invalidSections = sections.filter((s: string) => !validSections.includes(s as AdminSection))
    if (invalidSections.length > 0) {
      return apiBadRequest(`Ungültige Bereiche: ${invalidSections.join(', ')}`)
    }

    // Validate reason
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return apiBadRequest('Bitte gib einen Grund an (mindestens 10 Zeichen)')
    }

    // Check if user already has a pending request for any of these sections
    const [existing] = await db
      .select({ id: staffPermissionRequests.id })
      .from(staffPermissionRequests)
      .where(and(
        eq(staffPermissionRequests.userId, session.user.id),
        eq(staffPermissionRequests.status, PERMISSION_REQUEST_STATUS.PENDING),
        sql`${staffPermissionRequests.requestedSections} && ${sections}`,
      ))

    if (existing) {
      return apiBadRequest('Du hast bereits eine ausstehende Anfrage für einen oder mehrere dieser Bereiche')
    }

    // Create the permission request
    const [created] = await db
      .insert(staffPermissionRequests)
      .values({
        userId: session.user.id,
        requestedSections: sections,
        reason: reason.trim(),
      })
      .returning({ id: staffPermissionRequests.id })

    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`${users.isSuperAdmin} = true OR lower(${users.email}) = ANY(${[...SUPER_ADMIN_EMAILS]}::text[])`)
      const adminIds = admins.map(admin => admin.id)
      if (adminIds.length > 0) {
        await notifyUsers(adminIds, {
          type: NOTIFICATION_TYPES.PERMISSION_REQUEST_SUBMITTED,
          title: 'Neue Berechtigungsanfrage',
          content: `${session.user.name || session.user.email || 'Ein Teammitglied'} beantragt Zugriff auf ${sections.join(', ')}.`,
        })
      }
    } catch (error) {
      logger.warn('Failed to notify super admins about permission request', { error, requestId: created.id })
    }

    return apiSuccess({
      requestId: created.id,
      message: 'Berechtigungsanfrage eingereicht. Ein Super-Admin wird sie prüfen.',
    })
  } catch (error) {
    return apiError(error, 'Berechtigungsanfrage konnte nicht eingereicht werden')
  }
})
