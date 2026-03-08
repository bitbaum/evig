/**
 * GET /api/listings/favorites — Get user's favorited listings
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { LISTING_STATUS } from '@/config/marketplace';

export const GET = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.LISTING_FAVORITES} f
       JOIN ${TABLE_NAMES.LISTINGS} l ON f.listing_id = l.id
       WHERE f.user_id = $1 AND l.status != $2`,
      [session.user.id, LISTING_STATUS.REMOVED]
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    const result = await query(
      `SELECT
        l.id, l.title, l.price_chf, l.category, l.condition,
        l.delivery_options, l.payment_mode, l.status, l.is_revampit,
        l.pickup_location, l.view_count, l.favorite_count, l.created_at,
        u.name as seller_name,
        sp.display_name as seller_display_name,
        sp.city as seller_city,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail,
        f.created_at as favorited_at
      FROM ${TABLE_NAMES.LISTING_FAVORITES} f
      JOIN ${TABLE_NAMES.LISTINGS} l ON f.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON l.seller_id = sp.user_id
      WHERE f.user_id = $1 AND l.status != $2
      ORDER BY f.created_at DESC
      LIMIT $3 OFFSET $4`,
      [session.user.id, LISTING_STATUS.REMOVED, limit, offset]
    );

    return apiSuccess({
      items: result.rows,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Favoriten');
  }
});
