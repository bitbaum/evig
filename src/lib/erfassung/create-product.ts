/**
 * Shared Product Creation Logic
 *
 * SSOT for creating a product in the database.
 * Used by: single erfassung route, bulk-save route
 *
 * Extracted from app/api/admin/erfassung/route.ts to avoid duplication.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { uploadImage, generateImageFilename } from '@/lib/storage/image-upload'
import { publishToMedusa } from '@/lib/services/medusa-publish-service'
import type { ErfassungPayload } from '@/types/erfassung'
import type { PoolClient } from 'pg'

export interface CreateProductResult {
  productId: string
  itemUUID: string
  imageUrl: string | null
}

/**
 * Generate human-readable Item UUID in format I-YYMMDD-NNNN
 */
export async function generateItemUUID(client?: PoolClient): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().slice(2, 10).replace(/-/g, '')

  const sql = `SELECT COUNT(*) as count FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
     WHERE DATE(created_at) = CURRENT_DATE`

  const result = client
    ? await client.query<{ count: string }>(sql)
    : await query<{ count: string }>(sql)

  const seqNum = parseInt(result.rows[0]?.count || '0') + 1
  const seqPart = seqNum.toString().padStart(4, '0')

  return `I-${datePart}-${seqPart}`
}

/**
 * Create a product in the database from an ErfassungPayload.
 *
 * Can be used standalone (creates its own transaction) or within
 * an existing transaction by passing a PoolClient.
 */
export async function createErfassungProduct(
  payload: ErfassungPayload,
  userId: string,
  client: PoolClient,
): Promise<CreateProductResult> {
  // Generate Item UUID within the transaction to prevent race conditions
  const itemUUID = await generateItemUUID(client)

  // Build dimensions JSON
  const dimensions = {
    laenge_mm: payload.laenge_mm || null,
    breite_mm: payload.breite_mm || null,
    hoehe_mm: payload.hoehe_mm || null,
  }

  // Parse langtext if it's a string
  let specifications = {}
  if (payload.langtext) {
    try {
      specifications = typeof payload.langtext === 'string'
        ? JSON.parse(payload.langtext)
        : payload.langtext
    } catch {
      specifications = { raw: payload.langtext }
    }
  }

  // Determine status based on action (with legacy publish support)
  const action = payload.action || (payload.publish ? 'publish' : 'draft')
  const productStatus = action === 'draft' ? 'pending_review' : 'approved'
  const marketplaceStatus = action === 'publish' ? 'published' : 'draft'

  // 1. Insert into AI_EXTRACTED_PRODUCTS
  const productResult = await client.query(
    `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
      item_uuid,
      product_name,
      brand,
      short_description,
      specifications,
      estimated_price_chf,
      condition,
      dimensions,
      weight_grams,
      category,
      subcategory,
      status,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      itemUUID,
      payload.produktname,
      payload.hersteller,
      payload.kurzbeschreibung || null,
      JSON.stringify(specifications),
      payload.verkaufspreis,
      payload.zustand || 'good',
      JSON.stringify(dimensions),
      payload.gewicht_kg ? Math.round(payload.gewicht_kg * 1000) : null,
      payload.hauptkategorie || null,
      payload.unterkategorie || null,
      productStatus,
      userId,
    ]
  )

  const productId = productResult.rows[0].id

  // 2. Insert into INVENTORY_ITEMS
  const inventoryResult = await client.query(
    `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
      ai_product_id,
      location,
      box_id,
      quantity_available,
      status,
      selling_price_chf,
      marketplace_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      productId,
      payload.location || null,
      payload.box_id || null,
      payload.auf_lager || 1,
      'available',
      payload.verkaufspreis,
      marketplaceStatus,
    ]
  )
  const inventoryItemId = inventoryResult.rows[0].id

  // 3. Link customer profiles if provided (batch to avoid N+1)
  if (payload.kundenprofile && payload.kundenprofile.length > 0) {
    const slugPlaceholders = payload.kundenprofile.map((_: string, i: number) => `$${i + 1}`).join(', ')
    const profileResult = await client.query(
      `SELECT id FROM ${TABLE_NAMES.CUSTOMER_PROFILES} WHERE slug IN (${slugPlaceholders})`,
      payload.kundenprofile
    )

    if (profileResult.rows.length > 0) {
      const profileIds = profileResult.rows.map((r: { id: string }) => r.id)
      const values = profileIds.map((_: string, i: number) =>
        `($${i * 2 + 1}, $${i * 2 + 2}, 'manual')`
      ).join(', ')
      const params = profileIds.flatMap((profileId: string) => [productId, profileId])
      await client.query(
        `INSERT INTO ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} (product_id, profile_id, assigned_by)
         VALUES ${values}
         ON CONFLICT (product_id, profile_id) DO NOTHING`,
        params
      )
    }
  }

  // 4. Create marketplace listing if publishing to shop
  if (action === 'publish') {
    await client.query(
      `INSERT INTO ${TABLE_NAMES.MARKETPLACE_LISTINGS} (
        inventory_item_id,
        title,
        description,
        price_chf,
        platform,
        status,
        published_at,
        created_by
      ) VALUES ($1, $2, $3, $4, 'internal', 'published', NOW(), $5)`,
      [
        inventoryItemId,
        `${payload.hersteller} ${payload.produktname}`,
        payload.kurzbeschreibung || '',
        payload.verkaufspreis,
        userId,
      ]
    )

    // Fire-and-forget: publish to Medusa after transaction commits.
    // Uses global query(), not the transaction client.
    publishToMedusa(inventoryItemId, userId).catch((err) => {
      logger.warn('Auto-publish to Medusa failed', { productId, error: err })
    })
  }

  // 5. Handle image upload if provided
  let imageUrl: string | null = null
  if (payload.image) {
    const filename = generateImageFilename(itemUUID)
    const uploadResult = await uploadImage(payload.image, filename, 'products')

    if (uploadResult.success && uploadResult.url) {
      imageUrl = uploadResult.url

      await client.query(
        `INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
          product_id,
          filename,
          file_path,
          is_primary,
          uploaded_by,
          upload_status
        ) VALUES ($1, $2, $3, true, $4, 'ready')`,
        [
          productId,
          filename,
          uploadResult.url,
          userId,
        ]
      )

      logger.info('Product image uploaded', {
        productId,
        itemUUID,
        imageUrl: uploadResult.url,
      })
    } else {
      logger.warn('Image upload failed, continuing without image', {
        productId,
        itemUUID,
        error: uploadResult.error,
      })
    }
  }

  return { productId, itemUUID, imageUrl }
}
