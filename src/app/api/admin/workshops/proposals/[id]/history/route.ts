import { NextRequest } from 'next/server';
import { withAdmin } from '@/lib/api/middleware';
import { query } from '@/lib/auth/db';
import {
  apiError,
  apiSuccess,
  apiNotFound,
} from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { TABLE_NAMES } from '@/config/database';

import { logger } from '@/lib/logger';
import type { EditHistoryEntry } from '@/lib/admin/edit-utils';

/**
 * GET /api/admin/workshops/proposals/[id]/history
 * Fetch edit history for a workshop proposal
 */
export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  const { id: proposalId } = context!.params!;

  try {
    // Fetch only edit_history column
    const result = await query(
      `SELECT edit_history FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} WHERE id = $1`,
      [proposalId]
    );

    if (result.rows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    const history = (result.rows[0] as { edit_history: EditHistoryEntry[] | null }).edit_history || [];

    logger.info('Workshop proposal history fetched', {
      proposalId,
      adminId: session.user.id,
      entriesCount: history.length,
    });

    return apiSuccess({ history });
  } catch (error) {
    logger.error('Error fetching workshop proposal history', { error, proposalId });
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
})
