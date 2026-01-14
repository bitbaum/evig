import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * POST /api/shop/cart/[cartId]/line-items
 * Add item to cart
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    const body = await request.json();

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const response = await fetch(`${MEDUSA_CONFIG.URL}/store/carts/${cartId}/line-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        variant_id: body.variant_id,
        quantity: body.quantity || 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa add to cart error", {
        status: response.status,
        cartId,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Failed to add item to cart",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to connect to Medusa backend");
  }
}



