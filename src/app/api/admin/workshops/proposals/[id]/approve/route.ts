import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

interface ProposalRow {
  id: string
  user_id: string
  title: string
  description: string
  short_description: string | null
  category: string | null
  duration_minutes: number
  level: string
  max_participants: number
  min_participants: number
  price_cents: number
  prerequisites: string | null
  learning_objectives: string[] | null
  target_audience: string | null
  materials_provided: string | null
  materials_required: string | null
  proposed_date: string | null
  proposed_time: string | null
  selected_location_id: string | null
  proposed_location: string | null
  proposer_name: string
  proposer_email: string
}

interface WorkshopIdRow {
  id: string
}

// POST /api/admin/workshops/proposals/[id]/approve - Approve or reject workshop proposal
export const POST = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  const { id: proposalId } = context!.params!
  try {
    const body = await request.json()
    const { action, review_notes, required_changes } = body

    // Validate action
    if (!['approve', 'reject', 'require_changes'].includes(action)) {
      return apiBadRequest('Ungültige Aktion')
    }

    // Check if proposal exists
    const proposalCheck = await query(`
      SELECT wp.*, u.name as proposer_name, u.email as proposer_email
      FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} wp
      LEFT JOIN ${TABLE_NAMES.USERS} u ON wp.user_id = u.id
      WHERE wp.id = $1
    `, [proposalId])

    if (proposalCheck.rows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden')
    }

    const proposal = proposalCheck.rows[0] as ProposalRow

    // Determine new status based on action
    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'require_changes':
        newStatus = 'requires_changes'
        break
      default:
        return apiBadRequest('Ungültige Aktion')
    }

    // Use transaction with BEGIN/COMMIT
    await query('BEGIN')

    try {
      // Update proposal status
      await query(`
        UPDATE ${TABLE_NAMES.WORKSHOP_PROPOSALS}
        SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [newStatus, review_notes || null, session.user.id, proposalId])

      // If approved, create the actual workshop
      if (action === 'approve') {
        // Create workshop entry
        const workshopResult = await query(`
          INSERT INTO ${TABLE_NAMES.WORKSHOPS} (
            slug,
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
            featured_image,
            instructor_id,
            created_by,
            updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
          RETURNING id
        `, [
          `${proposal.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
          proposal.title,
          proposal.description,
          proposal.short_description,
          proposal.category,
          proposal.duration_minutes,
          proposal.level,
          proposal.max_participants,
          proposal.min_participants,
          proposal.price_cents,
          proposal.prerequisites,
          proposal.learning_objectives,
          proposal.target_audience,
          proposal.materials_provided,
          proposal.materials_required,
          null, // featured_image
          proposal.user_id, // instructor_id
          session.user.id, // created_by
          session.user.id  // updated_by
        ])

        const workshop = workshopResult.rows[0] as WorkshopIdRow

        // Create initial workshop instance if location is specified
        if (proposal.selected_location_id || proposal.proposed_location) {
          // Combine proposed_date and proposed_time into a proper timestamp
          let proposedDate: Date
          if (proposal.proposed_date) {
            const dateStr = typeof proposal.proposed_date === 'string'
              ? proposal.proposed_date
              : String(proposal.proposed_date)
            const timeStr = proposal.proposed_time || '09:00'
            proposedDate = new Date(`${dateStr}T${timeStr}`)
            // Fallback if parsing failed
            if (isNaN(proposedDate.getTime())) {
              proposedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          } else {
            proposedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
          const endDate = new Date(proposedDate.getTime() + proposal.duration_minutes * 60 * 1000)

          await query(`
            INSERT INTO ${TABLE_NAMES.WORKSHOP_INSTANCES} (
              workshop_id,
              start_date,
              end_date,
              location,
              location_details,
              max_participants,
              status,
              instructor_id,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            workshop.id,
            proposedDate,
            endDate,
            proposal.selected_location_id ? null : proposal.proposed_location,
            proposal.selected_location_id ? JSON.stringify({ location_id: proposal.selected_location_id }) : null,
            proposal.max_participants,
            proposal.user_id
          ])
        }
      }

      await query('COMMIT')

      // Send notification email to proposer
      try {
        if (action === 'approve') {
          await sendEmail(
            proposal.proposer_email,
            'workshopProposalApproved',
            proposal.proposer_name,
            proposal.title
          )
        } else if (action === 'reject') {
          await sendEmail(
            proposal.proposer_email,
            'workshopProposalRejected',
            proposal.proposer_name,
            proposal.title,
            review_notes || 'Kein Grund angegeben'
          )
        } else if (action === 'require_changes') {
          await sendEmail(
            proposal.proposer_email,
            'workshopProposalChangesRequested',
            proposal.proposer_name,
            proposal.title,
            required_changes || review_notes || ''
          )
        }
      } catch (emailError) {
        logger.warn('Failed to send workshop proposal email', { error: emailError, proposalId, action })
      }

      logger.info('Workshop proposal processed', {
        proposalId,
        action,
        newStatus,
        adminId: session.user.id
      })

      return apiSuccess({
        message: `Workshop-Vorschlag erfolgreich ${action === 'approve' ? 'genehmigt' : action === 'reject' ? 'abgelehnt' : 'zur Überarbeitung zurückgewiesen'}`,
        proposal: {
          id: proposalId,
          title: proposal.title,
          status: newStatus
        }
      })

    } catch (error) {
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})