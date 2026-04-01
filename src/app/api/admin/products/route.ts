import { NextRequest } from "next/server"
import { db } from "@/db"
import { aiExtractedProducts, inventoryItems } from "@/db/schema"
import { eq, and, or, ilike, sql, desc } from "drizzle-orm"
import { withAdmin } from '@/lib/api/middleware'
import { logger } from "@/lib/logger"
import { apiError, apiSuccess } from "@/lib/api/helpers"
import { MARKETPLACE_STATUS } from '@/config/marketplace-status'
import { validateBody, AdminCreateProductSchema } from '@/lib/schemas'

// GET /api/admin/products - List all products for admin
export const GET = withAdmin('products', async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const status = searchParams.get("status")
    const q = searchParams.get("q")

    // Build dynamic filters
    const filters = []
    if (status) filters.push(eq(aiExtractedProducts.status, status))
    if (q) {
      filters.push(
        or(
          ilike(aiExtractedProducts.productName, `%${q}%`),
          ilike(aiExtractedProducts.brand, `%${q}%`)
        )!
      )
    }
    const where = filters.length > 0 ? and(...filters) : undefined

    // Single query with COUNT(*) OVER() for pagination
    const productRows = await db
      .select({
        _total: sql<number>`count(*) over()`,
        id: aiExtractedProducts.id,
        item_uuid: aiExtractedProducts.itemUuid,
        product_name: aiExtractedProducts.productName,
        brand: aiExtractedProducts.brand,
        short_description: aiExtractedProducts.shortDescription,
        estimated_price_chf: aiExtractedProducts.estimatedPriceChf,
        condition: aiExtractedProducts.condition,
        category: aiExtractedProducts.category,
        subcategory: aiExtractedProducts.subcategory,
        status: aiExtractedProducts.status,
        quantity_available: inventoryItems.quantityAvailable,
        marketplace_status: inventoryItems.marketplaceStatus,
        created_at: aiExtractedProducts.createdAt,
      })
      .from(aiExtractedProducts)
      .leftJoin(inventoryItems, eq(inventoryItems.aiProductId, aiExtractedProducts.id))
      .where(where)
      .orderBy(desc(aiExtractedProducts.createdAt))
      .limit(limit)
      .offset(offset)

    const totalCount = productRows[0]?._total ?? 0;
    const products = productRows.map(({ _total, ...rest }) => rest);

    return apiSuccess({
      products,
      count: Number(totalCount),
      limit,
      offset,
    })
  } catch (error) {
    logger.error("Failed to fetch products", { error })
    return apiError(error, "Fehler beim Laden der Produkte")
  }
})

// POST /api/admin/products - Create new product
export const POST = withAdmin('products', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(AdminCreateProductSchema, body)
    if (!validation.success) return validation.error
    const data = validation.data

    const [product] = await db
      .insert(aiExtractedProducts)
      .values({
        itemUuid: sql`gen_random_uuid()::text`,
        productName: data.title || data.product_name,
        brand: data.brand || '',
        shortDescription: data.description || data.short_description || '',
        estimatedPriceChf: String(data.price || data.estimated_price_chf || 0),
        condition: data.condition || 'unknown',
        category: data.category || null,
        subcategory: data.subcategory || null,
        status: MARKETPLACE_STATUS.DRAFT,
      })
      .returning({ id: aiExtractedProducts.id })

    // Create inventory item
    await db
      .insert(inventoryItems)
      .values({
        aiProductId: product.id,
        quantityAvailable: data.quantity || 1,
        marketplaceStatus: 'draft',
      })

    logger.info("Product created", { productId: product.id, user: session.user?.email })

    return apiSuccess({ id: product.id }, 201)
  } catch (error) {
    logger.error("Failed to create product", { error })
    return apiError(error, "Fehler beim Erstellen des Produkts")
  }
})
