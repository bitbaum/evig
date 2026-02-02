/**
 * Inventory Product Detail API
 *
 * GET /api/admin/inventory/[id]
 * Fetches detailed inventory product information including customer profiles
 * Used by the factsheet/label template
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError, apiNotFound, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    const { id: productId } = await params

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
}

/**
 * DELETE /api/admin/inventory/[id]
 * Deletes an inventory product and all related records
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    // Check permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }
    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung')
    }

    const { id: productId } = await params

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

    // 3. Delete marketplace listings
    await query(
      `DELETE FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} WHERE ai_product_id = $1`,
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
}

/**
 * PUT /api/admin/inventory/[id]
 * Updates an inventory product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht angemeldet')
    }

    // Check permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }
    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung')
    }

    const { id: productId } = await params
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

    logger.info('Inventory product updated', {
      productId,
      updatedFields: Object.keys(body).filter(k => allowedFields.includes(k)),
      updatedBy: session.user.id,
    })

    return apiSuccess({ success: true, product: result.rows[0] })
  } catch (error) {
    logger.error('Failed to update inventory product', { error })
    return apiError(error, 'Fehler beim Aktualisieren des Produkts')
  }
}
