import { NextResponse } from 'next/server'
import { MEDUSA_CONFIG } from '@/config/medusa'
import { logger } from '@/lib/logger'

interface DiagnosticCheck {
  name: string
  ok: boolean
  status?: number
  error?: string
}

interface Diagnostics {
  medusaUrl: string
  hasPublishableKey: boolean
  checks: DiagnosticCheck[]
}

export async function GET() {
  const diagnostics: Diagnostics = {
    medusaUrl: MEDUSA_CONFIG.URL,
    hasPublishableKey: !!MEDUSA_CONFIG.PUBLISHABLE_KEY,
    checks: [],
  }

  const headers = MEDUSA_CONFIG.PUBLISHABLE_KEY
    ? {
        'x-publishable-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
        'x-publishable-api-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      }
    : {}

  try {
    const res = await fetch(`${MEDUSA_CONFIG.URL}/store/regions`, {
      headers,
      cache: 'no-store',
    })
    diagnostics.checks.push({
      name: 'regions',
      ok: res.ok,
      status: res.status,
      error: res.ok ? undefined : await res.text(),
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    logger.error('Medusa health check error (regions)', { error: errorMessage })
    diagnostics.checks.push({
      name: 'regions',
      ok: false,
      error: errorMessage,
    })
  }

  try {
    const res = await fetch(`${MEDUSA_CONFIG.URL}/store/products?limit=1`, {
      headers,
      cache: 'no-store',
    })
    diagnostics.checks.push({
      name: 'products',
      ok: res.ok,
      status: res.status,
      error: res.ok ? undefined : await res.text(),
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    logger.error('Medusa health check error (products)', { error: errorMessage })
    diagnostics.checks.push({
      name: 'products',
      ok: false,
      error: errorMessage,
    })
  }

  const ok = diagnostics.checks.every((c) => c.ok)
  return NextResponse.json(diagnostics, { status: ok ? 200 : 500 })
}
