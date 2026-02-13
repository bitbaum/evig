import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/auth/db';
import {
  apiError,
  apiSuccess,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { createEditSnapshot, appendEditHistory } from '@/lib/admin/edit-utils';
import { WorkshopProposal } from '@/components/workshops/types';

/**
 * GET /api/admin/workshops/proposals/[id]
 * Fetch a single workshop proposal with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Check if user is staff (admin/super admin)
    // Using new simplified permission system (is_staff field)
    if (!session.user.isStaff) {
      return apiForbidden('Keine Berechtigung zum Anzeigen von Vorschlägen');
    }

    // Fetch proposal with submitter info
    const result = await query(
      `
      SELECT
        wp.*,
        u.name as proposer_name,
        u.email as proposer_email,
        reviewer.name as reviewer_name,
        editor.name as editor_name
      FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} wp
      LEFT JOIN ${TABLE_NAMES.USERS} u ON wp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USERS} reviewer ON wp.reviewed_by = reviewer.id
      LEFT JOIN ${TABLE_NAMES.USERS} editor ON wp.last_edited_by = editor.id
      WHERE wp.id = $1
      `,
      [proposalId]
    );

    if (result.rows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    const proposal = result.rows[0];

    logger.info('Workshop proposal fetched', {
      proposalId,
      adminId: session.user.id,
    });

    return apiSuccess({ proposal });
  } catch (error) {
    logger.error('Error fetching workshop proposal', { error, proposalId });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PATCH /api/admin/workshops/proposals/[id]
 * Edit workshop proposal fields before approval
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Check if user is staff (admin/super admin)
    // Using new simplified permission system (is_staff field)
    if (!session.user.isStaff) {
      return apiForbidden('Keine Berechtigung zum Bearbeiten von Vorschlägen');
    }

    const body = await request.json();
    const { action, fields } = body;

    // Validate action
    if (action !== 'edit') {
      return apiBadRequest(
        'Ungültige Aktion. Verwenden Sie /approve für Genehmigungsaktionen.'
      );
    }

    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return apiBadRequest('Keine Felder zum Bearbeiten angegeben');
    }

    // Fetch current proposal
    const currentResult = await query(
      `SELECT * FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} WHERE id = $1`,
      [proposalId]
    );

    if (currentResult.rows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    const currentProposal = currentResult.rows[0] as WorkshopProposal;

    // Only allow editing pending proposals
    if (currentProposal.status !== 'pending') {
      return apiBadRequest(
        `Vorschlag kann nicht bearbeitet werden (Status: ${currentProposal.status})`
      );
    }

    // Create edit snapshot
    const editorName = session.user.name || session.user.email || 'Admin';
    const editEntry = createEditSnapshot(
      currentProposal,
      fields,
      session.user.id,
      editorName
    );

    // Only create entry if there are actual changes
    if (editEntry.fields_changed.length === 0) {
      return apiSuccess({
        proposal: currentProposal,
        message: 'Keine Änderungen erkannt',
      });
    }

    const updatedHistory = appendEditHistory(currentProposal.edit_history, editEntry);

    // Build dynamic UPDATE query
    const updateFields = Object.keys(fields);
    const setClause = updateFields
      .map((field, idx) => `${field} = $${idx + 2}`)
      .join(', ');
    const values = [proposalId, ...updateFields.map((f) => fields[f])];

    const updateQuery = `
      UPDATE ${TABLE_NAMES.WORKSHOP_PROPOSALS}
      SET ${setClause},
          edit_history = $${values.length + 1},
          last_edited_by = $${values.length + 2},
          last_edited_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const updateResult = await query(updateQuery, [
      ...values,
      JSON.stringify(updatedHistory),
      session.user.id,
    ]);

    logger.info('Workshop proposal edited by admin', {
      proposalId,
      editorId: session.user.id,
      fieldsChanged: editEntry.fields_changed,
    });

    return apiSuccess({
      proposal: updateResult.rows[0],
      message: 'Vorschlag erfolgreich aktualisiert',
    });
  } catch (error) {
    logger.error('Error editing workshop proposal', { error, proposalId });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
}
