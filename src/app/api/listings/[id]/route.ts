/**
 * GET /api/listings/[id]  — Public detail (increments view count)
 * PATCH /api/listings/[id] — Owner only: update listing
 * DELETE /api/listings/[id] — Owner or admin: soft delete
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/lib/api/helpers';
import { query, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { normalizeSpecValue, SPEC_MEILI_FIELD_MAP } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, UpdateListingSchema } from '@/lib/schemas';
import { isStaffEmail } from '@/lib/permissions';
import { indexListing, removeListing, type MeilisearchDocument } from '@/lib/search/meilisearch';

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
    query(
      `UPDATE ${TABLE_NAMES.LISTINGS} SET view_count = view_count + 1 WHERE id = $1 AND status = 'active'`,
      [id]
    ).catch(err => logger.error('Failed to increment view count', { error: err, listingId: id }));

    // Fetch listing with all images + seller info + verification data
    const result = await query(
      `SELECT
        l.id, l.seller_id, l.title, l.description, l.price_chf,
        l.category, l.condition, l.brand, l.model,
        l.delivery_options, l.shipping_cost_chf, l.pickup_location,
        l.payment_mode, l.status, l.is_revampit,
        l.view_count, l.favorite_count, l.created_at, l.updated_at,
        l.verified_at, l.verified_by, l.verification_notes,
        l.condition_checks,
        u.name as seller_name,
        u.email as seller_email,
        sp.display_name as seller_display_name,
        sp.bio as seller_bio,
        sp.avatar_url as seller_avatar_url,
        sp.city as seller_city,
        sp.canton as seller_canton,
        sp.average_rating as seller_rating,
        sp.total_sold as seller_total_sold,
        sp.total_reviews as seller_total_reviews
      FROM ${TABLE_NAMES.LISTINGS} l
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON l.seller_id = sp.user_id
      WHERE l.id = $1 AND l.status != 'removed'`,
      [id]
    );

    if (result.rows.length === 0) return apiNotFound('Inserat');

    // Fetch all images
    const imagesResult = await query(
      `SELECT id, url, position, is_primary
       FROM ${TABLE_NAMES.LISTING_IMAGES}
       WHERE listing_id = $1
       ORDER BY position ASC`,
      [id]
    );

    // Fetch specs
    const specsResult = await query(
      `SELECT spec_key, spec_value, spec_unit, normalized_value
       FROM ${TABLE_NAMES.LISTING_SPECS}
       WHERE listing_id = $1
       ORDER BY spec_key ASC`,
      [id]
    );

    // Check if current user has favorited
    let isFavorited = false;
    const session = await auth();
    if (session?.user?.id) {
      const favResult = await query(
        `SELECT 1 FROM ${TABLE_NAMES.LISTING_FAVORITES} WHERE user_id = $1 AND listing_id = $2`,
        [session.user.id, id]
      );
      isFavorited = favResult.rows.length > 0;
    }

    const listing = result.rows[0] as Record<string, unknown>;
    return apiSuccess({
      ...listing,
      images: imagesResult.rows,
      specs: specsResult.rows,
      is_favorited: isFavorited,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Inserats');
  }
}

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
    const ownerResult = await query<{ seller_id: string }>(
      `SELECT seller_id FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status != 'removed'`,
      [id]
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
        const imageValues: string[] = [];
        const imageParams: unknown[] = [];
        let idx = 1;
        images.forEach((url, position) => {
          imageValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
          imageParams.push(id, url, position, position === 0);
        });
        await client.query(
          `INSERT INTO ${TABLE_NAMES.LISTING_IMAGES} (listing_id, url, position, is_primary)
          VALUES ${imageValues.join(', ')}`,
          imageParams
        );
      }

      // Replace specs if provided
      if (specs !== undefined) {
        await client.query(
          `DELETE FROM ${TABLE_NAMES.LISTING_SPECS} WHERE listing_id = $1`,
          [id]
        );
        if (specs.length > 0) {
          const specValues: string[] = [];
          const specParams: unknown[] = [];
          let idx = 1;
          for (const spec of specs) {
            if (!spec.value.trim()) continue;
            const normalized = normalizeSpecValue(spec.key, spec.value);
            specValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
            specParams.push(id, spec.key, spec.value, spec.unit || null, normalized);
          }
          if (specValues.length > 0) {
            await client.query(
              `INSERT INTO ${TABLE_NAMES.LISTING_SPECS} (listing_id, spec_key, spec_value, spec_unit, normalized_value)
              VALUES ${specValues.join(', ')}`,
              specParams
            );
          }
        }
      }
    });

    logger.info('Listing updated', { listingId: id, userId: session.user.id });

    // Fire-and-forget: update Meilisearch index
    if (data.status === 'removed' || data.status === 'sold' || data.status === 'draft') {
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
        WHERE l.id = $1 AND l.status = 'active'`,
        [id]
      ).then(async res => {
        if (res.rows[0]) {
          const row = res.rows[0] as Record<string, unknown>;
          // Fetch specs for Meilisearch
          const specsRes = await query(
            `SELECT spec_key, spec_value FROM ${TABLE_NAMES.LISTING_SPECS} WHERE listing_id = $1`,
            [id]
          );
          const meiliSpecs: Record<string, number | null> = {};
          for (const specRow of specsRes.rows) {
            const s = specRow as { spec_key: string; spec_value: string };
            const meiliField = SPEC_MEILI_FIELD_MAP[s.spec_key];
            if (meiliField) {
              meiliSpecs[meiliField] = normalizeSpecValue(s.spec_key, s.spec_value);
            }
          }
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

    const ownerResult = await query<{ seller_id: string }>(
      `SELECT seller_id FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1 AND status != 'removed'`,
      [id]
    );
    if (ownerResult.rows.length === 0) return apiNotFound('Inserat');

    const isOwner = ownerResult.rows[0].seller_id === session.user.id;

    // Check admin access for non-owners
    if (!isOwner) {
      if (!session.user.isStaff && !isStaffEmail(session.user.email || '')) {
        return apiForbidden('Nur der Eigentümer oder ein Admin kann dieses Inserat löschen');
      }
    }

    await query(
      `UPDATE ${TABLE_NAMES.LISTINGS} SET status = 'removed' WHERE id = $1`,
      [id]
    );

    // Fire-and-forget: remove from Meilisearch
    removeListing(id).catch(err => logger.error('Failed to remove listing from Meilisearch', { error: err, listingId: id }));

    logger.info('Listing removed', { listingId: id, userId: session.user.id, isOwner });
    return apiSuccess({ id, status: 'removed' });
  } catch (error) {
    return apiError(error, 'Fehler beim Löschen des Inserats');
  }
});
