/**
 * GET /api/listings — Public browse with filters, search, pagination
 * POST /api/listings — Authenticated: create a new listing
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages, listingSpecs, users, sellerProfiles } from '@/db/schema';
import { eq, and, sql, gte, lte, desc, asc, inArray, type SQL } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { validateBody, validateQuery, ListingsQuerySchema, CreateListingSchema } from '@/lib/schemas';
import { normalizeSpecValue } from '@/config/marketplace';
import { indexListingInSearch } from '@/lib/marketplace/listing-helpers';
import { LISTING_STATUS } from '@/config/marketplace';
import { sendCustomEmail } from '@/lib/email';
import { listingPublishedConfirmation } from '@/lib/email/templates/marketplace';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit';
import { sanitizeInput } from '@/lib/security/sanitize';

// ============================================================================
// GET — Public browse
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limiting — 200 requests per 15 minutes per IP
    const clientIp = getClientIdentifier(request);
    if (!rateLimiters.listingBrowse(clientIp)) {
      return apiBadRequest('Zu viele Anfragen. Bitte versuche es später erneut.');
    }

    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | null> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    const validation = validateQuery(ListingsQuerySchema, rawParams);
    if (!validation.success) return validation.error;
    const filters = validation.data;

    // Build dynamic WHERE conditions
    const conditions: SQL[] = [eq(listings.status, LISTING_STATUS.ACTIVE)];

    if (filters.category) {
      conditions.push(eq(listings.category, filters.category));
    }
    if (filters.condition) {
      conditions.push(eq(listings.condition, filters.condition));
    }
    if (filters.delivery) {
      conditions.push(
        sql`(${listings.deliveryOptions} = ${filters.delivery} OR ${listings.deliveryOptions} = 'both')`
      );
    }
    if (filters.payment) {
      conditions.push(
        sql`(${listings.paymentMode} = ${filters.payment} OR ${listings.paymentMode} = 'both')`
      );
    }
    if (filters.price_min !== undefined) {
      conditions.push(gte(listings.priceChf, String(filters.price_min)));
    }
    if (filters.price_max !== undefined) {
      conditions.push(lte(listings.priceChf, String(filters.price_max)));
    }
    if (filters.seller_type === 'revampit') {
      conditions.push(eq(listings.isRevampit, true));
    } else if (filters.seller_type === 'community') {
      conditions.push(eq(listings.isRevampit, false));
    }
    if (filters.gratis_only) {
      conditions.push(eq(listings.priceChf, '0'));
    }
    if (filters.verified_only) {
      conditions.push(sql`${listings.verifiedAt} IS NOT NULL`);
    }
    if (filters.search) {
      conditions.push(
        sql`to_tsvector('german', coalesce(${listings.title}, '') || ' ' || coalesce(${listings.description}, '') || ' ' || coalesce(${listings.brand}, '') || ' ' || coalesce(${listings.model}, '')) @@ plainto_tsquery('german', ${filters.search})`
      );
    }

    // Spec filters via subquery on listing_specs
    if (filters.spec_ram_min !== undefined) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${listingSpecs} s WHERE s.listing_id = ${listings.id} AND s.spec_key = 'RAM' AND s.normalized_value >= ${filters.spec_ram_min})`
      );
    }
    if (filters.spec_storage_min !== undefined) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${listingSpecs} s WHERE s.listing_id = ${listings.id} AND s.spec_key = 'Speicher' AND s.normalized_value >= ${filters.spec_storage_min})`
      );
    }
    if (filters.spec_display_min !== undefined) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${listingSpecs} s WHERE s.listing_id = ${listings.id} AND (s.spec_key = 'Display' OR s.spec_key = 'Grösse') AND s.normalized_value >= ${filters.spec_display_min})`
      );
    }

    const whereCondition = and(...conditions);

    // Sort
    let orderByClause;
    switch (filters.sort) {
      case 'price_asc':  orderByClause = asc(listings.priceChf); break;
      case 'price_desc': orderByClause = desc(listings.priceChf); break;
      case 'popular':    orderByClause = desc(listings.viewCount); break;
      default:           orderByClause = desc(listings.createdAt);
    }

    // Single query with COUNT(*) OVER() for pagination
    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: listings.id,
        title: listings.title,
        price_chf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        brand: listings.brand,
        model: listings.model,
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
        seller_display_name: sellerProfiles.displayName,
        seller_rating: sellerProfiles.averageRating,
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
      .where(whereCondition)
      .orderBy(orderByClause)
      .limit(filters.limit)
      .offset(filters.offset);

    const total = rows[0]?._total ?? 0;
    const items = rows.map(({ _total, ...rest }) => rest);

    // For items returned, fetch key specs (up to 3 per listing) for card display
    if (items.length > 0) {
      const listingIds = items.map((item) => item.id);
      const specsResult = await db
        .select({
          listing_id: listingSpecs.listingId,
          key: listingSpecs.specKey,
          value: listingSpecs.specValue,
          unit: listingSpecs.specUnit,
        })
        .from(listingSpecs)
        .where(inArray(listingSpecs.listingId, listingIds))
        .orderBy(asc(listingSpecs.listingId));

      // Group specs by listing_id
      const specsMap = new Map<string, Array<{ key: string; value: string; unit: string | null }>>();
      for (const row of specsResult) {
        if (!specsMap.has(row.listing_id)) specsMap.set(row.listing_id, []);
        specsMap.get(row.listing_id)!.push({ key: row.key, value: row.value, unit: row.unit });
      }

      // Attach specs to items
      return apiSuccess({
        items: items.map(item => ({
          ...item,
          specs: specsMap.get(item.id) || [],
        })),
        pagination: {
          total,
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    }

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

    const result = await db.transaction(async (tx) => {
      // Insert listing with sanitized data
      const [newListing] = await tx
        .insert(listings)
        .values({
          sellerId: session.user.id,
          title: sanitizedTitle,
          description: sanitizedDescription,
          priceChf: String(data.price_chf),
          category: data.category,
          condition: data.condition,
          brand: data.brand || null,
          model: data.model || null,
          deliveryOptions: data.delivery_options,
          shippingCostChf: data.shipping_cost_chf != null ? String(data.shipping_cost_chf) : null,
          pickupLocation: data.pickup_location || null,
          paymentMode: data.payment_mode,
          status: data.status,
          conditionChecks: data.condition_checks ? data.condition_checks : null,
        })
        .returning({ id: listings.id });

      const listingId = newListing.id;

      // Batch insert images
      if (data.images.length > 0) {
        await tx
          .insert(listingImages)
          .values(
            data.images.map((url, position) => ({
              listingId,
              url,
              position,
              isPrimary: position === 0,
            }))
          );
      }

      // Batch insert specs
      if (data.specs && data.specs.length > 0) {
        const specValues = data.specs
          .filter(spec => spec.value.trim())
          .map(spec => ({
            listingId,
            specKey: spec.key,
            specValue: spec.value,
            specUnit: spec.unit || null,
            normalizedValue: normalizeSpecValue(spec.key, spec.value)?.toString() ?? null,
          }));
        if (specValues.length > 0) {
          await tx.insert(listingSpecs).values(specValues);
        }
      }

      return listingId;
    });

    logger.info('Listing created', { listingId: result, userId: session.user.id });

    // Fire-and-forget: index in Meilisearch
    indexListingInSearch(
      {
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
        status: data.status || LISTING_STATUS.ACTIVE,
        is_revampit: false,
        is_verified: false,
        pickup_location: data.pickup_location || null,
        seller_name: session.user.name || null,
        seller_city: null,
        view_count: 0,
        favorite_count: 0,
        created_at: new Date().toISOString(),
        thumbnail: data.images?.[0] || null,
      },
      data.specs
    );

    // Fire-and-forget: send confirmation email
    if (session.user.email && data.status !== LISTING_STATUS.DRAFT) {
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
