/**
 * POST /api/listings/[id]/favorite — Toggle favorite (authenticated)
 *
 * INSERT ON CONFLICT → DELETE pattern for toggle behavior.
 * Favorite counts are maintained by DB triggers.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingFavorites } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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
    const [listing] = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.status, LISTING_STATUS.ACTIVE)));
    if (!listing) return apiNotFound('Inserat');

    // Check if already favorited
    const [existing] = await db
      .select({ id: listingFavorites.id })
      .from(listingFavorites)
      .where(and(
        eq(listingFavorites.userId, session.user.id),
        eq(listingFavorites.listingId, listingId)
      ));

    let favorited: boolean;

    if (existing) {
      // Remove favorite
      await db
        .delete(listingFavorites)
        .where(and(
          eq(listingFavorites.userId, session.user.id),
          eq(listingFavorites.listingId, listingId)
        ));
      favorited = false;
    } else {
      // Add favorite
      await db
        .insert(listingFavorites)
        .values({ userId: session.user.id, listingId });
      favorited = true;
    }

    // Get updated count
    const [countRow] = await db
      .select({ favoriteCount: listings.favoriteCount })
      .from(listings)
      .where(eq(listings.id, listingId));

    return apiSuccess({
      favorited,
      favorite_count: countRow?.favoriteCount ?? 0,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren der Favoriten');
  }
});
