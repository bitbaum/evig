/**
 * Publish Inventory Item to Medusa API
 *
 * POST - Publishes an inventory item to Medusa (thin wrapper around service)
 * GET  - Checks publishing status
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TABLE_NAMES } from "@/config/database";
import { apiSuccess, apiError } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAuth, ValidSession } from "@/lib/api/middleware";
import { validateBody, validateQuery, PublishMedusaSchema, PublishMedusaQuerySchema } from '@/lib/schemas';
import { publishToMedusa } from '@/lib/services/medusa-publish-service';

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const validation = validateBody(PublishMedusaSchema, body);
    if (!validation.success) return validation.error;
    const { inventoryItemId } = validation.data;

    const result = await publishToMedusa(inventoryItemId, session.user.id);

    if (!result) {
      return apiError(null, "Produkt konnte nicht in Medusa veröffentlicht werden", 500);
    }

    return apiSuccess({
      success: true,
      medusa_product_id: result.medusa_product_id,
      medusa_variant_id: result.medusa_variant_id,
      handle: result.handle,
    });
  } catch (error) {
    return apiError(error, "Produkt konnte nicht in Medusa veröffentlicht werden");
  }
});

// GET endpoint to check publishing status
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const queryValidation = validateQuery(PublishMedusaQuerySchema, {
      inventoryItemId: searchParams.get('inventoryItemId'),
    });
    if (!queryValidation.success) return queryValidation.error;
    const { inventoryItemId } = queryValidation.data;

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
    return apiError(error, "Veröffentlichungsstatus konnte nicht überprüft werden");
  }
});
