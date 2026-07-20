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

  const body = await request.json().catch(() => null) as { userId?: string; products?: InProduct[] } | null
  const userId = body?.userId
  const products = body?.products
  if (!userId || !Array.isArray(products)) {
    return NextResponse.json({ error: 'userId and products[] required' }, { status: 400 })
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
