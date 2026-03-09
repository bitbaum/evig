/**
 * POST /api/listings/[id]/report — Report a listing
 *
 * Authenticated users can report a listing once (UNIQUE constraint).
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingReports } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { validateBody, ReportListingSchema } from '@/lib/schemas';

type RouteContext = { params?: { id: string } };

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    const body = await request.json();
    const validation = validateBody(ReportListingSchema, body);
    if (!validation.success) return validation.error;
    const { reason, details } = validation.data;

    // Check listing exists and is active
    const [listing] = await db
      .select({ sellerId: listings.sellerId })
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.status, 'active')));
    if (!listing) return apiNotFound('Inserat');

    // Prevent self-report
    if (listing.sellerId === session.user.id) {
      return apiBadRequest('Sie können Ihr eigenes Inserat nicht melden');
    }

    // Insert report (UNIQUE constraint prevents duplicates)
    try {
      await db
        .insert(listingReports)
        .values({
          listingId: id,
          reporterId: session.user.id,
          reason,
          details: details || undefined,
        });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505') {
        return apiBadRequest('Sie haben dieses Inserat bereits gemeldet');
      }
      throw err;
    }

    logger.info('Listing reported', {
      listingId: id,
      reporterId: session.user.id,
      reason,
    });

    return apiSuccess({ reported: true });
  } catch (error) {
    return apiError(error, 'Fehler beim Melden des Inserats');
  }
});
