/**
 * GET /api/search/listings — Search listings via Meilisearch
 *
 * Uses Meilisearch for instant search with typo tolerance and faceted filtering.
 * Falls back to the standard /api/listings SQL search if Meilisearch is unavailable.
 */

import { NextRequest } from 'next/server';
import { apiSuccessCached, apiError } from '@/lib/api/helpers';
import { validateQuery, ListingsQuerySchema } from '@/lib/schemas';
import { searchListings } from '@/lib/search/meilisearch';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | null> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    const validation = validateQuery(ListingsQuerySchema, rawParams);
    if (!validation.success) return validation.error;
    const filters = validation.data;

    const page = Math.floor(filters.offset / filters.limit) + 1;

    const result = await searchListings(
      filters.search || '',
      {
        category: filters.category,
        condition: filters.condition,
        delivery: filters.delivery,
        payment: filters.payment,
        price_min: filters.price_min,
        price_max: filters.price_max,
        seller_type: filters.seller_type,
      },
      filters.sort,
      page,
      filters.limit
    );

    if (!result) {
      // Meilisearch unavailable — redirect client to standard API
      return apiSuccessCached({
        items: [],
        pagination: { total: 0, limit: filters.limit, offset: filters.offset },
        fallback: true,
      }, 15, 10);
    }

    // Cache identical search queries for 15s to reduce Meilisearch load
    return apiSuccessCached({
      items: result.hits,
      pagination: {
        total: result.estimatedTotalHits,
        limit: filters.limit,
        offset: filters.offset,
      },
      facets: result.facetDistribution || null,
    }, 15, 10);
  } catch (error) {
    logger.error('Search error', { error });
    return apiError(error, 'Fehler bei der Suche');
  }
}
