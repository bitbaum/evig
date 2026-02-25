/**
 * GET /api/listings/mine — My listings (authenticated)
 *
 * Returns the current user's listings with optional status filter and pagination.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { LISTING_STATUSES, MARKETPLACE_LIMITS } from '@/config/marketplace';

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MARKETPLACE_LIMITS.MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('limit') || String(MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = ['l.seller_id = $1'];
    const params: unknown[] = [session.user.id];
    let paramIndex = 2;

    // Filter by status if provided (and valid)
    if (status && (LISTING_STATUSES as readonly string[]).includes(status)) {
      conditions.push(`l.status = $${paramIndex++}`);
      params.push(status);
    } else {
      // By default exclude removed
      conditions.push(`l.status != 'removed'`);
    }

    const whereClause = conditions.join(' AND ');

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
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
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
