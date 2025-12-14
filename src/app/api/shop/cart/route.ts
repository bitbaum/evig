import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

/**
 * POST /api/shop/cart
 * Create a new cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": PUBLISHABLE_KEY,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        region_id: body.region_id,
        ...body,
      }),
    });

    if (!response.ok) {
      console.error("Medusa cart creation error:", response.status);
      return NextResponse.json(
        { error: "Failed to create cart" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating cart:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}



