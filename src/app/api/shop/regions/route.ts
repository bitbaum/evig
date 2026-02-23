import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess } from "@/lib/api/helpers";

/**
 * GET /api/shop/regions
 * Fetch available regions from Medusa
 */
export async function GET() {
  try {
    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa-Konfiguration fehlt",
        500
      );
    }

    const response = await fetch(`${MEDUSA_CONFIG.URL}/store/regions`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa regions fetch error", {
        status: response.status,
        error: errorText,
      });
      return apiError(
        new Error(`Medusa API returned ${response.status}`),
        "Regionen konnten nicht geladen werden",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Verbindung zum Shop-Backend fehlgeschlagen");
  }
}
