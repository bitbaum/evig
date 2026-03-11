import { apiSuccess, apiError } from '@/lib/api/helpers'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { users, userProfiles } from '@/db/schema'
import { getTableName } from 'drizzle-orm'

interface DiagnosticCheck {
  name: string;
  ok: boolean;
  error?: string;
}

interface Diagnostics {
  ok: boolean;
  checks: DiagnosticCheck[];
}

export async function GET() {
  const diagnostics: Diagnostics = {
    ok: false,
    checks: [],
  }

  try {
    const res = await db.execute(sql`SELECT NOW() as now, current_database() as db`)
    diagnostics.checks.push({ name: 'connect', ok: res.rows.length > 0 })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    diagnostics.checks.push({ name: 'connect', ok: false, error: errorMessage })
    return apiError(e, 'Database connection failed', 500)
  }

  try {
    const usersTable = getTableName(users)
    const profilesTable = getTableName(userProfiles)
    const res = await db.execute(sql`SELECT count(*)::int as count FROM information_schema.tables WHERE table_name IN (${usersTable}, ${profilesTable})`)
    const ok = Number((res.rows?.[0] as Record<string, unknown>)?.count ?? 0) >= 2
    diagnostics.checks.push({ name: 'schema_core_tables', ok })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    diagnostics.checks.push({ name: 'schema_core_tables', ok: false, error: errorMessage })
  }

  diagnostics.ok = diagnostics.checks.every((c) => c.ok)
  return diagnostics.ok ? apiSuccess(diagnostics) : apiError(new Error('Health check failed'), 'Health check failed', 500)
}
