import { NextResponse } from "next/server";

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_eee502aced5bea9f350f22cc90c2f98e74417fcfa17a35a230837b069e915a55";

/**
 * GET /api/shop/regions
 * Fetch available regions from Medusa
 */
export async function GET() {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-key": PUBLISHABLE_KEY,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Medusa regions fetch error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch regions" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to connect to Medusa backend" },
      { status: 500 }
    );
  }
}



