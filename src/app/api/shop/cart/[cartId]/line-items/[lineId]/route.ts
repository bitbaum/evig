import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

/**
 * POST /api/shop/cart/[cartId]/line-items/[lineId]
 * Update line item quantity
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string; lineId: string } }
) {
  try {
    const { cartId, lineId } = params;
    const body = await request.json();

    const response = await fetch(
      `${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-key": PUBLISHABLE_KEY,
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          quantity: body.quantity,
        }),
      }
    );

    if (!response.ok) {
      console.error("Medusa update line item error:", response.status);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating line item:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shop/cart/[cartId]/line-items/[lineId]
 * Remove line item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cartId: string; lineId: string } }
) {
  try {
    const { cartId, lineId } = params;

    const response = await fetch(
      `${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-key": PUBLISHABLE_KEY,
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error("Medusa remove line item error:", response.status);
      return NextResponse.json(
        { error: "Failed to remove item" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error removing line item:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}



