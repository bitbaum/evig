/**
 * Shared listing helpers — Meilisearch indexing utilities.
 *
 * The raw SQL batch-insert helpers (insertListingImages, upsertListingSpecs)
 * were removed after callers migrated to inline Drizzle ORM calls.
 */

import { normalizeSpecValue, SPEC_MEILI_FIELD_MAP } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { indexListing } from '@/lib/search/meilisearch';
import type { MeilisearchDocument } from '@/lib/search/meilisearch';
import type { ListingSpecInput } from '@/lib/schemas/marketplace';

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
