/**
 * Marketplace Products API
 * GET /api/marketplace/products - Get all published marketplace products
 * POST /api/marketplace/products - Create new marketplace product (requires auth)
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { requireAuth } from '@/middleware/auth'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

interface MarketplaceProductRow {
  id: string
  inventory_item_id: string
  title: string
  description: string
  price_chf: number
  status: string
  is_featured: boolean
  views_count: number
  favorites_count: number
  published_at: string
  created_at: string
  // From inventory_items
  location: string
  condition: string
  quantity_available: number
  selling_price_chf: number
  // From ai_extracted_products
  brand: string
  model: string
  category: string
  subcategory: string
  original_image_url: string
  // From users
  seller_id: string
  seller_name: string
  seller_email: string
  // From seller_profiles (if exists)
  seller_verified: boolean
  seller_rating: number
}

// GET /api/marketplace/products - Get all marketplace products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')
    const location = searchParams.get('location')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sellerType = searchParams.get('sellerType') // 'official' | 'community'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build dynamic query with filters
    const conditions: string[] = ['ml.status = $1']
    const params: (string | number)[] = ['published']
    let paramIndex = 2

    if (category) {
      conditions.push(`aep.category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    if (condition) {
      conditions.push(`COALESCE(ii.condition_override, aep.condition) = $${paramIndex}`)
      params.push(condition)
      paramIndex++
    }

    if (location) {
      conditions.push(`LOWER(ii.location) LIKE $${paramIndex}`)
      params.push(`%${location.toLowerCase()}%`)
      paramIndex++
    }

    if (minPrice) {
      conditions.push(`ml.price_chf >= $${paramIndex}`)
      params.push(parseFloat(minPrice))
      paramIndex++
    }

    if (maxPrice) {
      conditions.push(`ml.price_chf <= $${paramIndex}`)
      params.push(parseFloat(maxPrice))
      paramIndex++
    }

    if (sellerType === 'official') {
      // RevampIT official products don't have a created_by user (or use admin account)
      conditions.push(`(ml.created_by IS NULL OR u.email LIKE '%@revampit.ch')`)
    } else if (sellerType === 'community') {
      conditions.push(`ml.created_by IS NOT NULL AND u.email NOT LIKE '%@revampit.ch'`)
    }

    if (search) {
      conditions.push(`(
        LOWER(ml.title) LIKE $${paramIndex} OR
        LOWER(ml.description) LIKE $${paramIndex} OR
        LOWER(aep.brand) LIKE $${paramIndex} OR
        LOWER(aep.model) LIKE $${paramIndex}
      )`)
      params.push(`%${search.toLowerCase()}%`)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    // Count total results
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} ml
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} ii ON ml.inventory_item_id = ii.id
       LEFT JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} aep ON ii.ai_product_id = aep.id
       LEFT JOIN ${TABLE_NAMES.USERS} u ON ml.created_by = u.id
       WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0]?.count || '0')

    // Get products with pagination
    params.push(limit, offset)
    const result = await query<MarketplaceProductRow>(
      `SELECT
        ml.id,
        ml.inventory_item_id,
        ml.title,
        ml.description,
        ml.price_chf,
        ml.status,
        ml.is_featured,
        ml.views_count,
        ml.favorites_count,
        ml.published_at,
        ml.created_at,
        ii.location,
        COALESCE(ii.condition_override, aep.condition) as condition,
        ii.quantity_available,
        ii.selling_price_chf,
        aep.brand,
        aep.model,
        aep.category,
        aep.subcategory,
        aep.original_image_url,
        u.id as seller_id,
        COALESCE(u.name, 'RevampIT') as seller_name,
        u.email as seller_email,
        CASE WHEN sp.id IS NOT NULL THEN sp.is_verified ELSE true END as seller_verified,
        COALESCE(sp.average_rating, 4.9) as seller_rating
       FROM ${TABLE_NAMES.MARKETPLACE_LISTINGS} ml
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} ii ON ml.inventory_item_id = ii.id
       LEFT JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} aep ON ii.ai_product_id = aep.id
       LEFT JOIN ${TABLE_NAMES.USERS} u ON ml.created_by = u.id
       LEFT JOIN ${TABLE_NAMES.SELLER_PROFILES} sp ON u.id = sp.user_id
       WHERE ${whereClause}
       ORDER BY ml.is_featured DESC, ml.published_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    )

    // Transform to frontend-friendly format
    const products = result.rows.map(row => ({
      id: row.id,
      inventoryItemId: row.inventory_item_id,
      title: row.title,
      description: row.description,
      price: parseFloat(String(row.price_chf)),
      originalPrice: row.selling_price_chf ? parseFloat(String(row.selling_price_chf)) : null,
      condition: row.condition || 'good',
      category: row.category || 'Allgemein',
      subcategory: row.subcategory,
      brand: row.brand,
      model: row.model,
      location: row.location || 'Schweiz',
      images: row.original_image_url ? [row.original_image_url] : [],
      seller: {
        id: row.seller_id,
        name: row.seller_name || 'RevampIT',
        verified: row.seller_verified ?? true,
        rating: parseFloat(String(row.seller_rating)) || 4.9,
      },
      isOfficial: !row.seller_id || (row.seller_email && row.seller_email.includes('@revampit.ch')),
      inStock: (row.quantity_available || 0) > 0,
      isFeatured: row.is_featured,
      viewsCount: row.views_count || 0,
      favoritesCount: row.favorites_count || 0,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    }))

    // Calculate stats
    const stats = {
      total,
      officialCount: products.filter(p => p.isOfficial).length,
      communityCount: products.filter(p => !p.isOfficial).length,
      averagePrice: products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
        : 0,
    }

    return apiSuccess({
      products,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch marketplace products', { error })
    return apiError(error, 'Produkte konnten nicht geladen werden')
  }
}

// POST /api/marketplace/products - Create new marketplace product
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()

    const productData = await request.json()

    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'category', 'condition']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return apiBadRequest(`${field} ist erforderlich`)
      }
    }

    // First create AI extracted product record
    const aiProductResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} (
        product_name, brand, model, category, condition, estimated_price_chf
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        productData.title,
        productData.brand || null,
        productData.model || null,
        productData.category,
        productData.condition,
        productData.price,
      ]
    )
    const aiProductId = aiProductResult.rows[0].id

    // Create inventory item
    const inventoryResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS} (
        ai_product_id, location, quantity_available, status, condition_override, selling_price_chf, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        aiProductId,
        productData.location || 'Schweiz',
        1,
        'available',
        productData.condition,
        productData.price,
        user.id,
      ]
    )
    const inventoryItemId = inventoryResult.rows[0].id

    // Create marketplace listing
    const listingResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.MARKETPLACE_LISTINGS} (
        inventory_item_id, title, description, price_chf, platform, status, published_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING id`,
      [
        inventoryItemId,
        productData.title,
        productData.description,
        productData.price,
        'revampit',
        'published',
        user.id,
      ]
    )

    logger.info('Marketplace product created', {
      listingId: listingResult.rows[0].id,
      userId: user.id,
      title: productData.title,
    })

    return apiSuccess({
      id: listingResult.rows[0].id,
      inventoryItemId,
      message: 'Produkt erfolgreich erstellt',
    }, 201)
  } catch (error) {
    logger.error('Failed to create marketplace product', { error })
    return apiError(error, 'Produkt konnte nicht erstellt werden')
  }
}
