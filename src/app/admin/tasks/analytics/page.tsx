/**
 * Legacy URL — standalone task analytics page removed (Phase AD).
 * Stats that matter live on /admin/tasks stat cards + /admin/analyse.
 */

import { redirect } from 'next/navigation'
import { ROUTES } from '@/config/routes'

export default function TaskAnalyticsRedirectPage() {
  redirect(ROUTES.admin.tasks)
}
