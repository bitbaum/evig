import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { getUserRole } from '@/lib/api/role-checks'
import { isAdminRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

interface ProposalRow {
  id: string
  user_id: string
  title: string
  description: string
  short_description: string
  category: string
  duration_minutes: number
  level: string
  max_participants: number
  min_participants: number
  price_cents: number
  prerequisites: string[]
  learning_objectives: string[]
  target_audience: string
  materials_provided: string[]
  materials_required: string[]
  proposed_date: Date | null
  selected_location_id: string | null
  proposed_location: string | null
  proposer_name: string
  proposer_email: string
}

interface WorkshopIdRow {
  id: string
}

// POST /api/admin/workshops/proposals/[id]/approve - Approve or reject workshop proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user has approval permissions
    const userRole = await getUserRole(session.user.id)
    const hasApprovalPermission = isAdminRole(userRole) || userRole === 'moderator'

    if (!hasApprovalPermission) {
      return apiForbidden('Keine Berechtigung für Workshop-Genehmigungen')
    }
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
          const proposedDate = proposal.proposed_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
}