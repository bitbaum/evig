import { NextRequest, NextResponse } from "next/server";
import { ROLES } from '@/lib/constants'
import { hasRole } from '@/middleware/admin'

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

// GET /api/admin/products - List all products for admin
export async function GET(request: NextRequest) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
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

    const response = await fetch(`${MEDUSA_URL}/admin/products?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        // Note: In production, you'd use a proper admin API key
        "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa Admin API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch products from Medusa" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // Check admin role
    const isAdmin = await hasRole(ROLES.REVAMPIT_ADMIN)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    const productData = await request.json();

    const response = await fetch(`${MEDUSA_URL}/admin/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_API_KEY || 'admin_key_here'}`
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Medusa Admin API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}