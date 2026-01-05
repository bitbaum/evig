import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError, apiBadRequest, apiNotFound, apiUnauthorized } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAuth } from "@/lib/api/middleware";

interface PublishResult {
  success: boolean;
  medusa_product_id?: string;
  marketplace_listing_id?: string;
  errors?: string[];
}

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const supabase = createClient();
    const { inventoryItemId, options = {} } = await request.json();

    if (!inventoryItemId) {
      return apiBadRequest("Inventory item ID required");
    }

    // Get inventory item with AI product data
    const { data: inventoryItem, error: itemError } = await supabase
      .from(TABLE_NAMES.INVENTORY_ITEMS)
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
      return apiNotFound("Inventory item");
    }

    // Supabase returns ai_extracted_products as an array, get first item
    interface AIProductRaw {
      id: string;
      product_name: string;
      brand?: string;
      category?: string;
      specifications?: Record<string, unknown>;
      color?: string;
      material?: string;
      dimensions?: {
        width?: number;
        height?: number;
        depth?: number;
        unit?: string;
      };
      weight_grams?: number;
      condition?: string;
      product_images?: Array<{ id: string; filename: string; file_path: string }>;
    }

    const aiProductArray = inventoryItem.ai_extracted_products as AIProductRaw[] | AIProductRaw | null;
    const aiProductRaw = Array.isArray(aiProductArray) ? aiProductArray[0] : aiProductArray;
    if (!aiProductRaw) {
      return apiBadRequest("No AI product data found");
    }

    // Type guard: ensure aiProduct has required properties
    const aiProduct: AIProductRaw = aiProductRaw;

    // Create product in Medusa
    const medusaProductData = {
      title: aiProduct.product_name || 'Unnamed Product',
      description: generateProductDescription(aiProduct),
      handle: generateHandle(aiProduct.product_name || 'unnamed', inventoryItem.kivitendo_article_number),
      status: "published",
      is_giftcard: false,
      discountable: true,
      thumbnail: aiProduct.product_images?.[0]?.file_path,
      collection_id: await getOrCreateCollection(aiProduct.category || 'general'),
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
      images: (aiProduct.product_images || []).map((img: { file_path: string }) => ({
        url: img.file_path
      })),
      metadata: {
        kivitendo_article_number: inventoryItem.kivitendo_article_number,
        condition: inventoryItem.condition_override || aiProduct.condition,
        brand: aiProduct.brand,
        ai_extracted: true,
        sustainability_score: await getSustainabilityScore(aiProduct.id)
      }
    };

    // Create product in Medusa
    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
        'Authorization': `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(medusaProductData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      logger.error("Failed to create product in Medusa", { error: errorData, inventoryItemId });
      return apiError(
        errorData,
        "Failed to create product in Medusa",
        createResponse.status
      );
    }

    const medusaProduct = await createResponse.json();

    // Update inventory item with Medusa product ID
    await supabase
      .from(TABLE_NAMES.INVENTORY_ITEMS)
      .update({
        medusa_product_id: medusaProduct.product.id,
        marketplace_status: 'published'
      })
      .eq('id', inventoryItemId);

    // Create marketplace listing record
    const { data: marketplaceListing } = await supabase
      .from(TABLE_NAMES.MARKETPLACE_LISTINGS)
      .insert({
        inventory_item_id: inventoryItemId,
        platform: 'medusa',
        platform_listing_id: medusaProduct.product.id,
        platform_url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/shop/products/${medusaProduct.product.handle}`,
        title: aiProduct.product_name || 'Unnamed Product',
        description: generateProductDescription(aiProduct),
        price_chf: inventoryItem.selling_price_chf,
        status: 'published',
        created_by: session.user.id
      })
      .select('id')
      .single();

    const result: PublishResult = {
      success: true,
      medusa_product_id: medusaProduct.product.id,
      marketplace_listing_id: marketplaceListing?.id
    };

    return apiSuccess(result);

  } catch (error) {
    return apiError(error, "Failed to publish product to Medusa");
  }
});

// Get admin token from config
function getAdminToken(): string {
  const token = MEDUSA_CONFIG.ADMIN_API_KEY;
  if (!token) {
    throw new Error("MEDUSA_ADMIN_API_KEY not found. Run 'npm run medusa:bootstrap' first.");
  }
  return token;
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
function generateProductDescription(aiProduct: AIProductRaw): string {
  let description = aiProduct.product_name;

  if (aiProduct.brand) {
    description += ` von ${aiProduct.brand}`;
  }

  description += ".";

  // Add specifications
  if (aiProduct.specifications && Object.keys(aiProduct.specifications).length > 0) {
    description += "\n\nTechnische Daten:\n";
    Object.entries(aiProduct.specifications).forEach(([key, value]) => {
      description += `• ${key}: ${String(value)}\n`;
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

// Get or create product collection in Medusa
async function getOrCreateCollection(category: string): Promise<string> {
  const adminToken = getAdminToken();

    // First, try to find existing collection
    try {
      const listResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/collections?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY
        }
      });

    if (listResponse.ok) {
      const listData = await listResponse.json() as { collections?: Array<{ id: string; title: string }> };
      const existingCollection = listData.collections?.find((c) =>
        c.title.toLowerCase() === category.toLowerCase()
      );

      if (existingCollection) {
        return existingCollection.id;
      }
    }

    // Create new collection if not found
    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        title: category,
        handle: category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        metadata: {
          source: 'ai_inventory_sync'
        }
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      return createData.collection.id;
    }

    logger.warn(`Failed to create collection "${category}"`, { response: await createResponse.text() });
  } catch (error) {
    logger.error('Error managing collection', { error, category });
  }

  // Fallback: return empty string and let Medusa handle it
  return "";
}

// Get or create product type in Medusa
async function getOrCreateType(type: string): Promise<string> {
  const adminToken = getAdminToken();

    // First, try to find existing type
    try {
      const listResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/product-types?limit=100`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY
        }
      });

      if (listResponse.ok) {
        const listData = await listResponse.json() as { product_types?: Array<{ id: string; value: string }> };
        const existingType = listData.product_types?.find((t) =>
          t.value.toLowerCase() === type.toLowerCase()
        );

      if (existingType) {
        return existingType.id;
      }
    }

    // Create new type if not found
    const createResponse = await fetch(`${MEDUSA_CONFIG.URL}/admin/product-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        value: type,
        metadata: {
          source: 'ai_inventory_sync'
        }
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      return createData.product_type.id;
    }

    logger.warn(`Failed to create product type "${type}"`, { response: await createResponse.text() });
  } catch (error) {
    logger.error('Error managing product type', { error, type });
  }

  // Fallback: return empty string and let Medusa handle it
  return "";
}

// Generate tags for product
function generateTags(aiProduct: AIProductRaw): Array<{ value: string }> {
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
function generateVariantOptions(aiProduct: AIProductRaw): Array<{ option_id: string; value: string }> {
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
  try {
    const supabase = createClient();
    const { data: score } = await supabase
      .from(TABLE_NAMES.SUSTAINABILITY_SCORES)
      .select('overall_score')
      .eq('product_id', aiProductId)
      .single();

    return score?.overall_score || 75; // Default to 75 if no score found
  } catch (error) {
    logger.warn('Error fetching sustainability score', { error, aiProductId });
    return 75; // Default fallback
  }
}

// GET endpoint to check publishing status
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const inventoryItemId = searchParams.get('inventoryItemId');

    if (!inventoryItemId) {
      return apiBadRequest("Inventory item ID required");
    }

    const { data: item } = await supabase
      .from(TABLE_NAMES.INVENTORY_ITEMS)
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

    return apiSuccess({
      published: !!item?.medusa_product_id,
      medusa_product_id: item?.medusa_product_id,
      marketplace_status: item?.marketplace_status,
      listings: item?.marketplace_listings || []
    });

  } catch (error) {
    return apiError(error, "Failed to check publishing status");
  }
});













