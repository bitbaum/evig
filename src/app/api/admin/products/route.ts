import { NextRequest } from "next/server";
import { ROLES } from '@/lib/constants'
import { hasRole } from '@/middleware/admin'
import { MEDUSA_CONFIG } from "@/config/medusa";
import { logger } from "@/lib/logger";
import { apiError, apiSuccess, apiForbidden } from "@/lib/api/helpers";

// GET /api/admin/products - List all products for admin
export async function GET(request: NextRequest) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return apiForbidden("Admin access required");
    }

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const params = new URLSearchParams({
      limit,
      offset,
    });

    if (status) params.set("status", status);
    if (q) params.set("q", q);

    const response = await fetch(
      `${MEDUSA_CONFIG.BACKEND_URL}/admin/products?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
          "Authorization": `Bearer ${MEDUSA_CONFIG.ADMIN_API_KEY || ''}`
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa Admin API error", {
        status: response.status,
        error: errorText,
        url: request.url,
      });
      return apiError(
        new Error(`Medusa Admin API returned ${response.status}`),
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

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return apiForbidden("Admin access required");
    }

    if (!MEDUSA_CONFIG.PUBLISHABLE_KEY) {
      logger.error("Medusa publishable key not configured");
      return apiError(
        new Error("Configuration error"),
        "Medusa configuration is missing",
        500
      );
    }

    const productData = await request.json();

    const response = await fetch(`${MEDUSA_CONFIG.BACKEND_URL}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "Authorization": `Bearer ${MEDUSA_CONFIG.ADMIN_API_KEY || ''}`
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa Admin API error", {
        status: response.status,
        error: errorText,
        url: request.url,
      });
      return apiError(
        new Error(`Medusa Admin API returned ${response.status}`),
        "Failed to create product",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(
      error,
      "Failed to create product"
    );
  }
}