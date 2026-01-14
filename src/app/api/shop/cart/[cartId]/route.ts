import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * GET /api/shop/cart/[cartId]
 * Retrieve a cart by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const response = await fetch(`${MEDUSA_CONFIG.URL}/store/carts/${cartId}`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa cart fetch error", {
        status: response.status,
        cartId,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Failed to fetch cart",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to connect to Medusa backend");
  }
}



