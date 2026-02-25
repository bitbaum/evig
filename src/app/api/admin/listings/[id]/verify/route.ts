/**
 * POST /api/admin/listings/[id]/verify — Admin: mark listing as verified
 * DELETE /api/admin/listings/[id]/verify — Admin: remove verification
 *
 * Only staff members can verify listings (RevampIT workshop-tested items).
 */

import { NextRequest } from 'next/server';
import { withAdmin, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { validateBody, VerifyListingSchema } from '@/lib/schemas';

type RouteContext = { params?: { id: string } };

// ============================================================================
// POST — Verify listing
// ============================================================================

export const POST = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    const body = await request.json();
    const validation = validateBody(VerifyListingSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Check listing exists
    const existing = await query(
      `SELECT id, status FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status != 'removed'`,
      [id]
    );
    if (existing.rows.length === 0) return apiNotFound('Inserat');

    // Set verification
    await query(
      `UPDATE ${TABLE_NAMES.LISTINGS}
       SET verified_at = NOW(), verified_by = $1, verification_notes = $2
       WHERE id = $3`,
      [session.user.id, data.verification_notes || null, id]
    );

    logger.info('Listing verified', { listingId: id, verifiedBy: session.user.id });

    return apiSuccess({ id, verified: true });
  } catch (error) {
    return apiError(error, 'Fehler beim Verifizieren des Inserats');
  }
});

// ============================================================================
// DELETE — Remove verification
// ============================================================================

export const DELETE = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    await query(
      `UPDATE ${TABLE_NAMES.LISTINGS}
       SET verified_at = NULL, verified_by = NULL, verification_notes = NULL
       WHERE id = $1`,
      [id]
    );

    logger.info('Listing verification removed', { listingId: id, removedBy: session.user.id });

    return apiSuccess({ id, verified: false });
  } catch (error) {
    return apiError(error, 'Fehler beim Entfernen der Verifizierung');
  }
});
