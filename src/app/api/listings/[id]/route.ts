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
import { listings, listingImages, listingSpecs, listingFavorites, users, sellerProfiles } from '@/db/schema';
import { eq, and, ne, asc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { validateBody, UpdateListingSchema } from '@/lib/schemas';
import { LISTING_STATUS, normalizeSpecValue } from '@/config/marketplace';
import { isStaffEmail } from '@/lib/permissions';
import { indexListing, removeListing, type MeilisearchDocument } from '@/lib/search/meilisearch';
import { buildMeiliSpecs } from '@/lib/marketplace/listing-helpers';
import type { NewListing } from '@/db/schema/marketplace';

type RouteContext = { params?: { id: string } };

// ============================================================================
// GET — Public detail
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = context.params ? await context.params : undefined;
    const id = resolvedParams?.id;
    if (!id) return apiNotFound('Inserat');

    // Increment view count (fire and forget)
    db.update(listings)
      .set({ viewCount: sql`${listings.viewCount} + 1` })
      .where(and(eq(listings.id, id), eq(listings.status, LISTING_STATUS.ACTIVE)))
      .catch(err => logger.error('Failed to increment view count', { error: err, listingId: id }));

    // Fetch listing with seller info
    const [listing] = await db
      .select({
        id: listings.id,
        seller_id: listings.sellerId,
        title: listings.title,
        description: listings.description,
        price_chf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        brand: listings.brand,
        model: listings.model,
        delivery_options: listings.deliveryOptions,
        shipping_cost_chf: listings.shippingCostChf,
        pickup_location: listings.pickupLocation,
        payment_mode: listings.paymentMode,
        status: listings.status,
        is_revampit: listings.isRevampit,
        view_count: listings.viewCount,
        favorite_count: listings.favoriteCount,
        created_at: listings.createdAt,
        updated_at: listings.updatedAt,
        verified_at: listings.verifiedAt,
        verified_by: listings.verifiedBy,
        verification_notes: listings.verificationNotes,
        condition_checks: listings.conditionChecks,
        seller_name: users.name,
        seller_display_name: sellerProfiles.displayName,
        seller_bio: sellerProfiles.bio,
        seller_avatar_url: sellerProfiles.avatarUrl,
        seller_city: sellerProfiles.city,
        seller_canton: sellerProfiles.canton,
        seller_rating: sellerProfiles.averageRating,
        seller_total_sold: sellerProfiles.totalSold,
        seller_total_reviews: sellerProfiles.totalReviews,
      })
      .from(listings)
      .innerJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(sellerProfiles, eq(listings.sellerId, sellerProfiles.userId))
      .where(and(eq(listings.id, id), ne(listings.status, LISTING_STATUS.REMOVED)));

    if (!listing) return apiNotFound('Inserat');

    // Fetch all images
    const images = await db
      .select({
        id: listingImages.id,
        url: listingImages.url,
        position: listingImages.position,
        is_primary: listingImages.isPrimary,
      })
      .from(listingImages)
      .where(eq(listingImages.listingId, id))
      .orderBy(asc(listingImages.position));

    // Fetch specs
    const specs = await db
      .select({
        spec_key: listingSpecs.specKey,
        spec_value: listingSpecs.specValue,
        spec_unit: listingSpecs.specUnit,
        normalized_value: listingSpecs.normalizedValue,
      })
      .from(listingSpecs)
      .where(eq(listingSpecs.listingId, id))
      .orderBy(asc(listingSpecs.specKey));

    // Check if current user has favorited
    let is_favorited = false;
    const session = await auth();
    if (session?.user?.id) {
      const [fav] = await db
        .select({ id: listingFavorites.id })
        .from(listingFavorites)
        .where(and(
          eq(listingFavorites.userId, session.user.id),
          eq(listingFavorites.listingId, id)
        ));
      is_favorited = !!fav;
    }

    return apiSuccess({
      ...listing,
      images,
      specs,
      is_favorited,
    });
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
  context?: RouteContext
) => {
  try {
    const id = context?.params?.id;
    if (!id) return apiNotFound('Inserat');

    // Check ownership
    const [owner] = await db
      .select({ sellerId: listings.sellerId })
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
  context?: RouteContext
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
      if (!session.user.isStaff && !isStaffEmail(session.user.email || '')) {
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
