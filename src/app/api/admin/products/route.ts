import { NextRequest } from "next/server";
import { withAdmin } from '@/lib/api/middleware'
import { query } from "@/lib/auth/db";
import { TABLE_NAMES } from "@/config/database";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";
import { QueryParams } from '@/lib/api/query-builder';

// GET /api/admin/products - List all products for admin
export const GET = withAdmin(async (request, session) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const qb = new QueryParams();

    if (status) qb.add('p.status = $P', status);
    if (q) qb.add('(p.product_name ILIKE $P OR p.brand ILIKE $P)', `%${q}%`);

    const { where: whereClause, params, nextIndex } = qb.build();

    // Count total
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
       ${whereClause}`,
      params
    );

    // Fetch products
    const productsResult = await query<{
      id: string;
      item_uuid: string;
      product_name: string;
      brand: string;
      short_description: string | null;
      estimated_price_chf: number;
      condition: string;
      category: string | null;
      subcategory: string | null;
      status: string;
      quantity_available: number | null;
      marketplace_status: string | null;
      created_at: string;
    }>(
      `SELECT
        p.id,
        p.item_uuid,
        p.product_name,
        p.brand,
        p.short_description,
        p.estimated_price_chf,
        p.condition,
        p.category,
        p.subcategory,
        p.status,
        i.quantity_available,
        i.marketplace_status,
        p.created_at
       FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );

    return apiSuccess({
      products: productsResult.rows,
      count: parseInt(countResult.rows[0]?.count || "0", 10),
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Failed to fetch products", { error });
    return apiError(error, "Fehler beim Laden der Produkte");
  }
})

// POST /api/admin/products - Create new product
export const POST = withAdmin(async (request, session) => {
  try {
    const productData = await request.json();

    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
        (item_uuid, product_name, brand, short_description, estimated_price_chf, condition, category, subcategory, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'draft')
       RETURNING id`,
      [
        productData.title || productData.product_name,
        productData.brand || '',
        productData.description || productData.short_description || '',
        productData.price || productData.estimated_price_chf || 0,
        productData.condition || 'unknown',
        productData.category || null,
        productData.subcategory || null,
      ]
    );

    const productId = result.rows[0].id;

    // Create inventory item
    await query(
      `INSERT INTO ${TABLE_NAMES.INVENTORY_ITEMS}
        (ai_product_id, quantity_available, marketplace_status)
       VALUES ($1, $2, 'draft')`,
      [productId, productData.quantity || 1]
    );

    logger.info("Product created", { productId, user: session.user?.email });

    return apiSuccess({ id: productId }, 201);
  } catch (error) {
    logger.error("Failed to create product", { error });
    return apiError(error, "Fehler beim Erstellen des Produkts");
  }
})
