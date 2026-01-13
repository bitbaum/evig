import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const formData = await request.json()

    // Extract form fields
    const {
      title,
      description,
      shortDescription,
      category,
      durationHours,
      level,
      maxParticipants,
      minParticipants,
      pricePerPerson,
      prerequisites,
      learningObjectives,
      targetAudience,
      materialsProvided,
      materialsRequired,
      locationType,
      selectedLocationId,
      proposedLocation,
      proposedDate,
      proposedTime,
      specialRequirements,
      termsAccepted
    } = formData

    // Validate required fields
    if (!title || !description || !shortDescription || !category ||
        !durationHours || !level || !maxParticipants || !minParticipants ||
        !pricePerPerson || !termsAccepted || !Array.isArray(learningObjectives) || learningObjectives.length === 0) {
      return apiBadRequest(ERROR_MESSAGES.ALL_FIELDS_REQUIRED)
    }

    // Check if user already has pending proposals (limit to prevent spam)
    const existingProposals = await query(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS}
       WHERE user_id = $1 AND status IN ('pending', 'approved') AND created_at > NOW() - INTERVAL '30 days'`,
      [session.user.id]
    )

    if (parseInt(existingProposals.rows[0].count) >= 3) {
      return apiBadRequest('Sie haben bereits 3 ausstehende oder genehmigte Workshop-Vorschläge. Bitte warten Sie auf deren Bearbeitung.')
    }

    // Calculate duration in minutes and price in cents
    const durationMinutes = parseInt(durationHours) * 60
    const priceCents = Math.round(parseFloat(pricePerPerson) * 100)

    // Validate selected location if provided
    if (selectedLocationId) {
      const locationCheck = await query(`
        SELECT id, approval_status FROM ${TABLE_NAMES.LOCATIONS} WHERE id = $1
      `, [selectedLocationId])

      if (locationCheck.rows.length === 0) {
        return apiBadRequest('Ausgewählter Ort existiert nicht')
      }

      if (locationCheck.rows[0].approval_status !== 'approved') {
        return apiBadRequest('Ausgewählter Ort ist nicht zur Buchung freigegeben')
      }
    }

    // Create workshop proposal
    const proposalResult = await query(`
      INSERT INTO ${TABLE_NAMES.WORKSHOP_PROPOSALS} (
        user_id,
        title,
        description,
        short_description,
        category,
        duration_minutes,
        level,
        max_participants,
        min_participants,
        price_cents,
        prerequisites,
        learning_objectives,
        target_audience,
        materials_provided,
        materials_required,
        location_type,
        selected_location_id,
        proposed_location,
        proposed_date,
        proposed_time,
        special_requirements,
        terms_accepted,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, 'pending'
      )
      RETURNING id
    `, [
      session.user.id,
      title,
      description,
      shortDescription,
      category,
      durationMinutes,
      level,
      parseInt(maxParticipants),
      parseInt(minParticipants),
      priceCents,
      prerequisites || null,
      learningObjectives,
      targetAudience || null,
      materialsProvided || null,
      materialsRequired || null,
      locationType,
      selectedLocationId || null,
      proposedLocation || null,
      proposedDate ? new Date(proposedDate) : null,
      proposedTime || null,
      specialRequirements || null,
      termsAccepted
    ])

    // TODO: Send notification email to admins for review
    // TODO: Send confirmation email to proposer

    return apiSuccess({
      message: SUCCESS_MESSAGES.WORKSHOP_PROPOSAL_SUBMITTED,
      proposalId: proposalResult.rows[0].id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}