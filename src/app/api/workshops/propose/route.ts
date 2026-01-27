import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
// ADMIN_ROLES removed - now using is_staff field

interface CountRow {
  count: string
}

interface LocationRow {
  id: string
  approval_status: string
}

interface ProposalIdRow {
  id: string
}

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

    const proposalCount = existingProposals.rows[0] as CountRow
    if (parseInt(proposalCount.count) >= 3) {
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

      const location = locationCheck.rows[0] as LocationRow
      if (location.approval_status !== 'approved') {
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

    const proposal = proposalResult.rows[0] as ProposalIdRow

    // Send confirmation email to proposer
    try {
      await sendEmail(
        session.user.email || '',
        'workshopProposalSubmitted',
        session.user.name || 'Workshop-Interessent',
        title,
        proposal.id
      )
    } catch (emailError) {
      logger.warn('Failed to send workshop proposal confirmation email', {
        proposalId: proposal.id,
        error: emailError
      })
    }

    // Send notification email to admins (staff users)
    try {
      const adminEmailsResult = await query(
        `SELECT email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true AND email IS NOT NULL`,
        []
      )
      const adminDashboardUrl = `${APP_URL}/admin/workshop-proposals`

      for (const admin of adminEmailsResult.rows as { email: string }[]) {
        await sendEmail(
          admin.email,
          'adminNewWorkshopProposal',
          session.user.name || 'Unbekannt',
          session.user.email || 'unbekannt@example.com',
          title,
          adminDashboardUrl
        )
      }
    } catch (adminEmailError) {
      logger.warn('Failed to send workshop proposal admin notification', {
        proposalId: proposal.id,
        error: adminEmailError
      })
    }

    return apiSuccess({
      message: 'Workshop-Vorschlag erfolgreich eingereicht',
      proposalId: proposal.id
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}