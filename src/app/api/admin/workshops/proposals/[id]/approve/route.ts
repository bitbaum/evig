import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopProposals, workshops, workshopInstances, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email'

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
    const proposalRows = await db
      .select({
        id: workshopProposals.id,
        userId: workshopProposals.userId,
        title: workshopProposals.title,
        description: workshopProposals.description,
        shortDescription: workshopProposals.shortDescription,
        category: workshopProposals.category,
        durationMinutes: workshopProposals.durationMinutes,
        level: workshopProposals.level,
        maxParticipants: workshopProposals.maxParticipants,
        minParticipants: workshopProposals.minParticipants,
        priceCents: workshopProposals.priceCents,
        prerequisites: workshopProposals.prerequisites,
        learningObjectives: workshopProposals.learningObjectives,
        targetAudience: workshopProposals.targetAudience,
        materialsProvided: workshopProposals.materialsProvided,
        materialsRequired: workshopProposals.materialsRequired,
        proposedDate: workshopProposals.proposedDate,
        proposedTime: workshopProposals.proposedTime,
        selectedLocationId: workshopProposals.selectedLocationId,
        proposedLocation: workshopProposals.proposedLocation,
        proposerName: users.name,
        proposerEmail: users.email,
      })
      .from(workshopProposals)
      .leftJoin(users, eq(workshopProposals.userId, users.id))
      .where(eq(workshopProposals.id, proposalId))

    if (proposalRows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden')
    }

    const proposal = proposalRows[0]

    // Determine new status based on action
    let newStatus: string
    switch (action) {
      case 'approve':
        newStatus = APPROVAL_STATUS.APPROVED
        break
      case 'reject':
        newStatus = APPROVAL_STATUS.REJECTED
        break
      case 'require_changes':
        newStatus = APPROVAL_STATUS.REQUIRES_CHANGES
        break
      default:
        return apiBadRequest('Ungültige Aktion')
    }

    // Use Drizzle transaction
    await db.transaction(async (tx) => {
      // Update proposal status
      await tx
        .update(workshopProposals)
        .set({
          status: newStatus,
          adminNotes: review_notes || null,
          reviewedBy: session.user.id,
          reviewedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(workshopProposals.id, proposalId))

      // If approved, create the actual workshop
      if (action === 'approve') {
        // Create workshop entry
        const [workshop] = await tx
          .insert(workshops)
          .values({
            slug: `${proposal.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
            title: proposal.title,
            description: proposal.description,
            shortDescription: proposal.shortDescription,
            category: proposal.category,
            durationMinutes: proposal.durationMinutes,
            level: proposal.level,
            maxParticipants: proposal.maxParticipants,
            minParticipants: proposal.minParticipants,
            priceCents: proposal.priceCents,
            prerequisites: proposal.prerequisites,
            learningObjectives: proposal.learningObjectives,
            targetAudience: proposal.targetAudience,
            materialsProvided: proposal.materialsProvided,
            materialsRequired: proposal.materialsRequired,
            featuredImage: null,
            instructorId: proposal.userId,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })
          .returning({ id: workshops.id })

        // Create initial workshop instance if location is specified
        if (proposal.selectedLocationId || proposal.proposedLocation) {
          // Combine proposed_date and proposed_time into a proper timestamp
          let proposedDate: Date
          if (proposal.proposedDate) {
            const dateStr = typeof proposal.proposedDate === 'string'
              ? proposal.proposedDate
              : String(proposal.proposedDate)
            const timeStr = proposal.proposedTime || '09:00'
            proposedDate = new Date(`${dateStr}T${timeStr}`)
            // Fallback if parsing failed
            if (isNaN(proposedDate.getTime())) {
              proposedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          } else {
            proposedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
          const endDate = new Date(proposedDate.getTime() + proposal.durationMinutes * 60 * 1000)

          await tx
            .insert(workshopInstances)
            .values({
              workshopId: workshop.id,
              startDate: proposedDate.toISOString(),
              endDate: endDate.toISOString(),
              location: proposal.selectedLocationId ? null : proposal.proposedLocation,
              locationDetails: proposal.selectedLocationId ? JSON.stringify({ location_id: proposal.selectedLocationId }) : null,
              maxParticipants: proposal.maxParticipants,
              status: WORKSHOP_INSTANCE_STATUS.SCHEDULED,
              instructorId: proposal.userId,
            })
        }
      }
    })

    // Send notification email to proposer
    try {
      if (action === 'approve') {
        await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalApproved',
          proposal.proposerName!,
          proposal.title
        )
      } else if (action === 'reject') {
        await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalRejected',
          proposal.proposerName!,
          proposal.title,
          review_notes || 'Kein Grund angegeben'
        )
      } else if (action === 'require_changes') {
        await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalChangesRequested',
          proposal.proposerName!,
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
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
