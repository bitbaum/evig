import { NextResponse } from 'next/server'

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

export async function GET() {
  const diagnostics: any = {
    medusaUrl: MEDUSA_URL,
    hasPublishableKey: !!PUBLISHABLE_KEY,
    checks: [] as Array<{ name: string; ok: boolean; status?: number; error?: string }>,
  }

  try {
    const res = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: PUBLISHABLE_KEY ? { 'x-publishable-key': PUBLISHABLE_KEY, 'x-publishable-api-key': PUBLISHABLE_KEY } : {},
      cache: 'no-store',
    })
    diagnostics.checks.push({ name: 'regions', ok: res.ok, status: res.status, error: res.ok ? undefined : await res.text() })
  } catch (e: any) {
    diagnostics.checks.push({ name: 'regions', ok: false, error: String(e?.message || e) })
  }

  try {
    const res = await fetch(`${MEDUSA_URL}/store/products?limit=1`, {
      headers: PUBLISHABLE_KEY ? { 'x-publishable-key': PUBLISHABLE_KEY, 'x-publishable-api-key': PUBLISHABLE_KEY } : {},
      cache: 'no-store',
    })
    diagnostics.checks.push({ name: 'products', ok: res.ok, status: res.status, error: res.ok ? undefined : await res.text() })
  } catch (e: any) {
    diagnostics.checks.push({ name: 'products', ok: false, error: String(e?.message || e) })
  }

  const ok = diagnostics.checks.every((c: any) => c.ok)
  return NextResponse.json(diagnostics, { status: ok ? 200 : 500 })
}
