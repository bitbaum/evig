/**
 * Inventory Product Detail API
 *
 * GET /api/admin/inventory/[id]
 * Fetches detailed inventory product information including customer profiles
 * Used by the factsheet/label template
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { uploadImage, deleteImage } from '@/lib/storage/image-upload'

export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

    // Fetch product with inventory and customer profiles
    const productResult = await query<{
      id: string
      item_uuid: string
      product_name: string
      brand: string
      short_description: string | null
      specifications: Record<string, string>
      estimated_price_chf: number
      condition: string
      dimensions: Record<string, number | null>
      weight_grams: number | null
      category: string | null
      subcategory: string | null
      created_at: string
      location: string | null
      box_id: string | null
      quantity_available: number
    }>(
      `SELECT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.specifications,
        p.estimated_price_chf,
        p.condition,
        p.dimensions,
        p.weight_grams,
        p.category,
        p.subcategory,
        p.created_at,
        i.location,
        i.box_id,
        COALESCE(i.quantity_available, 1) as quantity_available
      FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
      LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
      WHERE p.id = $1`,
      [productId]
    )

    if (productResult.rows.length === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    const product = productResult.rows[0]

    // Fetch customer profiles for this product
    const profilesResult = await query<{ slug: string }>(
      `SELECT cp.slug
       FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp
       JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id
       WHERE pcp.product_id = $1`,
      [productId]
    )

    const customerProfiles = profilesResult.rows.map(r => r.slug)

    // Fetch primary image if exists
    const imageResult = await query<{ file_path: string }>(
      `SELECT file_path
       FROM ${TABLE_NAMES.PRODUCT_IMAGES}
       WHERE product_id = $1 AND is_primary = true
       LIMIT 1`,
      [productId]
    )

    const imageUrl = imageResult.rows.length > 0 ? imageResult.rows[0].file_path : null

    logger.info('Inventory product fetched for factsheet', {
      productId,
      itemUuid: product.item_uuid,
      userId: session.user.id,
    })

    return apiSuccess({
      product: {
        ...product,
        customer_profiles: customerProfiles,
        image_url: imageUrl,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
})

/**
 * DELETE /api/admin/inventory/[id]
 * Deletes an inventory product and all related records
 */
export const DELETE = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

    // Delete in order: child tables first, then main table
    // 1. Delete product customer profiles
    await query(
      `DELETE FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} WHERE product_id = $1`,
      [productId]
    )

    // 2. Delete product images
    await query(
      `DELETE FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE product_id = $1`,
      [productId]
    )

    // 3. Delete marketplace listings (via inventory_item_id)
    await query(
      `DELETE FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS}
       WHERE inventory_item_id IN (
         SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1
       )`,
      [productId]
    )

    // 4. Delete inventory items
    await query(
      `DELETE FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1`,
      [productId]
    )

    // 5. Delete the main product record
    const result = await query<{ id: string; item_uuid: string }>(
      `DELETE FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1 RETURNING id, item_uuid`,
      [productId]
    )

    if (result.rowCount === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    logger.info('Inventory product deleted', {
      productId,
      itemUuid: result.rows[0].item_uuid,
      deletedBy: session.user.id,
    })

    return apiSuccess({ success: true, deleted: result.rows[0] })
  } catch (error) {
    logger.error('Failed to delete inventory product', { error })
    return apiError(error, 'Fehler beim Löschen des Produkts')
  }
})

/**
 * PUT /api/admin/inventory/[id]
 * Updates an inventory product
 */
export const PUT = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const body = await request.json() as Record<string, unknown>

    // Build dynamic update query based on provided fields
    const allowedFields = [
      'product_name',
      'brand',
      'short_description',
      'specifications',
      'estimated_price_chf',
      'condition',
      'category',
      'subcategory',
      'dimensions',
      'weight_grams',
      'status',
    ]

    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`)
        values.push(body[field])
        paramIndex++
      }
    }

    if (updates.length === 0) {
      return apiError(new Error('No valid fields to update'), 'Keine gültigen Felder zum Aktualisieren', 400)
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`)

    // Add product ID as last parameter
    values.push(productId)

    const result = await query(
      `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    if (result.rowCount === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    // Update inventory item if location/quantity fields are provided
    if (body.location !== undefined || body.box_id !== undefined || body.quantity_available !== undefined) {
      const inventoryUpdates: string[] = []
      const inventoryValues: unknown[] = []
      let invParamIndex = 1

      if (body.location !== undefined) {
        inventoryUpdates.push(`location = $${invParamIndex}`)
        inventoryValues.push(body.location)
        invParamIndex++
      }
      if (body.box_id !== undefined) {
        inventoryUpdates.push(`box_id = $${invParamIndex}`)
        inventoryValues.push(body.box_id)
        invParamIndex++
      }
      if (body.quantity_available !== undefined) {
        inventoryUpdates.push(`quantity_available = $${invParamIndex}`)
        inventoryValues.push(body.quantity_available)
        invParamIndex++
      }

      if (inventoryUpdates.length > 0) {
        inventoryUpdates.push(`updated_at = NOW()`)
        inventoryValues.push(productId)

        await query(
          `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
           SET ${inventoryUpdates.join(', ')}
           WHERE ai_product_id = $${invParamIndex}`,
          inventoryValues
        )
      }
    }

    // Handle image update if provided
    let imageUrl: string | null = null
    if (body.image && typeof body.image === 'string') {
      // Get existing image to delete
      const existingImage = await query<{ id: string; file_path: string }>(
        `SELECT id, file_path FROM ${TABLE_NAMES.PRODUCT_IMAGES}
         WHERE product_id = $1 AND is_primary = true`,
        [productId]
      )

      // Get item_uuid for filename
      const productInfo = await query<{ item_uuid: string }>(
        `SELECT item_uuid FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1`,
        [productId]
      )
      const itemUuid = productInfo.rows[0]?.item_uuid || productId

      // Upload new image
      const filename = `${itemUuid}.jpg`
      const uploadResult = await uploadImage(body.image as string, filename, 'products')

      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url

        // Delete old blob if it was a blob URL
        if (existingImage.rows.length > 0) {
          const oldUrl = existingImage.rows[0].file_path
          if (oldUrl.includes('blob.vercel-storage.com')) {
            await deleteImage(oldUrl)
          }

          // Update existing image record
          await query(
            `UPDATE ${TABLE_NAMES.PRODUCT_IMAGES}
             SET file_path = $1, filename = $2, updated_at = NOW()
             WHERE id = $3`,
            [uploadResult.url, filename, existingImage.rows[0].id]
          )
        } else {
          // Create new image record
          await query(
            `INSERT INTO ${TABLE_NAMES.PRODUCT_IMAGES} (
              product_id, filename, file_path, is_primary, uploaded_by, upload_status
            ) VALUES ($1, $2, $3, true, $4, 'ready')`,
            [productId, filename, uploadResult.url, session.user.id]
          )
        }

        logger.info('Product image updated', { productId, imageUrl: uploadResult.url })
      }
    }

    logger.info('Inventory product updated', {
      productId,
      updatedFields: Object.keys(body).filter(k => allowedFields.includes(k)),
      updatedBy: session.user.id,
    })

    return apiSuccess({ success: true, product: result.rows[0], image_url: imageUrl })
  } catch (error) {
    logger.error('Failed to update inventory product', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Produkts')
  }
})

/**
 * PATCH /api/admin/inventory/[id]
 * Quick status updates (publish/unpublish, approve/reject)
 */
export const PATCH = withAdmin<{ id: string }>(async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const body = await request.json() as {
      marketplace_status?: 'draft' | 'published'
      status?: 'pending_review' | 'approved' | 'rejected'
    }

    // Handle marketplace_status change (publish/unpublish)
    if (body.marketplace_status !== undefined) {
      // Update inventory_items.marketplace_status
      await query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET marketplace_status = $1, updated_at = NOW()
         WHERE ai_product_id = $2`,
        [body.marketplace_status, productId]
      )

      // If publishing, also ensure product is approved and create marketplace listing
      if (body.marketplace_status === 'published') {
        // Ensure product is approved
        await query(
          `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
           SET status = 'approved', updated_at = NOW()
           WHERE id = $1`,
          [productId]
        )

        // Get product info for marketplace listing
        const productInfo = await query<{
          brand: string
          product_name: string
          short_description: string | null
          estimated_price_chf: number
        }>(
          `SELECT brand, product_name, short_description, estimated_price_chf
           FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
           WHERE id = $1`,
          [productId]
        )

        if (productInfo.rows.length > 0) {
          const p = productInfo.rows[0]

          // Get inventory item id
          const inventoryItem = await query<{ id: string }>(
            `SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1`,
            [productId]
          )

          if (inventoryItem.rows.length > 0) {
            const inventoryItemId = inventoryItem.rows[0].id

            // Check if listing exists
            const existingListing = await query<{ id: string }>(
              `SELECT id FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS}
               WHERE inventory_item_id = $1 AND platform = 'internal'`,
              [inventoryItemId]
            )

            if (existingListing.rows.length > 0) {
              // Update existing listing
              await query(
                `UPDATE ${TABLE_NAMES.MARKETPLACE_LISTINGS}
                 SET status = 'published', published_at = NOW(), updated_at = NOW()
                 WHERE id = $1`,
                [existingListing.rows[0].id]
              )
            } else {
              // Create new listing
              await query(
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
                  `${p.brand} ${p.product_name}`,
                  p.short_description || '',
                  p.estimated_price_chf,
                  session.user.id,
                ]
              )
            }
          }
        }

        logger.info('Product published', {
          productId,
          publishedBy: session.user.id,
        })
      } else {
        // Unpublishing - update marketplace listing status
        await query(
          `UPDATE ${TABLE_NAMES.MARKETPLACE_LISTINGS}
           SET status = 'draft', updated_at = NOW()
           WHERE inventory_item_id = (
             SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1
           )`,
          [productId]
        )

        logger.info('Product unpublished', {
          productId,
          unpublishedBy: session.user.id,
        })
      }
    }

    // Handle product status change (approve/reject)
    if (body.status !== undefined) {
      await query(
        `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [body.status, productId]
      )

      logger.info('Product status changed', {
        productId,
        newStatus: body.status,
        changedBy: session.user.id,
      })
    }

    return apiSuccess({
      success: true,
      productId,
      marketplace_status: body.marketplace_status,
      status: body.status,
    })
  } catch (error) {
    logger.error('Failed to patch inventory product', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Produkts')
  }
})
