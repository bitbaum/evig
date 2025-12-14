import { NextRequest, NextResponse } from "next/server";
import { ROLES } from '@/lib/constants'
import { hasRole } from '@/middleware/admin'

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const response = await fetch(`${MEDUSA_URL}/admin/products/${params.id}`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa Admin API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/[id] - Update product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const updateData = await request.json();

    const response = await fetch(`${MEDUSA_URL}/admin/products/${params.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa Admin API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const response = await fetch(`${MEDUSA_URL}/admin/products/${params.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa Admin API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to delete product" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
