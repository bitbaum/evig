/**
 * Erfassung API - Product intake and registration
 *
 * POST /api/admin/erfassung
 * Creates a new product in the inventory system
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { query, transaction } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { auth } from '@/auth'

interface ErfassungPayload {
  hersteller: string
  produktname: string
  kurzbeschreibung?: string
  langtext?: string
  verkaufspreis: number
  zustand: string
  laenge_mm?: number | null
  breite_mm?: number | null
  hoehe_mm?: number | null
  gewicht_kg?: number | null
  location?: string
  box_id?: string
  auf_lager?: number
  hauptkategorie?: string
  unterkategorie?: string
  kundenprofile?: string[]
  image?: string | null
  // Action determines the product state:
  // - 'draft': pending_review, not in shop (still being edited)
  // - 'erfassen': approved, not in shop (captured but not published)
  // - 'publish': approved, in shop (captured and visible to customers)
  action?: 'draft' | 'erfassen' | 'publish'
  publish?: boolean // Legacy support
}

/**
 * Generate human-readable Item UUID in format I-YYMMDD-NNNN
 */
async function generateItemUUID(): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().slice(2, 10).replace(/-/g, '')

  // Get the next sequence number for today
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
     WHERE DATE(created_at) = CURRENT_DATE`
  )

  const seqNum = parseInt(result.rows[0]?.count || '0') + 1
  const seqPart = seqNum.toString().padStart(4, '0')

  return `I-${datePart}-${seqPart}`
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    const payload: ErfassungPayload = await request.json()

    // Validate required fields
    if (!payload.hersteller || !payload.produktname) {
      return apiBadRequest('Hersteller und Produktname sind erforderlich')
    }

    if (payload.verkaufspreis === undefined || payload.verkaufspreis < 0) {
      return apiBadRequest('Gültiger Verkaufspreis ist erforderlich')
    }

    // Generate Item UUID
    const itemUUID = await generateItemUUID()

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
    // - 'draft': pending_review, not in shop
    // - 'erfassen': approved, not in shop
    // - 'publish': approved, in shop
    const action = payload.action || (payload.publish ? 'publish' : 'draft')
    const productStatus = action === 'draft' ? 'pending_review' : 'approved'
    const marketplaceStatus = action === 'publish' ? 'published' : 'draft'

    // Use transaction for data integrity
    const result = await transaction(async (client) => {
      // 1. Insert into ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
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
          session.user.id,
        ]
      )

      const productId = productResult.rows[0].id

      // 2. Insert into ${TABLE_NAMES.INVENTORY_ITEMS}
      await client.query(
        `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
          ai_product_id,
          location,
          box_id,
          quantity_available,
          status,
          selling_price_chf,
          marketplace_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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

      // 3. Link customer profiles if provided
      if (payload.kundenprofile && payload.kundenprofile.length > 0) {
        for (const profileSlug of payload.kundenprofile) {
          // Get profile ID
          const profileResult = await client.query(
            `SELECT id FROM ${TABLE_NAMES.CUSTOMER_PROFILES} WHERE slug = $1`,
            [profileSlug]
          )

          if (profileResult.rows.length > 0) {
            await client.query(
              `INSERT INTO ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} (product_id, profile_id, assigned_by)
               VALUES ($1, $2, 'manual')
               ON CONFLICT (product_id, profile_id) DO NOTHING`,
              [productId, profileResult.rows[0].id]
            )
          }
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
          ) VALUES (
            (SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1),
            $2,
            $3,
            $4,
            'internal',
            'published',
            NOW(),
            $5
          )`,
          [
            productId,
            `${payload.hersteller} ${payload.produktname}`,
            payload.kurzbeschreibung || '',
            payload.verkaufspreis,
            session.user.id,
          ]
        )
      }

      // 5. Handle image upload if provided
      if (payload.image) {
        // For now, store as base64 in ${TABLE_NAMES.PRODUCT_IMAGES} table
        // In production, upload to storage service
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
            `${itemUUID}.jpg`,
            payload.image.substring(0, 500), // Store reference, not full base64
            session.user.id,
          ]
        )
      }

      return { productId, itemUUID }
    })

    // Action-specific messages
    const messages: Record<string, string> = {
      draft: 'Produkt als Entwurf gespeichert',
      erfassen: 'Produkt erfasst',
      publish: 'Produkt erfasst und im Shop veröffentlicht',
    }

    logger.info('Product erfasst', {
      itemUUID: result.itemUUID,
      productId: result.productId,
      userId: session.user.id,
      action,
    })

    return apiSuccess({
      item_uuid: result.itemUUID,
      product_id: result.productId,
      action,
      published: action === 'publish',
      message: messages[action] || messages.draft,
    })

  } catch (error) {
    logger.error('Erfassung failed', { error })
    return apiError(error, 'Fehler beim Erfassen des Produkts')
  }
}
