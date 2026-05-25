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
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

// POST /api/admin/workshops/proposals/[id]/approve - Approve or reject workshop proposal
export const POST = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  const { id: proposalId } = context!.params!
  try {
    const body = await request.json()
    const { action, review_notes, required_changes } = body

    // Validate action
    if (!['approve', 'reject', 'require_changes'].includes(action)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_ACTION)
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
      return apiNotFound(ERROR_MESSAGES.WORKSHOP_PROPOSAL_NOT_FOUND)
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
        return apiBadRequest(ERROR_MESSAGES.INVALID_ACTION)
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
            proposalId: proposalId,
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

    // Send notification email to proposer. sendEmail RESOLVES with
    // {success:false,error} on SMTP/Listmonk failure rather than throwing,
    // so a bare try/catch only catches the rare exception path and silently
    // miscounts realistic failures. Matches the repairer-applications
    // approve/reject/request-changes pattern in d128beff/87f084af —
    // capture the result and check .success. Particularly important for
    // reject + require_changes here: those actions have NO in-app
    // notification fallback (only the approve branch fires notifyUsers
    // below), so a silently-failed email leaves the proposer with no
    // signal that their proposal was decided.
    try {
      let emailResult
      if (action === 'approve') {
        emailResult = await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalApproved',
          proposal.proposerName!,
          proposal.title
        )
      } else if (action === 'reject') {
        emailResult = await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalRejected',
          proposal.proposerName!,
          proposal.title,
          review_notes || 'Kein Grund angegeben'
        )
      } else if (action === 'require_changes') {
        emailResult = await sendEmail(
          proposal.proposerEmail!,
          'workshopProposalChangesRequested',
          proposal.proposerName!,
          proposal.title,
          required_changes || review_notes || ''
        )
      }
      if (emailResult && !emailResult.success) {
        logger.warn('Workshop proposal notification email failed (resolved)', {
          proposalId,
          action,
          error: emailResult.error,
        })
      }
    } catch (emailError) {
      logger.warn('Workshop proposal notification email failed (rejected)', { error: emailError, proposalId, action })
    }

    // In-app notification for the proposer
    if (proposal.userId && action === 'approve') {
      notifyUsers([proposal.userId], {
        type: NOTIFICATION_TYPES.WORKSHOP_PROPOSAL_APPROVED,
        title: 'Workshop-Vorschlag angenommen',
        content: `Dein Vorschlag «${proposal.title}» wurde angenommen und als Workshop erstellt.`,
        related_type: RELATED_TYPES.WORKSHOP_PROPOSAL,
        related_id: proposalId,
      }).catch(() => {})
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
