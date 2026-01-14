import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAdmin } from "@/lib/api/middleware";

// POST /api/admin/products/bulk-import - Bulk import products from CSV
export const POST = withAdmin(async (request: NextRequest) => {
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
    const expectedHeaders = ['Titel', 'Beschreibung', 'Preis (CHF)', 'Kategorie', 'Marke', 'Bild-URL'];

    // Check if headers match (optional - could be more flexible)
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
        price: Math.round(parseFloat(values[2]) * 100), // Convert CHF to cents
        category: values[3],
        brand: values[4],
        images: values[5] ? [{ url: values[5] }] : []
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

    // Create products in Medusa
    const createdProducts = [];
    const creationErrors = [];

    for (const product of products) {
      try {
        // First, create the product
        const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
            "Authorization": `Bearer ${MEDUSA_CONFIG.ADMIN_API_KEY}`
          },
          body: JSON.stringify({
            title: product.title,
            description: product.description,
            handle: product.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            status: "published",
            images: product.images
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create product: ${createResponse.status}`);
        }

        const createdProduct = await createResponse.json();

        // Then, add variant with price
        const variantResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/products/${createdProduct.product.id}/variants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
            "Authorization": `Bearer ${MEDUSA_CONFIG.ADMIN_API_KEY}`
          },
          body: JSON.stringify({
            title: "Default",
            prices: [{
              amount: product.price,
              currency_code: "CHF"
            }],
            inventory_quantity: 1 // Default inventory
          }),
        });

        if (!variantResponse.ok) {
          logger.warn(`Failed to add variant for product ${product.title}`, { 
            productId: createdProduct.product.id,
            status: variantResponse.status 
          });
        }

        createdProducts.push(createdProduct.product);

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



