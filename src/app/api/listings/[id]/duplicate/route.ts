/**
 * POST /api/listings/[id]/duplicate — Duplicate a listing as draft
 *
 * Copies listing fields and specs (not images) with status=draft.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingSpecs } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { logger } from '@/lib/logger';

type RouteContext = { params?: { id: string } };

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    // Verify ownership + fetch listing fields to copy
    const [listing] = await db
      .select({
        sellerId: listings.sellerId,
        title: listings.title,
        description: listings.description,
        priceChf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        brand: listings.brand,
        model: listings.model,
        deliveryOptions: listings.deliveryOptions,
        shippingCostChf: listings.shippingCostChf,
        pickupLocation: listings.pickupLocation,
        paymentMode: listings.paymentMode,
        conditionChecks: listings.conditionChecks,
      })
      .from(listings)
      .where(and(eq(listings.id, id), ne(listings.status, 'removed')));

    if (!listing) return apiNotFound('Inserat');

    if (listing.sellerId !== session.user.id) {
      return apiForbidden('Nur der Eigentümer kann dieses Inserat duplizieren');
    }

    const newId = await db.transaction(async (tx) => {
      // Create duplicate listing as draft
      const [newListing] = await tx
        .insert(listings)
        .values({
          sellerId: session.user.id,
          title: listing.title + ' (Kopie)',
          description: listing.description,
          priceChf: listing.priceChf,
          category: listing.category,
          condition: listing.condition,
          brand: listing.brand,
          model: listing.model,
          deliveryOptions: listing.deliveryOptions,
          shippingCostChf: listing.shippingCostChf,
          pickupLocation: listing.pickupLocation,
          paymentMode: listing.paymentMode,
          status: 'draft',
          conditionChecks: listing.conditionChecks,
        })
        .returning({ id: listings.id });

      const duplicatedId = newListing.id;

      // Copy specs from original listing
      const originalSpecs = await tx
        .select({
          specKey: listingSpecs.specKey,
          specValue: listingSpecs.specValue,
          specUnit: listingSpecs.specUnit,
          normalizedValue: listingSpecs.normalizedValue,
        })
        .from(listingSpecs)
        .where(eq(listingSpecs.listingId, id));

      if (originalSpecs.length > 0) {
        await tx
          .insert(listingSpecs)
          .values(
            originalSpecs.map(spec => ({
              listingId: duplicatedId,
              specKey: spec.specKey,
              specValue: spec.specValue,
              specUnit: spec.specUnit,
              normalizedValue: spec.normalizedValue,
            }))
          );
      }

      return duplicatedId;
    });

    logger.info('Listing duplicated', {
      originalId: id,
      newId,
      userId: session.user.id,
    });

    return apiSuccess({ id: newId });
  } catch (error) {
    return apiError(error, 'Fehler beim Duplizieren des Inserats');
  }
});
