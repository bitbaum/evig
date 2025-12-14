import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

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

    const response = await fetch(`${MEDUSA_URL}/store/products?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        // Support both header names for compatibility
        "x-publishable-key": PUBLISHABLE_KEY,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch products from Medusa" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}
