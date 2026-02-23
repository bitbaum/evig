import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * POST /api/shop/cart/[cartId]/line-items/[lineId]
 * Update line item quantity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineId: string }> }
) {
  try {
    const { cartId, lineId } = await params;
    const body = await request.json();

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const response = await fetch(
      `${MEDUSA_CONFIG.URL}/store/carts/${cartId}/line-items/${lineId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
          "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          quantity: body.quantity,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa update line item error", {
        status: response.status,
        cartId,
        lineId,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Failed to update item",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to connect to Medusa backend");
  }
}

/**
 * DELETE /api/shop/cart/[cartId]/line-items/[lineId]
 * Remove line item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string; lineId: string }> }
) {
  try {
    const { cartId, lineId } = await params;

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const response = await fetch(
      `${MEDUSA_CONFIG.URL}/store/carts/${cartId}/line-items/${lineId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
          "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa remove line item error", {
        status: response.status,
        cartId,
        lineId,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Failed to remove item",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to connect to Medusa backend");
  }
}
