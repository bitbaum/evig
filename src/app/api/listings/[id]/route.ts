/**
 * GET /api/listings/[id]  — Public detail (increments view count)
 * PATCH /api/listings/[id] — Owner only: update listing
 * DELETE /api/listings/[id] — Owner or admin: soft delete
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages, listingSpecs, users, sellerProfiles } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { validateBody, UpdateListingSchema } from '@/lib/schemas';
import { LISTING_STATUS, normalizeSpecValue } from '@/config/marketplace';
import { getListingDetail, isListingFavorited, incrementListingView } from '@/lib/marketplace/listing-detail';
import { indexListing, removeListing, type MeilisearchDocument } from '@/lib/search/meilisearch';
import { buildMeiliSpecs } from '@/lib/marketplace/listing-helpers';
import type { NewListing } from '@/db/schema/marketplace';

// ============================================================================
// GET — Public detail
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return apiNotFound('Inserat');

    // Increment view count (fire and forget)
    incrementListingView(id);

    // Shared SSOT fetch (used by the server-rendered detail page too). Session
    // is only needed for the viewer-specific favourite flag.
    const [listing, session] = await Promise.all([getListingDetail(id), auth()]);
    if (!listing) return apiNotFound('Inserat');

    const is_favorited = session?.user?.id
      ? await isListingFavorited(session.user.id, id)
      : false;

    return apiSuccess({ ...listing, is_favorited });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Inserats');
  }
}

// ============================================================================
// Map from UpdateListingSchema snake_case keys to Drizzle camelCase columns
// ============================================================================

const FIELD_MAP: Record<string, keyof NewListing> = {
  title: 'title',
  description: 'description',
  price_chf: 'priceChf',
  category: 'category',
  condition: 'condition',
  brand: 'brand',
  model: 'model',
  delivery_options: 'deliveryOptions',
  shipping_cost_chf: 'shippingCostChf',
  pickup_location: 'pickupLocation',
  payment_mode: 'paymentMode',
  status: 'status',
};

// ============================================================================
// PATCH — Update listing (owner only)
// ============================================================================

export const PATCH = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    // Check ownership + current status. Status is required for the
    // owner-status-transition gate below (see comment near the gate).
    const [owner] = await db
      .select({ sellerId: listings.sellerId, currentStatus: listings.status })
      .from(listings)
      .where(and(eq(listings.id, id), ne(listings.status, LISTING_STATUS.REMOVED)));
    if (!owner) return apiNotFound('Inserat');
    if (owner.sellerId !== session.user.id) {
      return apiForbidden('Nur der Eigentümer kann dieses Inserat bearbeiten');
    }

    const body = await request.json();
    const validation = validateBody(UpdateListingSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Owner-driven status transitions are constrained to {DRAFT, ACTIVE}.
    // RESERVED, SOLD, and REMOVED are system-driven states:
    //
    // - RESERVED is set when a marketplace order is created; clearing it
    //   back to ACTIVE happens via the Payrexx cancellation webhook
    //   (handleMarketplacePayment CANCELLED in payment-webhook.ts).
    // - SOLD is set by payment confirmation (RESERVED → SOLD on the
    //   buyer's successful payment).
    // - REMOVED is set by the DELETE endpoint (soft-delete).
    //
    // Without this gate an owner could:
    //   (a) self-mark ACTIVE → SOLD to take the listing off-book,
    //       bypassing the marketplace order + payment flow entirely;
    //   (b) flip RESERVED → ACTIVE while a buyer's order is mid-flight,
    //       enabling a double-sale where two buyers each believe they
    //       have a valid order on the same listing;
    //   (c) self-set REMOVED without going through the DELETE endpoint's
    //       Meilisearch + audit-log paths.
    //
    // Both the current status AND the target status must be in the
    // owner-manageable set — blocks both directions of the double-sale
    // and off-book attacks. A regular non-status PATCH (e.g. updating
    // title/description) is still allowed on RESERVED/SOLD listings —
    // only the `status` field is gated.
    if (data.status !== undefined) {
      const OWNER_MANAGEABLE_STATUSES: string[] = [
        LISTING_STATUS.DRAFT,
        LISTING_STATUS.ACTIVE,
      ];
      if (
        !OWNER_MANAGEABLE_STATUSES.includes(owner.currentStatus) ||
        !OWNER_MANAGEABLE_STATUSES.includes(data.status)
      ) {
        return apiForbidden(
          'Nur Entwurf und Aktiv können vom Eigentümer gesetzt werden. Reserviert, Verkauft und Entfernt werden vom System verwaltet.'
        );
      }
    }

    // Extract images and specs separately
    const { images, specs, condition_checks, ...updateFields } = data;

    await db.transaction(async (tx) => {
      // Build Drizzle set object from validated fields
      const setValues: Partial<NewListing> = {};

      for (const [key, value] of Object.entries(updateFields)) {
        if (value === undefined) continue;
        const drizzleKey = FIELD_MAP[key];
        if (drizzleKey) {
          // Decimal fields need string conversion
          if (drizzleKey === 'priceChf' || drizzleKey === 'shippingCostChf') {
            (setValues as Record<string, unknown>)[drizzleKey] = value != null ? String(value) : null;
          } else {
            (setValues as Record<string, unknown>)[drizzleKey] = value;
          }
        }
      }

      // Add condition_checks if provided
      if (condition_checks !== undefined) {
        setValues.conditionChecks = condition_checks ? condition_checks : null;
      }

      if (Object.keys(setValues).length > 0) {
        await tx
          .update(listings)
          .set(setValues)
          .where(eq(listings.id, id));
      }

      // Replace images if provided
      if (images && images.length > 0) {
        await tx
          .delete(listingImages)
          .where(eq(listingImages.listingId, id));
        await tx
          .insert(listingImages)
          .values(
            images.map((url, position) => ({
              listingId: id,
              url,
              position,
              isPrimary: position === 0,
            }))
          );
      }

      // Replace specs if provided
      if (specs !== undefined) {
        await tx
          .delete(listingSpecs)
          .where(eq(listingSpecs.listingId, id));

        if (specs.length > 0) {
          const specValues = specs
            .filter(spec => spec.value.trim())
            .map(spec => ({
              listingId: id,
              specKey: spec.key,
              specValue: spec.value,
              specUnit: spec.unit || null,
              normalizedValue: normalizeSpecValue(spec.key, spec.value)?.toString() ?? null,
            }));
          if (specValues.length > 0) {
            await tx.insert(listingSpecs).values(specValues);
          }
        }
      }
    });

    logger.info('Listing updated', { listingId: id, userId: session.user.id });

    // Fire-and-forget: update Meilisearch index
    if (data.status === LISTING_STATUS.REMOVED || data.status === LISTING_STATUS.SOLD || data.status === LISTING_STATUS.DRAFT) {
      removeListing(id).catch(err => logger.error('Failed to remove listing from Meilisearch', { error: err, listingId: id }));
    } else {
      // Fetch listing data for Meilisearch using Drizzle
      db.select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        brand: listings.brand,
        model: listings.model,
        category: listings.category,
        condition: listings.condition,
        price_chf: listings.priceChf,
        delivery_options: listings.deliveryOptions,
        payment_mode: listings.paymentMode,
        status: listings.status,
        is_revampit: listings.isRevampit,
        pickup_location: listings.pickupLocation,
        view_count: listings.viewCount,
        favorite_count: listings.favoriteCount,
        created_at: listings.createdAt,
        verified_at: listings.verifiedAt,
        seller_name: users.name,
        seller_city: sellerProfiles.city,
        thumbnail: sql<string | null>`(
          SELECT ${listingImages.url} FROM ${listingImages}
          WHERE ${listingImages.listingId} = ${listings.id}
            AND ${listingImages.isPrimary} = true
          LIMIT 1
        )`,
      })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .leftJoin(sellerProfiles, eq(listings.sellerId, sellerProfiles.userId))
        .where(and(eq(listings.id, id), eq(listings.status, LISTING_STATUS.ACTIVE)))
        .then(async (rows) => {
          if (rows[0]) {
            const row = rows[0];
            // Fetch specs for Meilisearch
            const specsRes = await db
              .select({
                spec_key: listingSpecs.specKey,
                spec_value: listingSpecs.specValue,
              })
              .from(listingSpecs)
              .where(eq(listingSpecs.listingId, id));
            const specInputs = specsRes.map(s => ({ key: s.spec_key, value: s.spec_value }));
            const meiliSpecs = buildMeiliSpecs(specInputs);
            indexListing({
              ...row,
              price_chf: Number(row.price_chf),
              is_verified: !!row.verified_at,
              ...meiliSpecs,
            } as MeilisearchDocument).catch(err => logger.error('Failed to index listing in Meilisearch', { error: err, listingId: id }));
          }
        })
        .catch(err => logger.error('Failed to fetch listing for Meilisearch index', { error: err, listingId: id }));
    }

    return apiSuccess({ id });
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Inserats');
  }
});

// ============================================================================
// DELETE — Soft delete (owner or admin)
// ============================================================================

export const DELETE = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    const [owner] = await db
      .select({ sellerId: listings.sellerId })
      .from(listings)
      .where(and(eq(listings.id, id), ne(listings.status, LISTING_STATUS.REMOVED)));
    if (!owner) return apiNotFound('Inserat');

    const isOwner = owner.sellerId === session.user.id;

    // Check admin access for non-owners
    if (!isOwner) {
      if (!session.user.isStaff) {
        return apiForbidden('Nur der Eigentümer oder ein Admin kann dieses Inserat löschen');
      }
    }

    await db
      .update(listings)
      .set({ status: LISTING_STATUS.REMOVED })
      .where(eq(listings.id, id));

    // Fire-and-forget: remove from Meilisearch
    removeListing(id).catch(err => logger.error('Failed to remove listing from Meilisearch', { error: err, listingId: id }));

    logger.info('Listing removed', { listingId: id, userId: session.user.id, isOwner });
    return apiSuccess({ id, status: 'removed' });
  } catch (error) {
    return apiError(error, 'Fehler beim Löschen des Inserats');
  }
});
