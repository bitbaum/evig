import { redirect } from 'next/navigation'

/**
 * Zeiterfassung is an employee tool and lives in the admin area now
 * (/admin/zeiterfassung, "Heute" group + mobile bottom nav). This dashboard
 * route only redirects legacy links/bookmarks there.
 */
export default function DashboardTimecardsRedirect() {
  redirect('/admin/zeiterfassung')
}
