/**
 * Meilisearch Client — Listing search integration
 *
 * Provides instant search with typo tolerance, faceted filtering, and relevance ranking.
 * Falls back gracefully if Meilisearch is unavailable.
 */

import { logger } from '@/lib/logger';
import { MEILISEARCH_URL } from '@/config/urls';
import { MARKETPLACE_SELLER_TYPE } from '@/config/marketplace';

const MEILISEARCH_HOST = MEILISEARCH_URL;
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || '';
const LISTINGS_INDEX = 'listings';

export interface MeilisearchDocument {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  model: string | null;
  category: string;
  condition: string;
  price_chf: number;
  delivery_options: string;
  payment_mode: string;
  status: string;
  is_revampit: boolean;
  is_verified: boolean;
  pickup_location: string | null;
  seller_name: string | null;
  seller_city: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
  thumbnail: string | null;
  // Denormalized spec fields for filtering
  spec_ram_gb?: number | null;
  spec_storage_gb?: number | null;
  spec_display_inches?: number | null;
  // Allow arbitrary spec fields
  [key: string]: unknown;
}

interface SearchFilters {
  category?: string;
  condition?: string;
  delivery?: string;
  payment?: string;
  price_min?: number;
  price_max?: number;
  seller_type?: string;
  gratis_only?: boolean;
  verified_only?: boolean;
  spec_ram_min?: number;
  spec_storage_min?: number;
  spec_display_min?: number;
}

interface SearchResult {
  hits: MeilisearchDocument[];
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

async function meiliRequest(path: string, options?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (MEILISEARCH_KEY) {
    headers['Authorization'] = `Bearer ${MEILISEARCH_KEY}`;
  }

  return fetch(`${MEILISEARCH_HOST}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Retry wrapper for write operations (index, delete) to handle transient failures.
 * Read operations (search) don't need retries since they fall back to SQL.
 */
async function meiliWriteWithRetry(path: string, options: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await meiliRequest(path, options);
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`Meilisearch returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Configure the listings index with searchable, filterable, and sortable attributes
 */
export async function configureListingsIndex(): Promise<void> {
  try {
    // Create index if it doesn't exist
    await meiliRequest('/indexes', {
      method: 'POST',
      body: JSON.stringify({ uid: LISTINGS_INDEX, primaryKey: 'id' }),
    });

    // Set searchable attributes
    await meiliRequest(`/indexes/${LISTINGS_INDEX}/settings/searchable-attributes`, {
      method: 'PUT',
      body: JSON.stringify(['title', 'description', 'brand', 'model']),
    });

    // Set filterable attributes (including spec fields and verification)
    await meiliRequest(`/indexes/${LISTINGS_INDEX}/settings/filterable-attributes`, {
      method: 'PUT',
      body: JSON.stringify([
        'category', 'condition', 'delivery_options', 'payment_mode',
        'status', 'price_chf', 'is_revampit', 'is_verified',
        'spec_ram_gb', 'spec_storage_gb', 'spec_display_inches',
      ]),
    });

    // Set sortable attributes
    await meiliRequest(`/indexes/${LISTINGS_INDEX}/settings/sortable-attributes`, {
      method: 'PUT',
      body: JSON.stringify(['price_chf', 'created_at', 'view_count', 'favorite_count']),
    });

    logger.info('Meilisearch listings index configured');
  } catch (error) {
    logger.warn('Failed to configure Meilisearch index', { error });
  }
}

/**
 * Index a single listing document
 */
export async function indexListing(listing: MeilisearchDocument): Promise<void> {
  try {
    await meiliWriteWithRetry(`/indexes/${LISTINGS_INDEX}/documents`, {
      method: 'POST',
      body: JSON.stringify([listing]),
    });
  } catch (error) {
    logger.warn('Failed to index listing in Meilisearch after retries', { listingId: listing.id, error });
  }
}

/**
 * Remove a listing from the index
 */
export async function removeListing(id: string): Promise<void> {
  try {
    await meiliWriteWithRetry(`/indexes/${LISTINGS_INDEX}/documents/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    logger.warn('Failed to remove listing from Meilisearch after retries', { listingId: id, error });
  }
}

/**
 * Search listings with filters, sorting, and facets
 */
export async function searchListings(
  searchQuery: string,
  filters: SearchFilters,
  sort: string,
  page: number,
  limit: number
): Promise<SearchResult | null> {
  try {
    // Build filter array
    const filterParts: string[] = ['status = "active"'];

    if (filters.category) filterParts.push(`category = "${filters.category}"`);
    if (filters.condition) filterParts.push(`condition = "${filters.condition}"`);
    if (filters.delivery) {
      filterParts.push(`(delivery_options = "${filters.delivery}" OR delivery_options = "both")`);
    }
    if (filters.payment) {
      filterParts.push(`(payment_mode = "${filters.payment}" OR payment_mode = "both")`);
    }
    if (filters.price_min !== undefined) filterParts.push(`price_chf >= ${filters.price_min}`);
    if (filters.price_max !== undefined) filterParts.push(`price_chf <= ${filters.price_max}`);
    if (filters.seller_type === MARKETPLACE_SELLER_TYPE.REVAMPIT) filterParts.push('is_revampit = true');
    if (filters.seller_type === MARKETPLACE_SELLER_TYPE.COMMUNITY) filterParts.push('is_revampit = false');
    if (filters.gratis_only) filterParts.push('price_chf = 0');
    if (filters.verified_only) filterParts.push('is_verified = true');
    // Spec filters
    if (filters.spec_ram_min !== undefined) filterParts.push(`spec_ram_gb >= ${filters.spec_ram_min}`);
    if (filters.spec_storage_min !== undefined) filterParts.push(`spec_storage_gb >= ${filters.spec_storage_min}`);
    if (filters.spec_display_min !== undefined) filterParts.push(`spec_display_inches >= ${filters.spec_display_min}`);

    // Map sort option to Meilisearch format
    let sortArray: string[] = [];
    switch (sort) {
      case 'price_asc': sortArray = ['price_chf:asc']; break;
      case 'price_desc': sortArray = ['price_chf:desc']; break;
      case 'popular': sortArray = ['view_count:desc']; break;
      default: sortArray = ['created_at:desc'];
    }

    const response = await meiliRequest(`/indexes/${LISTINGS_INDEX}/search`, {
      method: 'POST',
      body: JSON.stringify({
        q: searchQuery || '',
        filter: filterParts.join(' AND '),
        sort: sortArray,
        limit,
        offset: (page - 1) * limit,
        facets: ['category', 'condition', 'delivery_options', 'payment_mode'],
      }),
    });

    if (!response.ok) return null;
    return await response.json() as SearchResult;
  } catch (error) {
    logger.warn('Meilisearch search failed, falling back to SQL', { error });
    return null;
  }
}

/**
 * Check if Meilisearch is available
 */
export async function isMeilisearchAvailable(): Promise<boolean> {
  try {
    const response = await meiliRequest('/health');
    return response.ok;
  } catch {
    return false;
  }
}
