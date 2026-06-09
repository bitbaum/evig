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

  let unhealthy: JobHealth[] = []

  try {
    const result = await db.execute(sql`
      SELECT
        job_name,
        COUNT(*) FILTER (WHERE success = false) AS failure_count,
        MAX(ran_at) AS last_ran_at
      FROM ${sql.raw(table)}
      WHERE ran_at >= NOW() - (${WINDOW_HOURS} || ' hours')::interval
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
    <div className="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-warning-700 dark:text-warning-400 mb-1">
        System-Warnungen
      </p>
      <ul className="space-y-1">
        {unhealthy.map(job => (
          <li key={job.job_name} className="text-sm text-warning-800 dark:text-warning-300">
            ⚠ {job.job_name}: {job.failure_count} Fehler in {WINDOW_HOURS} Std.
            {' '}· Letzter Versuch: {formatAge(job.last_ran_at)}
          </li>
        ))}
      </ul>
    </div>
  )
}
