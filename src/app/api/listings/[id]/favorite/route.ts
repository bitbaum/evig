/**
 * POST /api/listings/[id]/favorite — Toggle favorite (authenticated)
 *
 * INSERT ON CONFLICT → DELETE pattern for toggle behavior.
 * Favorite counts are maintained by DB triggers.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { LISTING_STATUS } from '@/config/marketplace';

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const listingId = context?.params?.id;
    if (!listingId) return apiNotFound('Inserat');

    // Check listing exists and is active
    const listingResult = await query(
      `SELECT id FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status = $2`,
      [listingId, LISTING_STATUS.ACTIVE]
    );
    if (listingResult.rows.length === 0) return apiNotFound('Inserat');

    // Check if already favorited
    const existing = await query(
      `SELECT id FROM ${TABLE_NAMES.LISTING_FAVORITES} WHERE user_id = $1 AND listing_id = $2`,
      [session.user.id, listingId]
    );

    let favorited: boolean;

    if (existing.rows.length > 0) {
      // Remove favorite
      await query(
        `DELETE FROM ${TABLE_NAMES.LISTING_FAVORITES} WHERE user_id = $1 AND listing_id = $2`,
        [session.user.id, listingId]
      );
      favorited = false;
    } else {
      // Add favorite
      await query(
        `INSERT INTO ${TABLE_NAMES.LISTING_FAVORITES} (user_id, listing_id) VALUES ($1, $2)`,
        [session.user.id, listingId]
      );
      favorited = true;
    }

    // Get updated count
    const countResult = await query<{ favorite_count: number }>(
      `SELECT favorite_count FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1`,
      [listingId]
    );

    return apiSuccess({
      favorited,
      favorite_count: countResult.rows[0]?.favorite_count ?? 0,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren der Favoriten');
  }
});
