import { getUnhealthyJobs, SYSTEM_HEALTH_WINDOW_HOURS } from '@/lib/dashboard/system-health'

function formatAge(iso: string | null): string {
  if (!iso) return 'unbekannt'
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'vor weniger als 1 Std.'
  return `vor ${hours} Std.`
}

export async function SystemHealthBar() {
  const unhealthy = await getUnhealthyJobs()

  if (unhealthy.length === 0) return null

  return (
    <div className="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-warning-700 dark:text-warning-400 mb-1">
        System-Warnungen
      </p>
      <ul className="space-y-1">
        {unhealthy.map(job => (
          <li key={job.job_name} className="text-sm text-warning-800 dark:text-warning-300">
            ⚠ {job.job_name}: {job.failure_count} Fehler in {SYSTEM_HEALTH_WINDOW_HOURS} Std.
            {' '}· Letzter Versuch: {formatAge(job.last_ran_at)}
          </li>
        ))}
      </ul>
    </div>
  )
}
