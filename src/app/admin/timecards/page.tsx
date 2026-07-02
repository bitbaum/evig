import { redirect } from 'next/navigation'

/**
 * The own-timecard editor lives at /admin/zeiterfassung ("Heute" group).
 * Time-off approvals live at /admin/team/approvals. Redirect legacy links.
 */
export default function AdminTimecardsRedirect() {
  redirect('/admin/zeiterfassung')
}
