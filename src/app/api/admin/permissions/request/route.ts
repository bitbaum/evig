/**
 * API: Staff Permission Request
 *
 * POST /api/admin/permissions/request
 * Allows staff to request access to admin sections they don't have.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isStaffEmail, ADMIN_SECTIONS, type AdminSection } from '@/lib/permissions'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    // Only staff can request permissions
    if (!session.user.isStaff && !isStaffEmail(session.user.email)) {
      return apiForbidden('Nur Mitarbeiter können Berechtigungen anfordern')
    }

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
      return apiBadRequest('Bitte geben Sie einen Grund an (mindestens 10 Zeichen)')
    }

    // Check if user already has a pending request for any of these sections
    const existingResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS}
       WHERE user_id = $1
       AND status = 'pending'
       AND requested_sections && $2`,
      [session.user.id, sections]
    )

    if (existingResult.rows.length > 0) {
      return apiBadRequest('Sie haben bereits eine ausstehende Anfrage für einen oder mehrere dieser Bereiche')
    }

    // Create the permission request
    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS} (user_id, requested_sections, reason)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [session.user.id, sections, reason.trim()]
    )

    return apiSuccess({
      requestId: result.rows[0].id,
      message: 'Berechtigungsanfrage eingereicht. Ein Super-Admin wird sie prüfen.',
    })
  } catch (error) {
    return apiError(error, 'Berechtigungsanfrage konnte nicht eingereicht werden')
  }
}
