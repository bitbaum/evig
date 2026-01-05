import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * GET /api/shop/products
 * Proxy to Medusa store products API to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";

    // Build query params
    const params = new URLSearchParams({
      limit,
      offset,
    });

    if (handle) {
      params.set("handle", handle);
    }

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const response = await fetch(
      `${MEDUSA_CONFIG.BACKEND_URL}/store/products?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          // Support both header names for compatibility
          "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
          "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa API error", {
        status: response.status,
        error: errorText,
        url: request.url,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Failed to fetch products from Medusa",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error,
      "Failed to connect to Medusa backend"
    );
  }
}
