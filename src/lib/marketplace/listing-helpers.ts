/**
 * Shared listing helpers — batch image insert, spec upsert, search indexing.
 *
 * Eliminates DRY violations between POST /api/listings and PATCH /api/listings/[id].
 */

import { PoolClient } from 'pg';
import { TABLE_NAMES } from '@/config/database';
import { normalizeSpecValue, SPEC_MEILI_FIELD_MAP } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { indexListing } from '@/lib/search/meilisearch';
import type { MeilisearchDocument } from '@/lib/search/meilisearch';
import type { ListingSpecInput } from '@/lib/schemas/marketplace';

// ============================================================================
// Image batch insert
// ============================================================================

/**
 * Batch-insert images for a listing. Position 0 is marked as primary.
 * Does NOT delete existing images — caller handles that for updates.
 */
export async function insertListingImages(
  client: PoolClient,
  listingId: string,
  images: string[]
): Promise<void> {
  if (images.length === 0) return;

  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (let position = 0; position < images.length; position++) {
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(listingId, images[position], position, position === 0);
  }

  await client.query(
    `INSERT INTO ${TABLE_NAMES.LISTING_IMAGES} (listing_id, url, position, is_primary)
     VALUES ${placeholders.join(', ')}`,
    params
  );
}

// ============================================================================
// Spec upsert (delete old + insert new with normalization)
// ============================================================================

/**
 * Replace all specs for a listing: deletes existing rows, then inserts new ones.
 * Empty spec values are silently skipped. Each value is normalized for filtering.
 */
export async function upsertListingSpecs(
  client: PoolClient,
  listingId: string,
  specs: ListingSpecInput[]
): Promise<void> {
  // Always delete existing specs (caller passes undefined to skip entirely)
  await client.query(
    `DELETE FROM ${TABLE_NAMES.LISTING_SPECS} WHERE listing_id = $1`,
    [listingId]
  );

  if (specs.length === 0) return;

  const placeholders: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const spec of specs) {
    if (!spec.value.trim()) continue;
    const normalized = normalizeSpecValue(spec.key, spec.value);
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    params.push(listingId, spec.key, spec.value, spec.unit || null, normalized);
  }

  if (placeholders.length === 0) return;

  await client.query(
    `INSERT INTO ${TABLE_NAMES.LISTING_SPECS} (listing_id, spec_key, spec_value, spec_unit, normalized_value)
     VALUES ${placeholders.join(', ')}`,
    params
  );
}

// ============================================================================
// Meilisearch indexing helper
// ============================================================================

/**
 * Build denormalized spec fields (spec_ram_gb, spec_storage_gb, etc.)
 * from a list of spec inputs, using the SPEC_MEILI_FIELD_MAP config.
 */
export function buildMeiliSpecs(
  specs: ListingSpecInput[] | undefined
): Record<string, number | null> {
  const meiliSpecs: Record<string, number | null> = {};
  if (!specs) return meiliSpecs;

  for (const spec of specs) {
    const meiliField = SPEC_MEILI_FIELD_MAP[spec.key];
    if (meiliField && spec.value) {
      meiliSpecs[meiliField] = normalizeSpecValue(spec.key, spec.value);
    }
  }
  return meiliSpecs;
}

/**
 * Fire-and-forget Meilisearch indexing for a listing.
 * Builds denormalized spec fields and merges them into the document.
 * Errors are logged but never thrown — callers should not await this.
 */
export function indexListingInSearch(
  doc: MeilisearchDocument,
  specs?: ListingSpecInput[]
): void {
  const meiliSpecs = buildMeiliSpecs(specs);

  indexListing({
    ...doc,
    ...meiliSpecs,
  }).catch(err =>
    logger.error('Failed to index listing in Meilisearch', {
      error: err,
      listingId: doc.id,
    })
  );
}
