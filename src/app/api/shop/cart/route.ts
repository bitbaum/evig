import { NextRequest } from "next/server";
import { z } from "zod";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess, apiBadRequest } from "@/lib/api/helpers";

const createCartSchema = z.object({
  region_id: z.string().min(1, 'Region ID erforderlich'),
  items: z.array(z.object({
    variant_id: z.string().min(1),
    quantity: z.number().int().positive(),
  })).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/shop/cart
 * Create a new cart
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = createCartSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues.map(i => i.message).join(', '));
    }
    const body = parsed.data;

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa-Konfiguration fehlt",
        500
      );
    }

    const response = await fetch(`${MEDUSA_CONFIG.BACKEND_URL}/store/carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa cart creation error", {
        status: response.status,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Warenkorb konnte nicht erstellt werden",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Verbindung zum Shop-Backend fehlgeschlagen");
  }
}
