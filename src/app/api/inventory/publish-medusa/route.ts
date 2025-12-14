import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

interface PublishResult {
  success: boolean;
  medusa_product_id?: string;
  marketplace_listing_id?: string;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { inventoryItemId, options = {} } = await request.json();

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "Inventory item ID required" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get inventory item with AI product data
    const { data: inventoryItem, error: itemError } = await supabase
      .from('inventory_items')
      .select(`
        id,
        kivitendo_article_number,
        selling_price_chf,
        quantity_available,
        condition_override,
        ai_extracted_products (
          id,
          product_name,
          brand,
          category,
          specifications,
          color,
          material,
          dimensions,
          weight_grams,
          product_images (
            id,
            filename,
            file_path
          )
        )
      `)
      .eq('id', inventoryItemId)
      .single();

    if (itemError || !inventoryItem) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const aiProduct = inventoryItem.ai_extracted_products;
    if (!aiProduct) {
      return NextResponse.json(
        { error: "No AI product data found" },
        { status: 400 }
      );
    }

    // Create product in Medusa
    const medusaProductData = {
      title: aiProduct.product_name,
      description: generateProductDescription(aiProduct),
      handle: generateHandle(aiProduct.product_name, inventoryItem.kivitendo_article_number),
      status: "published",
      is_giftcard: false,
      discountable: true,
      thumbnail: aiProduct.product_images?.[0]?.file_path,
      collection_id: await getOrCreateCollection(aiProduct.category),
      type_id: await getOrCreateType("physical"),
      tags: generateTags(aiProduct),
      variants: [{
        title: "Default Variant",
        sku: inventoryItem.kivitendo_article_number,
        inventory_quantity: inventoryItem.quantity_available || 1,
        prices: [{
          amount: Math.round((inventoryItem.selling_price_chf || 0) * 100), // Convert to cents
          currency_code: "chf"
        }],
        options: generateVariantOptions(aiProduct)
      }],
      images: aiProduct.product_images?.map(img => ({
        url: img.file_path
      })) || [],
      metadata: {
        kivitendo_article_number: inventoryItem.kivitendo_article_number,
        condition: inventoryItem.condition_override || aiProduct.condition,
        brand: aiProduct.brand,
        ai_extracted: true,
        sustainability_score: await getSustainabilityScore(aiProduct.id)
      }
    };

    // Create product in Medusa
    const createResponse = await fetch(`${MEDUSA_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-key': PUBLISHABLE_KEY,
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(medusaProductData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return NextResponse.json(
        { error: "Failed to create product in Medusa", details: errorData },
        { status: createResponse.status }
      );
    }

    const medusaProduct = await createResponse.json();

    // Update inventory item with Medusa product ID
    await supabase
      .from('inventory_items')
      .update({
        medusa_product_id: medusaProduct.product.id,
        marketplace_status: 'published'
      })
      .eq('id', inventoryItemId);

    // Create marketplace listing record
    const { data: marketplaceListing } = await supabase
      .from('marketplace_listings')
      .insert({
        inventory_item_id: inventoryItemId,
        platform: 'medusa',
        platform_listing_id: medusaProduct.product.id,
        platform_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/products/${medusaProduct.product.handle}`,
        title: aiProduct.product_name,
        description: generateProductDescription(aiProduct),
        price_chf: inventoryItem.selling_price_chf,
        status: 'published',
        created_by: user.id
      })
      .select('id')
      .single();

    const result: PublishResult = {
      success: true,
      medusa_product_id: medusaProduct.product.id,
      marketplace_listing_id: marketplaceListing?.id
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Medusa publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish product to Medusa" },
      { status: 500 }
    );
  }
}

// Helper function to get admin token (you'll need to implement proper authentication)
function getAdminToken(): string {
  // This should be implemented with proper Medusa admin authentication
  // For now, returning a placeholder
  return process.env.MEDUSA_ADMIN_TOKEN || "";
}

// Generate SEO-friendly handle
function generateHandle(productName: string, articleNumber: string): string {
  const baseHandle = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  return `${baseHandle}-${articleNumber}`;
}

// Generate comprehensive product description
function generateProductDescription(aiProduct: any): string {
  let description = aiProduct.product_name;

  if (aiProduct.brand) {
    description += ` von ${aiProduct.brand}`;
  }

  description += ".";

  // Add specifications
  if (aiProduct.specifications && Object.keys(aiProduct.specifications).length > 0) {
    description += "\n\nTechnische Daten:\n";
    Object.entries(aiProduct.specifications).forEach(([key, value]) => {
      description += `• ${key}: ${value}\n`;
    });
  }

  // Add physical properties
  const properties = [];
  if (aiProduct.color) properties.push(`Farbe: ${aiProduct.color}`);
  if (aiProduct.material) properties.push(`Material: ${aiProduct.material}`);
  if (aiProduct.weight_grams) properties.push(`Gewicht: ${aiProduct.weight_grams}g`);
  if (aiProduct.dimensions) {
    const dims = aiProduct.dimensions;
    if (dims.width && dims.height && dims.depth) {
      properties.push(`Abmessungen: ${dims.width} × ${dims.height} × ${dims.depth} ${dims.unit || 'cm'}`);
    }
  }

  if (properties.length > 0) {
    description += "\n\nEigenschaften:\n" + properties.map(p => `• ${p}`).join('\n');
  }

  return description;
}

// Get or create product collection
async function getOrCreateCollection(category: string): Promise<string> {
  // This would normally check if collection exists and create if not
  // For now, returning a placeholder collection ID
  const categoryMap: { [key: string]: string } = {
    'Laptops': 'laptops-collection-id',
    'Smartphones': 'smartphones-collection-id',
    'Monitore': 'monitors-collection-id',
    'Computer-Komponenten': 'components-collection-id',
    'Peripheriegeräte': 'peripherals-collection-id'
  };

  return categoryMap[category] || 'general-collection-id';
}

// Get or create product type
async function getOrCreateType(type: string): Promise<string> {
  // Placeholder - would check/create in Medusa
  return 'physical-type-id';
}

// Generate tags for product
function generateTags(aiProduct: any): Array<{ value: string }> {
  const tags = [];

  if (aiProduct.brand) {
    tags.push({ value: aiProduct.brand.toLowerCase() });
  }

  if (aiProduct.category) {
    tags.push({ value: aiProduct.category.toLowerCase() });
  }

  if (aiProduct.color) {
    tags.push({ value: `color-${aiProduct.color.toLowerCase()}` });
  }

  // Add condition tag
  if (aiProduct.condition) {
    tags.push({ value: `condition-${aiProduct.condition}` });
  }

  return tags;
}

// Generate variant options
function generateVariantOptions(aiProduct: any): Array<{ option_id: string; value: string }> {
  const options = [];

  if (aiProduct.color) {
    options.push({
      option_id: 'color-option-id', // Would be created dynamically
      value: aiProduct.color
    });
  }

  if (aiProduct.condition) {
    options.push({
      option_id: 'condition-option-id',
      value: aiProduct.condition
    });
  }

  return options;
}

// Get sustainability score for product
async function getSustainabilityScore(aiProductId: string): Promise<number> {
  // This would fetch the sustainability score from our database
  // For now, returning a placeholder
  return 75;
}

// GET endpoint to check publishing status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const inventoryItemId = searchParams.get('inventoryItemId');

    if (!inventoryItemId) {
      return NextResponse.json(
        { error: "Inventory item ID required" },
        { status: 400 }
      );
    }

    const { data: item } = await supabase
      .from('inventory_items')
      .select(`
        id,
        medusa_product_id,
        marketplace_status,
        marketplace_listings (
          id,
          platform_url,
          status,
          views_count,
          favorites_count
        )
      `)
      .eq('id', inventoryItemId)
      .single();

    return NextResponse.json({
      success: true,
      published: !!item?.medusa_product_id,
      medusa_product_id: item?.medusa_product_id,
      marketplace_status: item?.marketplace_status,
      listings: item?.marketplace_listings || []
    });

  } catch (error) {
    console.error("Error checking publish status:", error);
    return NextResponse.json(
      { error: "Failed to check publishing status" },
      { status: 500 }
    );
  }
}



