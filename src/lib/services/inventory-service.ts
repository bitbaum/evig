/**
 * Inventory Service
 *
 * Business logic for the public shop inventory.
 * Handles query building, product fetching, profile resolution,
 * and response mapping for published marketplace products.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

export interface InventoryFilters {
  limit: number
  offset: number
  category?: string
  search?: string
  profile?: string
}

interface ProductRow {
  id: string
  item_uuid: string
  product_name: string
  brand: string
  short_description: string | null
  estimated_price_chf: number
  condition: string
  category: string | null
  subcategory: string | null
  quantity_available: number
  image_url: string | null
}

interface ProfileRow {
  product_id: string
  slug: string
  name_de: string
  color: string
}

export interface CustomerProfile {
  slug: string
  name_de: string
  color: string
}

export interface InventoryProduct {
  id: string
  item_uuid: string
  title: string
  brand: string
  model: string
  description: string | null
  price: number
  condition: string
  category: string | null
  subcategory: string | null
  quantity: number
  image_url: string | null
  customer_profiles: CustomerProfile[]
}

export interface InventoryResult {
  products: InventoryProduct[]
  total: number
  limit: number
  offset: number
}

// ============================================================================
// Query Building
// ============================================================================

interface BuiltQuery {
  whereClause: string
  profileJoin: string
  params: (string | number)[]
  nextParamIndex: number
}

/**
 * Build WHERE clause and JOINs from filters.
 * Only returns published, approved products with available stock.
 */
function buildInventoryQuery(filters: InventoryFilters): BuiltQuery {
  const conditions: string[] = [
    `i.marketplace_status = '${APPROVAL_STATUS.PUBLISHED}'`,
    `p.status = '${APPROVAL_STATUS.APPROVED}'`,
    'i.quantity_available > 0',
  ]
  const params: (string | number)[] = []
  let paramIndex = 1

  if (filters.category) {
    conditions.push(`(p.category ILIKE $${paramIndex} OR p.subcategory ILIKE $${paramIndex})`)
    params.push(`%${filters.category}%`)
    paramIndex++
  }

  if (filters.search) {
    conditions.push(`(
      p.product_name ILIKE $${paramIndex}
      OR p.brand ILIKE $${paramIndex}
      OR p.short_description ILIKE $${paramIndex}
    )`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }

  let profileJoin = ''
  if (filters.profile) {
    profileJoin = `
      JOIN ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp ON pcp.product_id = p.id
      JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id AND cp.slug = $${paramIndex}
    `
    params.push(filters.profile)
    paramIndex++
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    profileJoin,
    params,
    nextParamIndex: paramIndex,
  }
}

// ============================================================================
// Profile Fetching
// ============================================================================

/**
 * Fetch customer profiles for a list of product IDs.
 * Returns a map of product_id -> profiles array.
 */
async function fetchProfilesForProducts(
  productIds: string[]
): Promise<Record<string, CustomerProfile[]>> {
  if (productIds.length === 0) return {}

  const profilesResult = await query<ProfileRow>(
    `SELECT pcp.product_id, cp.slug, cp.name_de, cp.color
     FROM ${TABLE_NAMES.PRODUCT_CUSTOMER_PROFILES} pcp
     JOIN ${TABLE_NAMES.CUSTOMER_PROFILES} cp ON cp.id = pcp.profile_id
     WHERE pcp.product_id = ANY($1)`,
    [productIds]
  )

  return profilesResult.rows.reduce((acc, row) => {
    if (!acc[row.product_id]) {
      acc[row.product_id] = []
    }
    acc[row.product_id].push({
      slug: row.slug,
      name_de: row.name_de,
      color: row.color,
    })
    return acc
  }, {} as Record<string, CustomerProfile[]>)
}

// ============================================================================
// Product Mapping
// ============================================================================

/**
 * Map raw product rows + profiles into the public API shape.
 */
function mapProducts(
  rows: ProductRow[],
  profilesMap: Record<string, CustomerProfile[]>
): InventoryProduct[] {
  return rows.map((product) => ({
    id: product.id,
    item_uuid: product.item_uuid,
    title: `${product.brand} ${product.product_name}`,
    brand: product.brand,
    model: product.product_name,
    description: product.short_description,
    price: parseFloat(product.estimated_price_chf?.toString() || '0'),
    condition: product.condition,
    category: product.category,
    subcategory: product.subcategory,
    quantity: product.quantity_available,
    image_url: product.image_url,
    customer_profiles: profilesMap[product.id] || [],
  }))
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get published inventory products with optional filtering.
 * This is the main entry point for the public shop.
 */
export async function getInventoryProducts(
  filters: InventoryFilters
): Promise<InventoryResult> {
  try {
    const { whereClause, profileJoin, params, nextParamIndex } =
      buildInventoryQuery(filters)

    // Fetch products
    const productsResult = await query<ProductRow>(
      `SELECT DISTINCT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.estimated_price_chf,
        p.condition,
        p.category,
        p.subcategory,
        i.quantity_available,
        (SELECT file_path FROM ${TABLE_NAMES.PRODUCT_IMAGES} pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as image_url,
        p.created_at
      FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
      JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
      ${profileJoin}
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`,
      [...params, filters.limit, filters.offset]
    )

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
       JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
       ${profileJoin}
       ${whereClause}`,
      params
    )

    const total = parseInt(countResult.rows[0]?.count || '0')

    // Fetch profiles for the returned products
    const productIds = productsResult.rows.map((p) => p.id)
    const profilesMap = await fetchProfilesForProducts(productIds)

    // Map to public shape
    const products = mapProducts(productsResult.rows, profilesMap)

    logger.info('Shop inventory products fetched', {
      count: products.length,
      total,
      filters: {
        category: filters.category,
        search: filters.search,
        profile: filters.profile,
      },
    })

    return { products, total, limit: filters.limit, offset: filters.offset }
  } catch (error) {
    logger.error('Failed to fetch inventory products', { error })
    throw error
  }
}
