import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { query } from '@/lib/auth/db';
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages';
import { TABLE_NAMES } from '@/config/database';
import { getUserRole } from '@/lib/api/role-checks';
import { isAdminRole, ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/workshops/proposals/[id]/history
 * Fetch edit history for a workshop proposal
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

    // Check if user has admin/moderator permissions
    const userRole = await getUserRole(session.user.id);
    const hasPermission = isAdminRole(userRole) || userRole === ROLES.MODERATOR;

    if (!hasPermission) {
      return apiForbidden('Keine Berechtigung zum Anzeigen des Bearbeitungsverlaufs');
    }

    // Fetch only edit_history column
    const result = await query(
      `SELECT edit_history FROM ${TABLE_NAMES.WORKSHOP_PROPOSALS} WHERE id = $1`,
      [proposalId]
    );

    if (result.rows.length === 0) {
      return apiNotFound('Workshop-Vorschlag nicht gefunden');
    }

    const history = (result.rows[0] as { edit_history: any }).edit_history || [];

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
}
