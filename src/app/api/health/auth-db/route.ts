import { NextResponse } from 'next/server'
import { query } from '@/lib/auth/db'

export async function GET() {
  const diagnostics: any = {
    ok: false,
    config: {
      host: process.env.AUTH_DB_HOST || process.env.DB_HOST,
      port: process.env.AUTH_DB_PORT || process.env.DB_PORT,
      database: process.env.AUTH_DB_NAME || process.env.DB_NAME,
      user: process.env.AUTH_DB_USER || process.env.DB_USER,
    },
    checks: [] as Array<{ name: string; ok: boolean; error?: string }>,
  }

  try {
    const res = await query<{ now: string; db: string }>(
      'SELECT NOW() as now, current_database() as db'
    )
    diagnostics.checks.push({ name: 'connect', ok: res.rows.length > 0 })
  } catch (e: any) {
    diagnostics.checks.push({ name: 'connect', ok: false, error: String(e?.message || e) })
    return NextResponse.json(diagnostics, { status: 500 })
  }

  try {
    const res = await query<{ count: string | number }>(
      `SELECT count(*)::int as count FROM information_schema.tables WHERE table_name IN ('users','user_profiles')`
    )
    const ok = Number(res.rows?.[0]?.count ?? 0) >= 2
    diagnostics.checks.push({ name: 'schema_core_tables', ok })
  } catch (e: any) {
    diagnostics.checks.push({ name: 'schema_core_tables', ok: false, error: String(e?.message || e) })
  }

  diagnostics.ok = diagnostics.checks.every((c: any) => c.ok)
  return NextResponse.json(diagnostics, { status: diagnostics.ok ? 200 : 500 })
}
