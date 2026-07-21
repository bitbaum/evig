/**
 * API: One-time Shopware → RevampIT catalog migration (drafts).
 *
 * POST /api/admin/migrate/shopware-drafts
 *
 * Imports products scraped from the legacy Shopware shop as DRAFTS (pending
 * review, not published). Reuses createErfassungProduct so every invariant —
 * item UUID, inventory item, R2 image upload — matches normal intake. Images
 * are downloaded server-side from the Shopware URL and handed to the shared
 * upload path (→ R2). Idempotent: a product already imported (same Shopware
 * number, stored in specifications) is skipped, so batches can be re-run/resumed.
 *
 * Auth: Bearer CRON_SECRET (operational/migration tool — not session-gated, so
 * it can be driven from the server without a browser). Body:
 *   { userId: string, products: [{ produktname, hersteller, verkaufspreis?,
 *     kurzbeschreibung?, imageUrl?, productNumber? }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { logger } from '@/lib/logger'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { detectCategory } from '@/lib/erfassung/ai-classification'
import { publishRevampitListing, REVAMPIT_SELLER_NAME } from '@/lib/marketplace/publish-revampit-listing'
import { indexListing } from '@/lib/search/meilisearch'

export const runtime = 'nodejs'
export const maxDuration = 300

interface InProduct {
  produktname?: string
  hersteller?: string
  verkaufspreis?: string
  kurzbeschreibung?: string
  imageUrl?: string
  productNumber?: string
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RevampIT-Migration/1.0' } })
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0 || buf.byteLength > 8 * 1024 * 1024) return null
    const contentType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
    return `data:${contentType};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as
    { mode?: string; userId?: string; products?: InProduct[]; limit?: number } | null
  const userId = body?.userId
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  // Publish mode: turn the imported drafts into live is_revampit marketplace
  // listings (images already on R2 carry over to listing_images). Batched via
  // `limit`; call repeatedly until `remaining` is 0.
  if (body?.mode === 'publish') {
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200)
    const rows = await db.execute(sql`
      SELECT ii.id AS inv_id
      FROM inventory_items ii
      JOIN ai_extracted_products p ON ii.ai_product_id = p.id
      LEFT JOIN listings l ON l.inventory_item_id = ii.id
      WHERE p.specifications->>'Shopware-Nr.' IS NOT NULL AND l.id IS NULL
      LIMIT ${limit}
    `)
    const pubResults: Array<{ invId: string; status: string; listingId?: string | null; reason?: string }> = []
    for (const row of rows.rows as Array<{ inv_id: string }>) {
      const invId = row.inv_id
      try {
        const listingId = await db.transaction((tx) => publishRevampitListing(tx, invId, { verifiedBy: userId }))
        pubResults.push({ invId, status: listingId ? 'published' : 'skipped', listingId })
      } catch (error) {
        logger.error('Shopware migration publish failed', { error, invId })
        pubResults.push({ invId, status: 'error', reason: error instanceof Error ? error.message : 'unknown' })
      }
    }
    const remainingRes = await db.execute(sql`
      SELECT count(*)::int AS n
      FROM inventory_items ii
      JOIN ai_extracted_products p ON ii.ai_product_id = p.id
      LEFT JOIN listings l ON l.inventory_item_id = ii.id
      WHERE p.specifications->>'Shopware-Nr.' IS NOT NULL AND l.id IS NULL
    `)
    const remaining = (remainingRes.rows[0] as { n: number } | undefined)?.n ?? 0
    const summary = pubResults.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})
    logger.info('Shopware migration publish batch', { summary, remaining })
    return NextResponse.json({ mode: 'publish', summary, remaining })
  }

  // Reindex mode: push the migrated listings' CURRENT db state (e.g. the fixed
  // titles) into Meilisearch. The listings were indexed at publish time with the
  // pre-fix titles; the browse grid reads the db so it's already correct, this
  // syncs the search index too.
  if (body?.mode === 'reindex') {
    const rows = await db.execute(sql`
      SELECT l.id, l.title, l.description, l.brand, l.model, l.category, l.condition,
             l.price_chf, l.delivery_options, l.payment_mode, l.status, l.pickup_location,
             l.view_count, l.favorite_count, l.created_at,
             (SELECT url FROM listing_images WHERE listing_id = l.id ORDER BY is_primary DESC, position ASC LIMIT 1) AS thumbnail
      FROM listings l
      JOIN inventory_items ii ON l.inventory_item_id = ii.id
      JOIN ai_extracted_products p ON ii.ai_product_id = p.id
      WHERE p.specifications->>'Shopware-Nr.' IS NOT NULL
    `)
    let indexed = 0
    let failed = 0
    for (const row of rows.rows as Array<Record<string, unknown>>) {
      try {
        await indexListing({
          id: String(row.id),
          title: String(row.title ?? ''),
          description: String(row.description ?? ''),
          brand: (row.brand as string) ?? null,
          model: (row.model as string) ?? null,
          category: String(row.category ?? ''),
          condition: String(row.condition ?? 'good'),
          price_chf: Number(row.price_chf) || 0,
          delivery_options: String(row.delivery_options ?? 'pickup'),
          payment_mode: String(row.payment_mode ?? 'secure'),
          status: String(row.status ?? 'active'),
          is_revampit: true,
          is_verified: false,
          pickup_location: (row.pickup_location as string) ?? null,
          seller_name: REVAMPIT_SELLER_NAME,
          seller_city: null,
          view_count: Number(row.view_count) || 0,
          favorite_count: Number(row.favorite_count) || 0,
          created_at: new Date(String(row.created_at)).toISOString(),
          thumbnail: (row.thumbnail as string) ?? null,
        })
        indexed++
      } catch (error) {
        failed++
        logger.error('Shopware migration reindex failed', { error, id: row.id })
      }
    }
    logger.info('Shopware migration reindex complete', { indexed, failed })
    return NextResponse.json({ mode: 'reindex', indexed, failed })
  }

  // Recategorize mode: re-run detectCategory on migrated products that landed
  // uncategorized, and propagate the category to their listing. Truly
  // non-device items (gift cards) stay uncategorized → "Sonstiges".
  if (body?.mode === 'recategorize') {
    const rows = await db.execute(sql`
      SELECT p.id AS product_id, p.brand, p.product_name, p.short_description, l.id AS listing_id
      FROM ai_extracted_products p
      JOIN inventory_items ii ON ii.ai_product_id = p.id
      LEFT JOIN listings l ON l.inventory_item_id = ii.id
      WHERE p.specifications->>'Shopware-Nr.' IS NOT NULL AND (p.category IS NULL OR p.category = '')
    `)
    let updated = 0
    let stillNone = 0
    const byCat: Record<string, number> = {}
    for (const row of rows.rows as Array<Record<string, unknown>>) {
      const text = `${row.brand ?? ''} ${row.product_name ?? ''} ${row.short_description ?? ''}`
      const cat = detectCategory(text)
      if (!cat) { stillNone++; continue }
      await db.execute(sql`UPDATE ai_extracted_products SET category = ${cat} WHERE id = ${String(row.product_id)}`)
      if (row.listing_id) {
        await db.execute(sql`UPDATE listings SET category = ${cat} WHERE id = ${String(row.listing_id)}`)
      }
      updated++
      byCat[cat] = (byCat[cat] || 0) + 1
    }
    logger.info('Shopware migration recategorize complete', { updated, stillNone, byCat })
    return NextResponse.json({ mode: 'recategorize', updated, stillNone, byCat })
  }

  const products = body?.products
  if (!Array.isArray(products)) {
    return NextResponse.json({ error: 'products[] required' }, { status: 400 })
  }

  const results: Array<{ nr?: string; status: string; itemUuid?: string; hasImage?: boolean; reason?: string }> = []

  for (const p of products) {
    const nr = p.productNumber
    try {
      if (!p.hersteller || !p.produktname) {
        results.push({ nr, status: 'skipped', reason: 'Hersteller/Produktname fehlt' })
        continue
      }

      // Idempotency: skip if this Shopware number was already imported.
      if (nr) {
        const existing = await db.execute(
          sql`SELECT 1 FROM ai_extracted_products WHERE specifications->>'Shopware-Nr.' = ${nr} LIMIT 1`,
        )
        if (existing.rows.length > 0) {
          results.push({ nr, status: 'exists' })
          continue
        }
      }

      const image = p.imageUrl ? await fetchImageAsDataUrl(p.imageUrl) : null
      const price = Number.parseFloat(p.verkaufspreis || '') || 0
      const specifications = { 'Shopware-Nr.': nr || '', Quelle: 'Shopware-Migration' }
      // og:description is truncated with an ellipsis — trim it for the draft.
      const beschreibung = (p.kurzbeschreibung || '').replace(/[.…]+\s*$/, '').trim()

      const created = await db.transaction((tx) =>
        createErfassungProduct(
          {
            hersteller: p.hersteller!,
            produktname: p.produktname!,
            kurzbeschreibung: beschreibung || undefined,
            langtext: JSON.stringify(specifications),
            verkaufspreis: price,
            zustand: 'good',
            hauptkategorie: detectCategory(`${p.produktname} ${beschreibung}`) || undefined,
            image,
            action: 'draft',
          },
          userId,
          tx,
          { source: 'csv_import' },
        ),
      )

      results.push({ nr, status: 'created', itemUuid: created.itemUUID, hasImage: Boolean(image) })
    } catch (error) {
      logger.error('Shopware migration item failed', { error, nr })
      results.push({ nr, status: 'error', reason: error instanceof Error ? error.message : 'unknown' })
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})
  logger.info('Shopware migration batch complete', { summary, count: products.length })
  return NextResponse.json({ summary, results })
}
