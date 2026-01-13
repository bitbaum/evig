import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { getUserRole } from '@/lib/api/role-checks'
import { isAdminRole } from '@/lib/constants'

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
    const hasApprovalPermission = isAdminRole(userRole) || userRole === 'moderator'

    if (!hasApprovalPermission) {
      return apiForbidden('Keine Berechtigung für Genehmigungen')
    }
    const body = await request.json()
    const { action, review_notes, required_changes } = body

    // Validate action
    if (!['approve', 'reject', 'suspend', 'reinstate'].includes(action)) {
      return apiBadRequest('Ungültige Aktion')
    }

    // Check if location exists
    const locationCheck = await query(`
      SELECT id, approval_status, name FROM ${TABLE_NAMES.LOCATIONS}
      WHERE id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = locationCheck.rows[0]

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

    // Start transaction
    const client = await query.getClient()

    try {
      await client.query('BEGIN')

      // Update location status
      await client.query(`
        UPDATE ${TABLE_NAMES.LOCATIONS}
        SET approval_status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newStatus, session.user.id, locationId])

      // Create approval record
      await client.query(`
        INSERT INTO ${TABLE_NAMES.LOCATION_APPROVALS} (
          location_id, reviewer_id, action, status, review_notes, required_changes
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        locationId,
        session.user.id,
        action,
        newStatus,
        review_notes || null,
        required_changes || []
      ])

      await client.query('COMMIT')

      // Send notification to location creator
      // TODO: Implement notification system

      return apiSuccess({
        message: `Ort erfolgreich ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : action === 'suspend' ? 'suspendiert' : 'wiederhergestellt'}`,
        location: {
          id: locationId,
          name: location.name,
          status: newStatus
        }
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}