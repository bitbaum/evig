import { NextRequest } from 'next/server';
import { withAdmin } from '@/lib/api/middleware';
import { db } from '@/db';
import { workshopProposals, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  apiError,
  apiSuccess,
  apiBadRequest,
  apiNotFound,
} from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { APPROVAL_STATUS } from '@/config/approval-status';
import { logger } from '@/lib/logger';
import { createEditSnapshot, appendEditHistory } from '@/lib/admin/edit-utils';
import { WorkshopProposal } from '@/components/workshops/types';

const reviewer = alias(users, 'reviewer');
const editor = alias(users, 'editor');

/**
 * GET /api/admin/workshops/proposals/[id]
 * Fetch a single workshop proposal with full details
 */
export const GET = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  const { id: proposalId } = context!.params!;

  try {
    const [proposal] = await db
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
        locationType: workshopProposals.locationType,
        selectedLocationId: workshopProposals.selectedLocationId,
        proposedLocation: workshopProposals.proposedLocation,
        proposedDate: workshopProposals.proposedDate,
        proposedTime: workshopProposals.proposedTime,
        specialRequirements: workshopProposals.specialRequirements,
        termsAccepted: workshopProposals.termsAccepted,
        status: workshopProposals.status,
        adminNotes: workshopProposals.adminNotes,
        reviewedBy: workshopProposals.reviewedBy,
        reviewedAt: workshopProposals.reviewedAt,
        editHistory: workshopProposals.editHistory,
        lastEditedBy: workshopProposals.lastEditedBy,
        lastEditedAt: workshopProposals.lastEditedAt,
        createdAt: workshopProposals.createdAt,
        updatedAt: workshopProposals.updatedAt,
        proposer_name: users.name,
        proposer_email: users.email,
        reviewer_name: reviewer.name,
        editor_name: editor.name,
      })
      .from(workshopProposals)
      .leftJoin(users, eq(workshopProposals.userId, users.id))
      .leftJoin(reviewer, eq(workshopProposals.reviewedBy, reviewer.id))
      .leftJoin(editor, eq(workshopProposals.lastEditedBy, editor.id))
      .where(eq(workshopProposals.id, proposalId));

    if (!proposal) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    logger.info('Workshop proposal fetched', {
      proposalId,
      adminId: session.user.id,
    });

    return apiSuccess({ proposal });
  } catch (error) {
    logger.error('Error fetching workshop proposal', { error, proposalId });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
})

/**
 * PATCH /api/admin/workshops/proposals/[id]
 * Edit workshop proposal fields before approval
 */
export const PATCH = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  const { id: proposalId } = context!.params!;

  try {
    const body = await request.json();
    const { action, fields } = body;

    if (action !== 'edit') {
      return apiBadRequest(
        'Ungültige Aktion. Verwende /approve für Genehmigungsaktionen.'
      );
    }

    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return apiBadRequest('Keine Felder zum Bearbeiten angegeben');
    }

    // Fetch current proposal
    const [currentProposal] = await db
      .select()
      .from(workshopProposals)
      .where(eq(workshopProposals.id, proposalId));

    if (!currentProposal) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    // Only allow editing pending proposals
    if (currentProposal.status !== APPROVAL_STATUS.PENDING) {
      return apiBadRequest(
        `Vorschlag kann nicht bearbeitet werden (Status: ${currentProposal.status})`
      );
    }

    // Create edit snapshot
    const editorName = session.user.name || session.user.email || 'Admin';
    const editEntry = createEditSnapshot(
      currentProposal as unknown as WorkshopProposal,
      fields,
      session.user.id,
      editorName
    );

    if (editEntry.fields_changed.length === 0) {
      return apiSuccess({
        proposal: currentProposal,
        message: 'Keine Änderungen erkannt',
      });
    }

    const updatedHistory = appendEditHistory(
      currentProposal.editHistory as unknown as WorkshopProposal['edit_history'],
      editEntry
    );

    // Build dynamic update — map snake_case field names to camelCase Drizzle columns
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      short_description: 'shortDescription',
      category: 'category',
      duration_minutes: 'durationMinutes',
      level: 'level',
      max_participants: 'maxParticipants',
      min_participants: 'minParticipants',
      price_cents: 'priceCents',
      prerequisites: 'prerequisites',
      learning_objectives: 'learningObjectives',
      target_audience: 'targetAudience',
      materials_provided: 'materialsProvided',
      materials_required: 'materialsRequired',
      location_type: 'locationType',
      selected_location_id: 'selectedLocationId',
      proposed_location: 'proposedLocation',
      proposed_date: 'proposedDate',
      proposed_time: 'proposedTime',
      special_requirements: 'specialRequirements',
    };

    const updateSet: Record<string, unknown> = {};
    for (const [snakeField, value] of Object.entries(fields)) {
      const camelField = fieldMap[snakeField] || snakeField;
      updateSet[camelField] = value;
    }

    updateSet.editHistory = updatedHistory;
    updateSet.lastEditedBy = session.user.id;
    updateSet.lastEditedAt = sql`CURRENT_TIMESTAMP`;
    updateSet.updatedAt = sql`CURRENT_TIMESTAMP`;

    const [updated] = await db
      .update(workshopProposals)
      .set(updateSet)
      .where(eq(workshopProposals.id, proposalId))
      .returning();

    logger.info('Workshop proposal edited by admin', {
      proposalId,
      editorId: session.user.id,
      fieldsChanged: editEntry.fields_changed,
    });

    return apiSuccess({
      proposal: updated,
      message: 'Vorschlag erfolgreich aktualisiert',
    });
  } catch (error) {
    logger.error('Error editing workshop proposal', { error, proposalId });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
})
