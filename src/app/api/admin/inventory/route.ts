/**
 * Inventory Products List API
 *
 * GET /api/admin/inventory
 * Lists all products from the ai_extracted_products table with inventory data
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, parsePagination } from '@/lib/api/helpers'
import { db } from '@/db'
import { aiExtractedProducts, inventoryItems, productCustomerProfiles, customerProfiles } from '@/db/schema'
import { and, eq, ilike, or, sql, desc, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { MARKETPLACE_STATUS } from '@/config/marketplace-status'

export const GET = withAdmin('products', async (request: NextRequest, session) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const { limit, offset } = parsePagination(request)
    const status = searchParams.get('status') // pending_review, approved, draft
    const search = searchParams.get('search')

    // Build conditions
    const conditions = []
    if (status) conditions.push(eq(aiExtractedProducts.status, status))
    if (search) {
      const pattern = `%${search}%`
      conditions.push(or(
        ilike(aiExtractedProducts.productName, pattern),
        ilike(aiExtractedProducts.brand, pattern),
        ilike(aiExtractedProducts.model, pattern),
        ilike(sql`CAST(${aiExtractedProducts.id} AS TEXT)`, pattern)
      ))
    }

    const where = conditions.length > 1
      ? and(...conditions)
      : conditions[0] ?? undefined

    // Fetch products with inventory data
    const productRows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: aiExtractedProducts.id,
        product_name: aiExtractedProducts.productName,
        brand: aiExtractedProducts.brand,
        model: aiExtractedProducts.model,
        short_description: sql<string | null>`${aiExtractedProducts.specifications}->>'short_description'`,
        estimated_price_chf: aiExtractedProducts.estimatedPriceChf,
        condition: aiExtractedProducts.condition,
        category: aiExtractedProducts.category,
        subcategory: aiExtractedProducts.subcategory,
        status: aiExtractedProducts.status,
        created_at: aiExtractedProducts.createdAt,
        item_uuid: aiExtractedProducts.itemUuid,
        location: inventoryItems.location,
        box_id: inventoryItems.boxId,
        quantity_available: sql<number>`COALESCE(${inventoryItems.quantityAvailable}, 1)`,
        marketplace_status: sql<string>`COALESCE(${inventoryItems.marketplaceStatus}, ${MARKETPLACE_STATUS.DRAFT})`,
        kivitendo_article_number: aiExtractedProducts.kivitendoArticleNumber,
      })
      .from(aiExtractedProducts)
      .leftJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(where)
      .orderBy(desc(aiExtractedProducts.createdAt))
      .limit(limit)
      .offset(offset)

    const total = Number(productRows[0]?._total ?? 0)

    // Fetch customer profiles for each product
    const productIds = productRows.map(p => p.id)
    let profilesMap: Record<string, string[]> = {}

    if (productIds.length > 0) {
      const profilesResult = await db
        .select({
          product_id: productCustomerProfiles.productId,
          slug: customerProfiles.slug,
        })
        .from(productCustomerProfiles)
        .innerJoin(customerProfiles, eq(customerProfiles.id, productCustomerProfiles.profileId))
        .where(inArray(productCustomerProfiles.productId, productIds))

      profilesMap = profilesResult.reduce((acc, row) => {
        if (!acc[row.product_id]) {
          acc[row.product_id] = []
        }
        acc[row.product_id].push(row.slug)
        return acc
      }, {} as Record<string, string[]>)
    }

    // Combine products with profiles
    const products = productRows.map(({ _total, ...product }) => ({
      ...product,
      customer_profiles: profilesMap[product.id] || [],
    }))

    logger.info('Inventory products fetched', {
      userId: session.user.id,
      count: products.length,
      total,
    })

    return apiSuccess({
      products,
      total,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Failed to fetch inventory products', { error })
    return apiError(error, 'Fehler beim Laden der Produkte')
  }
})
