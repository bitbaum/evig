/**
 * One-time backfill: publish existing RevampIT shop products (the legacy
 * marketplace_listings rows) into the unified `listings` table via the shared
 * helper. Idempotent — safe to re-run (the helper upserts one listing per
 * inventory item).
 *
 * Usage: npx tsx scripts/backfill-revampit-listings.ts [--dry]
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { db } from '@/db'
import { marketplaceListings } from '@/db/schema/inventory'
import { eq, isNotNull } from 'drizzle-orm'
import { MARKETPLACE_STATUS } from '@/config/marketplace-status'
import { publishRevampitListing } from '@/lib/marketplace/publish-revampit-listing'

async function main() {
  const dry = process.argv.includes('--dry')

  const rows = await db
    .select({ inventoryItemId: marketplaceListings.inventoryItemId, status: marketplaceListings.status })
    .from(marketplaceListings)
    .where(isNotNull(marketplaceListings.inventoryItemId))

  const published = rows.filter((r) => r.status === MARKETPLACE_STATUS.PUBLISHED && r.inventoryItemId)
  console.log(`Found ${rows.length} marketplace_listings (${published.length} published) to backfill`)

  if (dry) {
    for (const r of published) console.log(`  [dry] would publish inventory item ${r.inventoryItemId}`)
    console.log('Dry run — nothing written.')
    process.exit(0)
  }

  let ok = 0
  for (const r of published) {
    const listingId = await publishRevampitListing(db, r.inventoryItemId!)
    if (listingId) {
      ok++
      console.log(`  ✓ inventory ${r.inventoryItemId} -> listing ${listingId}`)
    } else {
      console.log(`  ✗ inventory ${r.inventoryItemId} skipped (product not found)`)
    }
  }

  console.log(`Backfilled ${ok}/${published.length} RevampIT listings.`)
  process.exit(0)
}

main().catch((e) => {
  console.error('Backfill failed:', e)
  process.exit(1)
})
