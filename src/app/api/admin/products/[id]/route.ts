import { NextRequest } from "next/server";
import { query } from "@/lib/auth/db";
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAdmin } from "@/lib/api/middleware";
import { validateBody, AdminUpdateProductSchema } from '@/lib/schemas';

// GET /api/admin/products/[id] - Get single product
export const GET = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    const result = await query<{
      id: string;
      item_uuid: string;
      product_name: string;
      brand: string;
      short_description: string | null;
      specifications: Record<string, string>;
      estimated_price_chf: number;
      condition: string;
      dimensions: Record<string, number | null>;
      weight_grams: number | null;
      category: string | null;
      subcategory: string | null;
      status: string;
      quantity_available: number | null;
      marketplace_status: string | null;
      created_at: string;
      updated_at: string;
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
        p.status,
        i.quantity_available,
        i.marketplace_status,
        p.created_at,
        p.updated_at
       FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} p
       LEFT JOIN ${TABLE_NAMES.INVENTORY_ITEMS} i ON i.ai_product_id = p.id
       WHERE p.id = $1`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return apiNotFound("Produkt nicht gefunden");
    }

    return apiSuccess({ product: result.rows[0] });
  } catch (error) {
    logger.error("Failed to fetch product", { error, productId: context?.params?.id });
    return apiError(error, "Fehler beim Laden des Produkts");
  }
});

// PUT /api/admin/products/[id] - Update product
export const PUT = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    const body = await request.json();
    const validation = validateBody(AdminUpdateProductSchema, body);
    if (!validation.success) return validation.error;
    const updateData = validation.data as Record<string, unknown>;

    // Build dynamic SET clause for product fields
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    const allowedFields: Record<string, string> = {
      product_name: 'product_name',
      title: 'product_name',
      brand: 'brand',
      short_description: 'short_description',
      description: 'short_description',
      estimated_price_chf: 'estimated_price_chf',
      price: 'estimated_price_chf',
      condition: 'condition',
      category: 'category',
      subcategory: 'subcategory',
      status: 'status',
    };

    for (const [inputKey, dbColumn] of Object.entries(allowedFields)) {
      if (updateData[inputKey] !== undefined) {
        setClauses.push(`${dbColumn} = $${paramIndex++}`);
        values.push(updateData[inputKey] as string | number | null);
      }
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = NOW()`);
      values.push(params.id);

      await query(
        `UPDATE ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS}
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    // Update inventory fields if provided
    const quantityAvailable = updateData.quantity_available as number | undefined;
    const marketplaceStatus = updateData.marketplace_status as string | undefined;
    if (quantityAvailable !== undefined || marketplaceStatus !== undefined) {
      const invSets: string[] = [];
      const invValues: (string | number | null)[] = [];
      let invIndex = 1;

      if (quantityAvailable !== undefined) {
        invSets.push(`quantity_available = $${invIndex++}`);
        invValues.push(quantityAvailable);
      }
      if (marketplaceStatus !== undefined) {
        invSets.push(`marketplace_status = $${invIndex++}`);
        invValues.push(marketplaceStatus);
      }

      invValues.push(params.id);
      await query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET ${invSets.join(', ')}
         WHERE ai_product_id = $${invIndex}`,
        invValues
      );
    }

    logger.info("Product updated", { productId: params.id, user: session.user?.email });

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Failed to update product", { error, productId: context?.params?.id });
    return apiError(error, "Fehler beim Aktualisieren des Produkts");
  }
});

// DELETE /api/admin/products/[id] - Delete product
export const DELETE = withAdmin<{ id: string }>('products', async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    // Delete inventory item first (foreign key)
    await query(
      `DELETE FROM ${TABLE_NAMES.INVENTORY_ITEMS} WHERE ai_product_id = $1`,
      [params.id]
    );

    // Delete product
    const result = await query(
      `DELETE FROM ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} WHERE id = $1`,
      [params.id]
    );

    if (result.rowCount === 0) {
      return apiNotFound("Produkt nicht gefunden");
    }

    logger.info("Product deleted", { productId: params.id, user: session.user?.email });

    return apiSuccess({ success: true });
  } catch (error) {
    logger.error("Failed to delete product", { error, productId: context?.params?.id });
    return apiError(error, "Fehler beim Löschen des Produkts");
  }
});
