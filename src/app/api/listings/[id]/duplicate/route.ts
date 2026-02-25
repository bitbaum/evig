/**
 * POST /api/listings/[id]/duplicate — Duplicate a listing as draft
 *
 * Copies listing fields and specs (not images) with status=draft.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiNotFound, apiForbidden } from '@/lib/api/helpers';
import { query, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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

    // Verify ownership
    const listingResult = await query<{
      seller_id: string
      title: string
      description: string
      price_chf: number
      category: string
      condition: string
      brand: string | null
      model: string | null
      delivery_options: string
      shipping_cost_chf: number | null
      pickup_location: string | null
      payment_mode: string
      condition_checks: string | null
    }>(
      `SELECT seller_id, title, description, price_chf, category, condition,
        brand, model, delivery_options, shipping_cost_chf, pickup_location,
        payment_mode, condition_checks
       FROM ${TABLE_NAMES.LISTINGS}
       WHERE id = $1 AND status != 'removed'`,
      [id]
    );

    if (listingResult.rows.length === 0) return apiNotFound('Inserat');
    const listing = listingResult.rows[0];

    if (listing.seller_id !== session.user.id) {
      return apiForbidden('Nur der Eigentümer kann dieses Inserat duplizieren');
    }

    let newId = '';

    await transaction(async (client) => {
      // Create duplicate listing as draft
      const insertResult = await client.query(
        `INSERT INTO ${TABLE_NAMES.LISTINGS} (
          seller_id, title, description, price_chf, category, condition,
          brand, model, delivery_options, shipping_cost_chf, pickup_location,
          payment_mode, status, condition_checks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13)
        RETURNING id`,
        [
          session.user.id,
          listing.title + ' (Kopie)',
          listing.description,
          listing.price_chf,
          listing.category,
          listing.condition,
          listing.brand,
          listing.model,
          listing.delivery_options,
          listing.shipping_cost_chf,
          listing.pickup_location,
          listing.payment_mode,
          listing.condition_checks,
        ]
      );
      newId = (insertResult.rows[0] as { id: string }).id;

      // Copy specs
      await client.query(
        `INSERT INTO ${TABLE_NAMES.LISTING_SPECS} (listing_id, spec_key, spec_value, spec_unit, normalized_value)
         SELECT $1, spec_key, spec_value, spec_unit, normalized_value
         FROM ${TABLE_NAMES.LISTING_SPECS}
         WHERE listing_id = $2`,
        [newId, id]
      );
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
