import { redirect } from 'next/navigation'

/**
 * The own-timecard editor lives at /dashboard/timecards (one place to fill your
 * own card). This admin route used to render a second copy of that same editor
 * plus the time-off approvals — both now live elsewhere (editor → dashboard,
 * time-off approvals → /admin/team/approvals). Redirect legacy links there.
 */
export default function AdminTimecardsRedirect() {
  redirect('/dashboard/timecards')
}
