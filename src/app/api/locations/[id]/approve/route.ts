import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { locations, locationApprovals, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { LOCATION_STATUS } from '@/config/location-status'
import { validateBody, ApproveLocationSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

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
    if (!session.user.isStaff) {
      return apiForbidden('Keine Berechtigung für Genehmigungen')
    }
    const body = await request.json()
    const validation = validateBody(ApproveLocationSchema, body)
    if (!validation.success) return validation.error
    const { action, review_notes, required_changes } = validation.data

    // Check if location exists and get creator info
    const [locationRow] = await db
      .select({
        id: locations.id,
        approvalStatus: locations.approvalStatus,
        name: locations.name,
        createdBy: locations.createdBy,
      })
      .from(locations)
      .where(eq(locations.id, locationId))

    if (!locationRow) {
      return apiNotFound('Ort nicht gefunden')
    }

    // Valid status transitions
    const VALID_TRANSITIONS: Record<string, Record<string, string>> = {
      [LOCATION_STATUS.PENDING]:   { approve: LOCATION_STATUS.APPROVED, reject: LOCATION_STATUS.REJECTED },
      [LOCATION_STATUS.APPROVED]:  { suspend: LOCATION_STATUS.SUSPENDED },
      [LOCATION_STATUS.REJECTED]:  { approve: LOCATION_STATUS.APPROVED },
      [LOCATION_STATUS.SUSPENDED]: { reinstate: LOCATION_STATUS.APPROVED },
    }

    const currentStatus = locationRow.approvalStatus ?? LOCATION_STATUS.PENDING
    const transitions = VALID_TRANSITIONS[currentStatus]
    if (!transitions || !(action in transitions)) {
      return apiBadRequest(
        `Ungültiger Übergang: "${currentStatus}" kann nicht mit Aktion "${action}" geändert werden`
      )
    }

    const newStatus = transitions[action]

    // Execute in transaction
    await db.transaction(async (tx) => {
      // Update location status
      await tx
        .update(locations)
        .set({
          approvalStatus: newStatus,
          approvedBy: session.user.id,
          approvedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(locations.id, locationId))

      // Create approval record
      await tx
        .insert(locationApprovals)
        .values({
          locationId,
          reviewerId: session.user.id,
          action,
          status: newStatus,
          reviewNotes: review_notes || null,
          requiredChanges: required_changes || [],
        })
    })

    // Send notification to location creator
    if (locationRow.createdBy) {
      try {
        const [creator] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, locationRow.createdBy))

        if (creator?.email) {
          await sendEmail(
            creator.email,
            'locationApprovalNotification',
            creator.name || 'Benutzer',
            locationRow.name,
            action,
            review_notes || null
          )
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
        name: locationRow.name,
        status: newStatus
      }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
