/**
 * GET /api/listings — Public browse with filters, search, pagination
 * POST /api/listings — Authenticated: create a new listing
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { query, paginatedQuery, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { logger } from '@/lib/logger';
import { validateBody, validateQuery, ListingsQuerySchema, CreateListingSchema } from '@/lib/schemas';
import { indexListing } from '@/lib/search/meilisearch';
import { sendCustomEmail } from '@/lib/email';
import { listingPublishedConfirmation } from '@/lib/email/templates/marketplace';
import { rateLimiters } from '@/lib/security/rate-limit';
import { sanitizeInput } from '@/lib/security/sanitize';

// ============================================================================
// GET — Public browse
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | null> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    const validation = validateQuery(ListingsQuerySchema, rawParams);
    if (!validation.success) return validation.error;
    const filters = validation.data;

    // Build dynamic WHERE clauses
    const conditions: string[] = [`l.status = 'active'`];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`l.category = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.condition) {
      conditions.push(`l.condition = $${paramIndex++}`);
      params.push(filters.condition);
    }
    if (filters.delivery) {
      conditions.push(`(l.delivery_options = $${paramIndex} OR l.delivery_options = 'both')`);
      params.push(filters.delivery);
      paramIndex++;
    }
    if (filters.payment) {
      conditions.push(`(l.payment_mode = $${paramIndex} OR l.payment_mode = 'both')`);
      params.push(filters.payment);
      paramIndex++;
    }
    if (filters.price_min !== undefined) {
      conditions.push(`l.price_chf >= $${paramIndex++}`);
      params.push(filters.price_min);
    }
    if (filters.price_max !== undefined) {
      conditions.push(`l.price_chf <= $${paramIndex++}`);
      params.push(filters.price_max);
    }
    if (filters.seller_type === 'revampit') {
      conditions.push(`l.is_revampit = true`);
    } else if (filters.seller_type === 'community') {
      conditions.push(`l.is_revampit = false`);
    }
    if (filters.search) {
      conditions.push(
        `to_tsvector('german', coalesce(l.title, '') || ' ' || coalesce(l.description, '') || ' ' || coalesce(l.brand, '') || ' ' || coalesce(l.model, '')) @@ plainto_tsquery('german', $${paramIndex++})`
      );
      params.push(filters.search);
    }

    const whereClause = conditions.join(' AND ');

    // Sort
    let orderBy: string;
    switch (filters.sort) {
      case 'price_asc':  orderBy = 'l.price_chf ASC'; break;
      case 'price_desc': orderBy = 'l.price_chf DESC'; break;
      case 'popular':    orderBy = 'l.view_count DESC'; break;
      default:           orderBy = 'l.created_at DESC';
    }

    // Fetch listings with seller info + primary image (single query with COUNT(*) OVER())
    const { rows: items, total } = await paginatedQuery(
      `SELECT
        l.id, l.title, l.price_chf, l.category, l.condition, l.brand, l.model,
        l.delivery_options, l.payment_mode, l.status, l.is_revampit,
        l.pickup_location, l.view_count, l.favorite_count, l.created_at,
        u.name as seller_name,
        sp.display_name as seller_display_name,
        sp.average_rating as seller_rating,
        sp.city as seller_city,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail
      FROM ${TABLE_NAMES.LISTINGS} l
      JOIN ${TABLE_NAMES.USERS} u ON l.seller_id = u.id
      LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON l.seller_id = sp.user_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, filters.limit, filters.offset]
    );

    return apiSuccess({
      items,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Inserate');
  }
}

// ============================================================================
// POST — Create listing (authenticated)
// ============================================================================

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    // SECURITY: Rate limiting - 10 listings per hour per user
    if (!rateLimiters.listingCreate(`${session.user.id}:listing-create`)) {
      return apiBadRequest('Zu viele Inserate erstellt. Bitte warte 1 Stunde.');
    }

    const body = await request.json();
    const validation = validateBody(CreateListingSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // SECURITY: Sanitize user inputs
    const sanitizedTitle = sanitizeInput(data.title, { maxLength: 200 });
    const sanitizedDescription = sanitizeInput(data.description, {
      allowHtml: true,
      maxLength: 5000,
    });

    const result = await transaction(async (client) => {
      // Insert listing with sanitized data
      const listingResult = await client.query(
        `INSERT INTO ${TABLE_NAMES.LISTINGS} (
          seller_id, title, description, price_chf, category, condition,
          brand, model, delivery_options, shipping_cost_chf, pickup_location,
          payment_mode, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          session.user.id,
          sanitizedTitle,
          sanitizedDescription,
          data.price_chf,
          data.category,
          data.condition,
          data.brand || null,
          data.model || null,
          data.delivery_options,
          data.shipping_cost_chf || null,
          data.pickup_location || null,
          data.payment_mode,
          data.status,
        ]
      );

      const listingId = listingResult.rows[0].id;

      // Batch insert images
      if (data.images.length > 0) {
        const imageValues: string[] = [];
        const imageParams: unknown[] = [];
        let idx = 1;
        data.images.forEach((url, position) => {
          imageValues.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
          imageParams.push(listingId, url, position, position === 0);
        });

        await client.query(
          `INSERT INTO ${TABLE_NAMES.LISTING_IMAGES} (listing_id, url, position, is_primary)
          VALUES ${imageValues.join(', ')}`,
          imageParams
        );
      }

      return listingId;
    });

    logger.info('Listing created', { listingId: result, userId: session.user.id });

    // Fire-and-forget: index in Meilisearch
    indexListing({
      id: result,
      title: sanitizedTitle,
      description: sanitizedDescription,
      brand: data.brand || null,
      model: data.model || null,
      category: data.category,
      condition: data.condition,
      price_chf: data.price_chf,
      delivery_options: data.delivery_options,
      payment_mode: data.payment_mode,
      status: data.status || 'active',
      is_revampit: false,
      pickup_location: data.pickup_location || null,
      seller_name: session.user.name || null,
      seller_city: null,
      view_count: 0,
      favorite_count: 0,
      created_at: new Date().toISOString(),
      thumbnail: data.images?.[0] || null,
    }).catch(err => logger.error('Failed to index listing in Meilisearch', { error: err, listingId: result }));

    // Fire-and-forget: send confirmation email
    if (session.user.email && data.status !== 'draft') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      sendCustomEmail(
        session.user.email,
        listingPublishedConfirmation({
          recipientName: session.user.name || 'Nutzer',
          listingTitle: sanitizedTitle,
          listingUrl: `${baseUrl}/marketplace/${result}`,
        })
      ).catch(err => logger.error('Failed to send listing published email', { error: err, listingId: result }));
    }

    return apiSuccess({ id: result }, 201);
  } catch (error) {
    return apiError(error, 'Fehler beim Erstellen des Inserats');
  }
});
