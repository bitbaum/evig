import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { getUserRole } from '@/lib/api/role-checks'
import { isAdminRole, ROLES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

interface LocationRow {
  id: string
  approval_status: string
  name: string
  created_by: string
}

// POST /api/locations/[id]/approve - Approve or reject location
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user has approval permissions
    const userRole = await getUserRole(session.user.id)
    const hasApprovalPermission = isAdminRole(userRole) || userRole === ROLES.MODERATOR

    if (!hasApprovalPermission) {
      return apiForbidden('Keine Berechtigung für Genehmigungen')
    }
    const body = await request.json()
    const { action, review_notes, required_changes } = body

    // Validate action
    if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action)) {
      return apiBadRequest('Ungültige Aktion')
    }

    // Check if location exists and get creator info
    const locationCheck = await query(`
      SELECT l.id, l.approval_status, l.name, l.created_by
      FROM ${TABLE_NAMES.LOCATIONS} l
      WHERE l.id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = locationCheck.rows[0] as LocationRow

    // Determine new status based on action
    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'suspend':
        newStatus = 'suspended'
        break
      case 'reinstate':
        newStatus = 'approved'
        break
      default:
        return apiBadRequest('Ungültige Aktion')
    }

    // Execute in transaction
    try {
      await query('BEGIN')

      // Update location status
      await query(`
        UPDATE ${TABLE_NAMES.LOCATIONS}
        SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newStatus, session.user.id, locationId])

      // Create approval record
      await query(`
        INSERT INTO ${TABLE_NAMES.LOCATION_APPROVALS} (
          location_id, reviewer_id, action, status, review_notes, required_changes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        locationId,
        session.user.id,
        action,
        newStatus,
        review_notes || null,
        JSON.stringify(required_changes || [])
      ])

      await query('COMMIT')

      // Send notification to location creator
      if (location.created_by) {
        try {
          const creatorResult = await query(
            `SELECT name, email FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
            [location.created_by]
          )
          if (creatorResult.rows.length > 0) {
            const creator = creatorResult.rows[0] as { name: string; email: string }
            if (creator.email) {
              await sendEmail(
                creator.email,
                'locationApprovalNotification',
                creator.name || 'Benutzer',
                location.name,
                action,
                review_notes || null
              )
            }
          }
        } catch (emailError) {
          logger.warn('Failed to send location approval notification', {
            locationId,
            action,
            error: emailError
          })
        }
      }

      return apiSuccess({
        message: `Ort erfolgreich ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : action === 'suspend' ? 'suspendiert' : 'wiederhergestellt'}`,
        location: {
          id: locationId,
          name: location.name,
          status: newStatus
        }
      })

    } catch (txError) {
      await query('ROLLBACK')
      logger.error('Transaction error in location approval', { error: txError })
      throw txError
    }

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}