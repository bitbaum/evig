import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

/**
 * POST /api/shop/cart/[cartId]/line-items
 * Add item to cart
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  try {
    const { cartId } = params;
    const body = await request.json();

    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": PUBLISHABLE_KEY,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        variant_id: body.variant_id,
        quantity: body.quantity || 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Medusa add to cart error:", response.status, error);
      return NextResponse.json(
        { error: "Failed to add item to cart" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}



