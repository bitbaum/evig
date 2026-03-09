/**
 * GET /api/listings/similar?listing_id=X&limit=4
 *
 * Returns similar listings based on same category and similar price range.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiBadRequest, parsePagination } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { LISTING_STATUS } from '@/config/marketplace';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const { limit } = parsePagination(request, { defaultLimit: 4, maxLimit: 12 });

    if (!listingId) return apiBadRequest('listing_id ist erforderlich');

    // Get the source listing for comparison
    const sourceResult = await query<{ category: string; price_chf: number }>(
      `SELECT category, price_chf FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1`,
      [listingId]
    );

    if (sourceResult.rows.length === 0) {
      return apiSuccess([]);
    }

    const { category, price_chf } = sourceResult.rows[0];
    const priceRange = Number(price_chf) * 0.5; // +-50% price range

    const result = await query(
      `SELECT
        l.id, l.title, l.price_chf, l.category, l.condition,
        l.view_count, l.favorite_count, l.created_at,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
      FROM ${TABLE_NAMES.LISTINGS} l
      WHERE l.id != $1
        AND l.status = $2
        AND l.category = $3
        AND l.price_chf BETWEEN $4 AND $5
      ORDER BY l.view_count DESC
      LIMIT $6`,
      [listingId, LISTING_STATUS.ACTIVE, category, Math.max(0, Number(price_chf) - priceRange), Number(price_chf) + priceRange, limit]
    );

    return apiSuccess(result.rows);
  } catch (error) {
    return apiError(error, 'Fehler beim Laden ähnlicher Inserate');
  }
}
