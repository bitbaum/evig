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
import { query, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { validateBody, UpdateListingSchema } from '@/lib/schemas';
import { LISTING_STATUS } from '@/config/marketplace';
import { isStaffEmail } from '@/lib/permissions';
import { indexListing, removeListing, type MeilisearchDocument } from '@/lib/search/meilisearch';
import { insertListingImages, upsertListingSpecs, buildMeiliSpecs } from '@/lib/marketplace/listing-helpers';

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
        seller_email: users.email,
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
// PATCH — Update listing (owner only) — uses transaction(), kept as raw SQL
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
    const ownerResult = await query<{ seller_id: string }>(
      `SELECT seller_id FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status != $2`,
      [id, LISTING_STATUS.REMOVED]
    );
    if (ownerResult.rows.length === 0) return apiNotFound('Inserat');
    if (ownerResult.rows[0].seller_id !== session.user.id) {
      return apiForbidden('Nur der Eigentümer kann dieses Inserat bearbeiten');
    }

    const body = await request.json();
    const validation = validateBody(UpdateListingSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Extract images and specs separately
    const { images, specs, condition_checks, ...updateFields } = data;

    await transaction(async (client) => {
      // Build SET clauses for listing fields
      const entries = Object.entries(updateFields).filter(([, v]) => v !== undefined);

      // Add condition_checks if provided
      if (condition_checks !== undefined) {
        entries.push(['condition_checks', condition_checks ? JSON.stringify(condition_checks) : null]);
      }

      if (entries.length > 0) {
        const setClauses: string[] = [];
        const values: unknown[] = [];
        let idx = 1;
        for (const [key, value] of entries) {
          setClauses.push(`${key} = $${idx++}`);
          values.push(value);
        }
        values.push(id);
        await client.query(
          `UPDATE ${TABLE_NAMES.LISTINGS} SET ${setClauses.join(', ')} WHERE id = $${idx}`,
          values
        );
      }

      // Replace images if provided
      if (images && images.length > 0) {
        await client.query(
          `DELETE FROM ${TABLE_NAMES.LISTING_IMAGES} WHERE listing_id = $1`,
          [id]
        );
        await insertListingImages(client, id, images);
      }

      // Replace specs if provided
      if (specs !== undefined) {
        await upsertListingSpecs(client, id, specs);
      }
    });

    logger.info('Listing updated', { listingId: id, userId: session.user.id });

    // Fire-and-forget: update Meilisearch index
    if (data.status === LISTING_STATUS.REMOVED || data.status === LISTING_STATUS.SOLD || data.status === LISTING_STATUS.DRAFT) {
      removeListing(id).catch(err => logger.error('Failed to remove listing from Meilisearch', { error: err, listingId: id }));
    } else {
      query(
        `SELECT l.id, l.title, l.description, l.brand, l.model, l.category, l.condition,
          l.price_chf, l.delivery_options, l.payment_mode, l.status, l.is_revampit,
          l.pickup_location, l.view_count, l.favorite_count, l.created_at,
          l.verified_at,
          u.name as seller_name, sp.city as seller_city,
          (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
        FROM ${TABLE_NAMES.LISTINGS} l
        JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
        LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON l.seller_id = sp.user_id
        WHERE l.id = $1 AND l.status = $2`,
        [id, LISTING_STATUS.ACTIVE]
      ).then(async res => {
        if (res.rows[0]) {
          const row = res.rows[0] as Record<string, unknown>;
          // Fetch specs for Meilisearch
          const specsRes = await query(
            `SELECT spec_key, spec_value FROM ${TABLE_NAMES.LISTING_SPECS} WHERE listing_id = $1`,
            [id]
          );
          const specInputs = specsRes.rows.map(r => {
            const s = r as { spec_key: string; spec_value: string };
            return { key: s.spec_key, value: s.spec_value };
          });
          const meiliSpecs = buildMeiliSpecs(specInputs);
          indexListing({
            ...row,
            is_verified: !!row.verified_at,
            ...meiliSpecs,
          } as MeilisearchDocument).catch(err => logger.error('Failed to index listing in Meilisearch', { error: err, listingId: id }));
        }
      }).catch(err => logger.error('Failed to fetch listing for Meilisearch index', { error: err, listingId: id }));
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
