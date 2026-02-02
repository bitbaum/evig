import { NextRequest } from "next/server";
import { MEDUSA_CONFIG } from "@/config/medusa";
import { apiSuccess, apiError, apiForbidden } from "@/lib/api/helpers";
import { logger } from "@/lib/logger";
import { withAdmin } from "@/lib/api/middleware";

// GET /api/admin/products/[id] - Get single product
export const GET = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    const response = await fetch(`${MEDUSA_CONFIG.URL}/admin/products/${params.id}`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "Authorization": `Basic ${MEDUSA_CONFIG.ADMIN_API_KEY}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa Admin API error", { status: response.status, error: errorText, productId: params.id });
      return apiError(
        new Error(errorText),
        "Failed to fetch product",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to fetch product");
  }
});

// POST /api/admin/products/[id] - Update product
export const POST = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    const updateData = await request.json();

    const response = await fetch(`${MEDUSA_CONFIG.URL}/admin/products/${params.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "Authorization": `Basic ${MEDUSA_CONFIG.ADMIN_API_KEY}`
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa Admin API error", { status: response.status, error: errorText, productId: params.id });
      return apiError(
        new Error(errorText),
        "Failed to update product",
        response.status
      );
    }

    const data = await response.json();
    return apiSuccess(data);
  } catch (error) {
    return apiError(error, "Failed to update product");
  }
});

// DELETE /api/admin/products/[id] - Delete product
export const DELETE = withAdmin<{ id: string }>(async (
  request: NextRequest,
  session,
  context
) => {
  try {
    const params = context?.params;
    if (!params?.id) {
      return apiError(new Error("Product ID required"), "Product ID required", 400);
    }

    const response = await fetch(`${MEDUSA_CONFIG.URL}/admin/products/${params.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": MEDUSA_CONFIG.PUBLISHABLE_KEY,
        "Authorization": `Basic ${MEDUSA_CONFIG.ADMIN_API_KEY}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Medusa Admin API error", { status: response.status, error: errorText, productId: params.id });
      return apiError(
        new Error(errorText),
        "Failed to delete product",
        response.status
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return apiError(error, "Failed to delete product");
  }
});
