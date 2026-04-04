import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiExtractedProducts, inventoryItems } from "@/db/schema";
import { sql } from "drizzle-orm";
import { apiSuccess, apiError, apiBadRequest } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAdmin } from "@/lib/api/middleware";
import { MARKETPLACE_STATUS } from '@/config/marketplace-status';

// POST /api/admin/products/bulk-import - Bulk import products from CSV
export const POST = withAdmin('products', async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiBadRequest("No file provided");
    }

    // Read CSV content
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return apiBadRequest("CSV must have at least header and one data row");
    }

    // Parse CSV (simple implementation - in production use a proper CSV parser)
    const headers = lines[0].split(',').map(h => h.trim());

    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Incorrect number of columns`);
        continue;
      }

      const product = {
        title: values[0],
        description: values[1],
        price: parseFloat(values[2]),
        category: values[3],
        brand: values[4],
        imageUrl: values[5] || null
      };

      // Basic validation
      if (!product.title || !product.description || isNaN(product.price) || product.price <= 0) {
        errors.push(`Row ${i + 1}: Invalid data - check title, description, and price`);
        continue;
      }

      products.push(product);
    }

    if (errors.length > 0) {
      return apiBadRequest(`CSV validation errors (${products.length} products processed)`, { csv: errors });
    }

    // Create products in local database
    const createdProducts = [];
    const creationErrors = [];

    for (const product of products) {
      try {
        // Transaction ensures product + inventory are created atomically
        const productId = await db.transaction(async (tx) => {
          const [productRow] = await tx
            .insert(aiExtractedProducts)
            .values({
              itemUuid: sql`gen_random_uuid()::text`,
              productName: product.title,
              brand: product.brand,
              shortDescription: product.description,
              estimatedPriceChf: String(product.price),
              category: product.category,
              condition: 'unknown',
              status: MARKETPLACE_STATUS.DRAFT,
            })
            .returning({ id: aiExtractedProducts.id });

          await tx
            .insert(inventoryItems)
            .values({
              aiProductId: productRow.id,
              quantityAvailable: 1,
              marketplaceStatus: MARKETPLACE_STATUS.DRAFT,
            });

          return productRow.id;
        });

        createdProducts.push({ id: productId, title: product.title });

      } catch (error) {
        logger.error(`Error creating product "${product.title}"`, { error, product });
        creationErrors.push({
          product: product.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return apiSuccess({
      created: createdProducts.length,
      errors: creationErrors,
      total: products.length
    });

  } catch (error) {
    return apiError(error, "Failed to process bulk import");
  }
});
