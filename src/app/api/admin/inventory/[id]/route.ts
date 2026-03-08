/**
 * Inventory Product Detail API
 *
 * GET    /api/admin/inventory/[id] - Fetch product details
 * DELETE /api/admin/inventory/[id] - Delete product + related records
 * PUT    /api/admin/inventory/[id] - Update product fields + image
 * PATCH  /api/admin/inventory/[id] - Quick status updates (publish/unpublish)
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { INTAKE_STATUS } from '@/config/intake-status'
import { publishProduct, unpublishProduct, updateProductImage } from '@/lib/admin/inventory-actions'

export const GET = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

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
        p.id, p.item_uuid, p.product_name, p.brand, p.short_description,
        p.specifications, p.estimated_price_chf, p.condition, p.dimensions,
        p.weight_grams, p.category, p.subcategory, p.created_at,
        i.location, i.box_id,
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

    const profilesResult = await query<{ slug: string }>(
      `SELECT cp.slug
       FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp
       JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id
       WHERE pcp.product_id = $1`,
      [productId]
    )

    const imageResult = await query<{ file_path: string }>(
      `SELECT file_path FROM ${TABLE_NAMES.PRODUCT_IMAGES}
       WHERE product_id = $1 AND is_primary = true LIMIT 1`,
      [productId]
    )

    logger.info('Inventory product fetched for factsheet', {
      productId, itemUuid: product.item_uuid, userId: session.user.id,
    })

    return apiSuccess({
      product: {
        ...product,
        customer_profiles: profilesResult.rows.map(r => r.slug),
        image_url: imageResult.rows[0]?.file_path ?? null,
      },
    })
  } catch (error) {
    logger.error('Failed to fetch inventory product', { error })
    return apiError(error, 'Fehler beim Laden des Produkts')
  }
})

export const DELETE = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!

    // Delete child tables first, then main record
    await query(`DELETE FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} WHERE product_id = $1`, [productId])
    await query(`DELETE FROM ${TABLE_NAMES.PRODUCT_IMAGES} WHERE product_id = $1`, [productId])
    await query(
      `DELETE FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS}
       WHERE inventory_item_id IN (
         SELECT id FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1
       )`,
      [productId]
    )
    await query(`DELETE FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1`, [productId])

    const result = await query<{ id: string; item_uuid: string }>(
      `DELETE FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1 RETURNING id, item_uuid`,
      [productId]
    )

    if (result.rowCount === 0) {
      return apiNotFound('Produkt nicht gefunden')
    }

    logger.info('Inventory product deleted', {
      productId, itemUuid: result.rows[0].item_uuid, deletedBy: session.user.id,
    })

    return apiSuccess({ success: true, deleted: result.rows[0] })
  } catch (error) {
    logger.error('Failed to delete inventory product', { error })
    return apiError(error, 'Fehler beim Löschen des Produkts')
  }
})

export const PUT = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const body = await request.json() as Record<string, unknown>

    // Build dynamic update for product fields
    const allowedFields = [
      'product_name', 'brand', 'short_description', 'specifications',
      'estimated_price_chf', 'condition', 'category', 'subcategory',
      'dimensions', 'weight_grams', 'status',
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

    updates.push(`updated_at = NOW()`)
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

    // Update inventory item if location/quantity fields provided
    if (body.location !== undefined || body.box_id !== undefined || body.quantity_available !== undefined) {
      const invUpdates: string[] = []
      const invValues: unknown[] = []
      let invIdx = 1

      if (body.location !== undefined) { invUpdates.push(`location = $${invIdx}`); invValues.push(body.location); invIdx++ }
      if (body.box_id !== undefined) { invUpdates.push(`box_id = $${invIdx}`); invValues.push(body.box_id); invIdx++ }
      if (body.quantity_available !== undefined) { invUpdates.push(`quantity_available = $${invIdx}`); invValues.push(body.quantity_available); invIdx++ }

      if (invUpdates.length > 0) {
        invUpdates.push(`updated_at = NOW()`)
        invValues.push(productId)
        await query(
          `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
           SET ${invUpdates.join(', ')}
           WHERE ai_product_id = $${invIdx}`,
          invValues
        )
      }
    }

    // Handle image update
    let imageUrl: string | null = null
    if (body.image && typeof body.image === 'string') {
      imageUrl = await updateProductImage(productId, body.image, session.user.id)
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

export const PATCH = withAdmin<{ id: string }>('products', async (request, session, context) => {
  try {
    const { id: productId } = context!.params!
    const body = await request.json() as {
      marketplace_status?: 'draft' | 'published'
      status?: 'pending_review' | 'approved' | 'rejected'
    }

    // Handle marketplace publish/unpublish
    if (body.marketplace_status !== undefined) {
      await query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET marketplace_status = $1, updated_at = NOW()
         WHERE ai_product_id = $2`,
        [body.marketplace_status, productId]
      )

      if (body.marketplace_status === INTAKE_STATUS.PUBLISHED) {
        await publishProduct(productId, session.user.id)
      } else {
        await unpublishProduct(productId, session.user.id)
      }
    }

    // Handle product status change
    if (body.status !== undefined) {
      await query(
        `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [body.status, productId]
      )

      logger.info('Product status changed', {
        productId, newStatus: body.status, changedBy: session.user.id,
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
