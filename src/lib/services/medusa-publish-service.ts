/**
 * Medusa Publish Service
 *
 * Creates products in Medusa from inventory items.
 * Stores both medusa_product_id and medusa_variant_id on the inventory item
 * so the cart API can add items by variant_id.
 */

import { query } from '@/lib/auth/db'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface AIProductRow {
  id: string
  product_name: string
  brand: string | null
  category: string | null
  condition: string | null
  specifications: Record<string, unknown> | null
  color: string | null
  material: string | null
  dimensions: {
    width?: number
    height?: number
    depth?: number
    unit?: string
  } | null
  weight_grams: number | null
}

interface ProductImageRow {
  id: string
  filename: string
  file_path: string
}

interface InventoryWithProduct {
  id: string
  kivitendo_article_number: string
  selling_price_chf: number | null
  quantity_available: number | null
  condition_override: string | null
  ai_product_id: string
  // Joined fields from AI product
  product_name: string
  brand: string | null
  category: string | null
  condition: string | null
  specifications: Record<string, unknown> | null
  color: string | null
  material: string | null
  dimensions: Record<string, unknown> | null
  weight_grams: number | null
}

export interface PublishToMedusaResult {
  medusa_product_id: string
  medusa_variant_id: string
  handle: string
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Publish an inventory item to Medusa.
 *
 * Fetches the inventory item + AI product data, creates the product in
 * Medusa Admin API, stores both medusa_product_id and medusa_variant_id,
 * and creates a marketplace listing record.
 *
 * Returns null on failure (logged, not thrown) so callers can fire-and-forget.
 */
export async function publishToMedusa(
  inventoryItemId: string,
  userId: string,
): Promise<PublishToMedusaResult | null> {
  try {
    // Fetch inventory item with AI product data
    const itemResult = await query<InventoryWithProduct>(
      `SELECT
        i.id,
        i.kivitendo_article_number,
        i.selling_price_chf,
        i.quantity_available,
        i.condition_override,
        i.ai_product_id,
        p.product_name,
        p.brand,
        p.category,
        p.condition,
        p.specifications,
        p.color,
        p.material,
        p.dimensions,
        p.weight_grams
      FROM ${TABLE_NAMES.INVENTORY_ITEMS} i
      JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p ON p.id = i.ai_product_id
      WHERE i.id = $1`,
      [inventoryItemId],
    )

    const item = itemResult.rows[0]
    if (!item) {
      logger.warn('publishToMedusa: inventory item not found', { inventoryItemId })
      return null
    }

    // Fetch product images
    const imagesResult = await query<ProductImageRow>(
      `SELECT id, filename, file_path
       FROM ${TABLE_NAMES.PRODUCT_IMAGES}
       WHERE product_id = $1
       ORDER BY is_primary DESC`,
      [item.ai_product_id],
    )

    const aiProduct: AIProductRow = {
      id: item.ai_product_id,
      product_name: item.product_name,
      brand: item.brand,
      category: item.category,
      condition: item.condition,
      specifications: item.specifications,
      color: item.color,
      material: item.material,
      dimensions: item.dimensions as AIProductRow['dimensions'],
      weight_grams: item.weight_grams,
    }

    const images = imagesResult.rows

    // Build Medusa product payload
    const handle = generateHandle(
      aiProduct.product_name || 'unnamed',
      item.kivitendo_article_number,
    )

    const medusaProductData = {
      title: aiProduct.product_name || 'Unnamed Product',
      description: generateProductDescription(aiProduct),
      handle,
      status: 'published',
      is_giftcard: false,
      discountable: true,
      thumbnail: images[0]?.file_path || undefined,
      collection_id: await getOrCreateCollection(aiProduct.category || 'general') || undefined,
      type_id: await getOrCreateType('physical') || undefined,
      tags: generateTags(aiProduct),
      variants: [{
        title: 'Default Variant',
        sku: item.kivitendo_article_number,
        inventory_quantity: item.quantity_available || 1,
        prices: [{
          amount: Math.round((item.selling_price_chf || 0) * 100),
          currency_code: 'chf',
        }],
      }],
      images: images.map((img) => ({ url: img.file_path })),
      metadata: {
        kivitendo_article_number: item.kivitendo_article_number,
        condition: item.condition_override || aiProduct.condition,
        brand: aiProduct.brand,
        ai_extracted: true,
        sustainability_score: await getSustainabilityScore(aiProduct.id),
      },
    }

    // Create product in Medusa Admin API
    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
        'Authorization': `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify(medusaProductData),
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      logger.error('publishToMedusa: Medusa product creation failed', {
        inventoryItemId,
        status: createResponse.status,
        error: errorData,
      })
      return null
    }

    const medusaProduct = await createResponse.json()
    const medusaProductId = medusaProduct.product.id
    const medusaVariantId = medusaProduct.product.variants[0]?.id

    if (!medusaVariantId) {
      logger.error('publishToMedusa: No variant ID in Medusa response', {
        inventoryItemId,
        medusaProductId,
      })
      return null
    }

    // Store both IDs on the inventory item
    await query(
      `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
       SET medusa_product_id = $1,
           medusa_variant_id = $2,
           marketplace_status = 'published'
       WHERE id = $3`,
      [medusaProductId, medusaVariantId, inventoryItemId],
    )

    // Create marketplace listing record
    await query(
      `INSERT INTO ${TABLE_NAMES.MARKETPLACE_LISTINGS} (
        inventory_item_id,
        platform,
        platform_listing_id,
        platform_url,
        title,
        description,
        price_chf,
        status,
        created_by
      ) VALUES ($1, 'medusa', $2, $3, $4, $5, $6, 'published', $7)`,
      [
        inventoryItemId,
        medusaProductId,
        `${process.env.NEXT_PUBLIC_SITE_URL || ''}/shop/products/${handle}`,
        aiProduct.product_name || 'Unnamed Product',
        generateProductDescription(aiProduct),
        item.selling_price_chf,
        userId,
      ],
    )

    logger.info('Product published to Medusa', {
      inventoryItemId,
      medusaProductId,
      medusaVariantId,
      handle,
    })

    return { medusa_product_id: medusaProductId, medusa_variant_id: medusaVariantId, handle }
  } catch (error) {
    logger.error('publishToMedusa: unexpected error', { inventoryItemId, error })
    return null
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getAdminToken(): string {
  const token = MEDUSA_CONFIG.ADMIN_API_KEY
  if (!token) {
    throw new Error("MEDUSA_ADMIN_API_KEY not found. Run 'npm run medusa:bootstrap' first.")
  }
  return token
}

function generateHandle(productName: string, articleNumber: string): string {
  const baseHandle = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  return `${baseHandle}-${articleNumber}`
}

function generateProductDescription(aiProduct: AIProductRow): string {
  let description = aiProduct.product_name

  if (aiProduct.brand) {
    description += ` von ${aiProduct.brand}`
  }

  description += '.'

  if (aiProduct.specifications && Object.keys(aiProduct.specifications).length > 0) {
    description += '\n\nTechnische Daten:\n'
    Object.entries(aiProduct.specifications).forEach(([key, value]) => {
      description += `• ${key}: ${String(value)}\n`
    })
  }

  const properties = []
  if (aiProduct.color) properties.push(`Farbe: ${aiProduct.color}`)
  if (aiProduct.material) properties.push(`Material: ${aiProduct.material}`)
  if (aiProduct.weight_grams) properties.push(`Gewicht: ${aiProduct.weight_grams}g`)
  if (aiProduct.dimensions) {
    const dims = aiProduct.dimensions
    if (dims.width && dims.height && dims.depth) {
      properties.push(`Abmessungen: ${dims.width} × ${dims.height} × ${dims.depth} ${dims.unit || 'cm'}`)
    }
  }

  if (properties.length > 0) {
    description += '\n\nEigenschaften:\n' + properties.map(p => `• ${p}`).join('\n')
  }

  return description
}

async function getOrCreateCollection(category: string): Promise<string> {
  const adminToken = getAdminToken()

  try {
    const listResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/collections?limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
    })

    if (listResponse.ok) {
      const listData = await listResponse.json() as { collections?: Array<{ id: string; title: string }> }
      const existing = listData.collections?.find(
        (c) => c.title.toLowerCase() === category.toLowerCase(),
      )
      if (existing) return existing.id
    }

    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        title: category,
        handle: category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        metadata: { source: 'ai_inventory_sync' },
      }),
    })

    if (createResponse.ok) {
      const createData = await createResponse.json()
      return createData.collection.id
    }

    logger.warn(`Failed to create collection "${category}"`)
  } catch (error) {
    logger.error('Error managing collection', { error, category })
  }

  return ''
}

async function getOrCreateType(type: string): Promise<string> {
  const adminToken = getAdminToken()

  try {
    const listResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/product-types?limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
    })

    if (listResponse.ok) {
      const listData = await listResponse.json() as { product_types?: Array<{ id: string; value: string }> }
      const existing = listData.product_types?.find(
        (t) => t.value.toLowerCase() === type.toLowerCase(),
      )
      if (existing) return existing.id
    }

    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/product-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        value: type,
        metadata: { source: 'ai_inventory_sync' },
      }),
    })

    if (createResponse.ok) {
      const createData = await createResponse.json()
      return createData.product_type.id
    }

    logger.warn(`Failed to create product type "${type}"`)
  } catch (error) {
    logger.error('Error managing product type', { error, type })
  }

  return ''
}

function generateTags(aiProduct: AIProductRow): Array<{ value: string }> {
  const tags: Array<{ value: string }> = []

  if (aiProduct.brand) tags.push({ value: aiProduct.brand.toLowerCase() })
  if (aiProduct.category) tags.push({ value: aiProduct.category.toLowerCase() })
  if (aiProduct.color) tags.push({ value: `color-${aiProduct.color.toLowerCase()}` })
  if (aiProduct.condition) tags.push({ value: `condition-${aiProduct.condition}` })

  return tags
}

async function getSustainabilityScore(aiProductId: string): Promise<number> {
  try {
    const result = await query<{ overall_score: number }>(
      `SELECT overall_score FROM ${TABLE_NAMES.SUSTAINABILITY_SCORES}
       WHERE product_id = $1`,
      [aiProductId],
    )
    return result.rows[0]?.overall_score || 75
  } catch (error) {
    logger.warn('Error fetching sustainability score', { error, aiProductId })
    return 75
  }
}
