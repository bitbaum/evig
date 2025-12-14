import { NextRequest, NextResponse } from "next/server";
import { hasRole } from '@/middleware/admin'
import { ROLES } from '@/lib/constants'

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

// POST /api/admin/products/bulk-import - Bulk import products from CSV
export async function POST(request: NextRequest) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Read CSV content
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have at least header and one data row" },
        { status: 400 }
      );
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
      return NextResponse.json({
        error: "CSV validation errors",
        errors,
        processed: products.length
      }, { status: 400 });
    }

    // Create products in Medusa
    const createdProducts = [];
    const creationErrors = [];

    for (const product of products) {
      try {
        // First, create the product
        const createResponse = await fetch(`${MEDUSA_URL}/admin/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": PUBLISHABLE_KEY,
            "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
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
        const variantResponse = await fetch(`${MEDUSA_URL}/admin/products/${createdProduct.product.id}/variants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": PUBLISHABLE_KEY,
            "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
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
          console.warn(`Failed to add variant for product ${product.title}`);
        }

        createdProducts.push(createdProduct.product);

      } catch (error) {
        console.error(`Error creating product "${product.title}":`, error);
        creationErrors.push({
          product: product.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: createdProducts.length,
      errors: creationErrors,
      total: products.length
    });

  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      { error: "Failed to process bulk import" },
      { status: 500 }
    );
  }
}



