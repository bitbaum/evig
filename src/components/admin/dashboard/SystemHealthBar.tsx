import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { jobRuns } from '@/db/schema/misc'
import { logger } from '@/lib/logger'

// Show failures in the last 24 hours
const WINDOW_HOURS = 24

interface JobHealth {
  job_name: string
  failure_count: number
  last_ran_at: string | null
}

function formatAge(iso: string | null): string {
  if (!iso) return 'unbekannt'
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'vor weniger als 1 Std.'
  return `vor ${hours} Std.`
}

export async function SystemHealthBar() {
  const table = getTableName(jobRuns)
  const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  let unhealthy: JobHealth[] = []

  try {
    const result = await db.execute(sql`
      SELECT
        job_name,
        COUNT(*) FILTER (WHERE success = false) AS failure_count,
        MAX(ran_at) AS last_ran_at
      FROM ${sql.raw(table)}
      WHERE ran_at >= ${windowStart}
      GROUP BY job_name
      HAVING COUNT(*) FILTER (WHERE success = false) > 0
      ORDER BY failure_count DESC
    `)
    unhealthy = result.rows as unknown as JobHealth[]
  } catch (error) {
    // Table may not exist yet — fail silently
    logger.warn('SystemHealthBar query failed', { error })
    return null
  }

  if (unhealthy.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">
        System-Warnungen
      </p>
      <ul className="space-y-1">
        {unhealthy.map(job => (
          <li key={job.job_name} className="text-sm text-amber-800 dark:text-amber-300">
            ⚠ {job.job_name}: {job.failure_count} Fehler in {WINDOW_HOURS} Std.
            {' '}· Letzter Versuch: {formatAge(job.last_ran_at)}
          </li>
        ))}
      </ul>
    </div>
  )
}
