/**
 * GET /api/listings/mine — My listings (authenticated)
 *
 * Returns the current user's listings with optional status filter and pagination.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, parsePagination } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { LISTING_STATUSES } from '@/config/marketplace';
import { QueryParams } from '@/lib/api/query-builder';

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const { limit, offset, page } = parsePagination(request, { defaultLimit: 20, maxLimit: 100 });

    const qb = new QueryParams();
    qb.add('l.seller_id = $P', session.user.id);

    // Filter by status if provided (and valid)
    if (status && (LISTING_STATUSES as readonly string[]).includes(status)) {
      qb.add('l.status = $P', status);
    } else {
      // By default exclude removed
      qb.addRaw("l.status != 'removed'");
    }

    const { where: whereClause, params, nextIndex } = qb.build('');

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.LISTINGS} l WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');
    const totalPages = Math.ceil(total / limit);

    // Get paginated items
    const result = await query(
      `SELECT
        l.id, l.title, l.price_chf, l.category, l.condition, l.status,
        l.view_count, l.favorite_count, l.created_at, l.updated_at,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
      FROM ${TABLE_NAMES.LISTINGS} l
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );

    return apiSuccess({
      items: result.rows,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden Ihrer Inserate');
  }
});
