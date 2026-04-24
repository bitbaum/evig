/**
 * Inventory Service
 *
 * Business logic for the public shop inventory.
 * Handles query building, product fetching, profile resolution,
 * and response mapping for published marketplace products.
 */

import { db } from '@/db'
import { sql, getTableName, type SQL } from 'drizzle-orm'
import { aiExtractedProducts, inventoryItems, productImages, productCustomerProfiles, customerProfiles } from '@/db/schema'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logger } from '@/lib/logger'

// Table name refs
const aepTable = getTableName(aiExtractedProducts)
const iiTable = getTableName(inventoryItems)
const piTable = getTableName(productImages)
const pcpTable = getTableName(productCustomerProfiles)
const cpTable = getTableName(customerProfiles)

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
  whereFragment: SQL
  profileJoinFragment: SQL
  params: (string | number)[]
}

/**
 * Build WHERE clause and JOINs from filters.
 * Only returns published, approved products with available stock.
 */
function buildInventoryQuery(filters: InventoryFilters): BuiltQuery {
  const conditions: SQL[] = [
    sql`i.marketplace_status = ${APPROVAL_STATUS.PUBLISHED}`,
    sql`p.status = ${APPROVAL_STATUS.APPROVED}`,
    sql`i.quantity_available > 0`,
  ]
  const params: (string | number)[] = []

  if (filters.category) {
    const catPattern = `%${filters.category}%`
    conditions.push(sql`(p.category ILIKE ${catPattern} OR p.subcategory ILIKE ${catPattern})`)
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`
    conditions.push(sql`(
      p.product_name ILIKE ${searchPattern}
      OR p.brand ILIKE ${searchPattern}
      OR p.short_description ILIKE ${searchPattern}
    )`)
  }

  let profileJoinFragment: SQL = sql``
  if (filters.profile) {
    profileJoinFragment = sql`
      JOIN ${sql.raw(pcpTable)} pcp ON pcp.product_id = p.id
      JOIN ${sql.raw(cpTable)} cp ON cp.id = pcp.profile_id AND cp.slug = ${filters.profile}
    `
  }

  // Combine conditions with AND
  let whereFragment = sql`WHERE ${conditions[0]}`
  for (let i = 1; i < conditions.length; i++) {
    whereFragment = sql`${whereFragment} AND ${conditions[i]}`
  }

  return {
    whereFragment,
    profileJoinFragment,
    params,
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

  const profilesResult = await db.execute(sql`
    SELECT pcp.product_id, cp.slug, cp.name_de, cp.color
    FROM ${sql.raw(pcpTable)} pcp
    JOIN ${sql.raw(cpTable)} cp ON cp.id = pcp.profile_id
    WHERE pcp.product_id IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})
  `)

  return (profilesResult.rows as unknown as ProfileRow[]).reduce((acc, row) => {
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
    const { whereFragment, profileJoinFragment } =
      buildInventoryQuery(filters)

    // Single query with COUNT(*) OVER() for pagination
    const productsResult = await db.execute(sql`
      SELECT DISTINCT
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
        (SELECT file_path FROM ${sql.raw(piTable)} pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as image_url,
        p.created_at,
        COUNT(DISTINCT p.id) OVER() AS _total_count
      FROM ${sql.raw(aepTable)} p
      JOIN ${sql.raw(iiTable)} i ON i.ai_product_id = p.id
      ${profileJoinFragment}
      ${whereFragment}
      ORDER BY p.created_at DESC
      LIMIT ${filters.limit} OFFSET ${filters.offset}
    `)

    const total = parseInt((productsResult.rows[0] as unknown as { _total_count: string })?._total_count || '0')

    // Fetch profiles for the returned products
    const productRows = productsResult.rows as unknown as ProductRow[]
    const productIds = productRows.map((p) => p.id)
    const profilesMap = await fetchProfilesForProducts(productIds)

    // Map to public shape
    const products = mapProducts(productRows, profilesMap)

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

/**
 * Get a single published inventory product by item_uuid.
 * Returns null if not found or not published.
 */
export async function getInventoryProductByUuid(
  itemUuid: string
): Promise<InventoryProduct | null> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT
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
        (SELECT file_path FROM ${sql.raw(piTable)} pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) as image_url
      FROM ${sql.raw(aepTable)} p
      JOIN ${sql.raw(iiTable)} i ON i.ai_product_id = p.id
      WHERE p.item_uuid = ${itemUuid}
        AND i.marketplace_status = ${APPROVAL_STATUS.PUBLISHED}
        AND p.status = ${APPROVAL_STATUS.APPROVED}
        AND i.quantity_available > 0
      LIMIT 1
    `)

    if (result.rows.length === 0) return null

    const productRow = result.rows[0] as unknown as ProductRow
    const profilesMap = await fetchProfilesForProducts([productRow.id])
    const [product] = mapProducts([productRow], profilesMap)
    return product ?? null
  } catch (error) {
    logger.error('Failed to fetch inventory product by uuid', { error, itemUuid })
    throw error
  }
}
